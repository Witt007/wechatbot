
import { Configuration, OpenAIApi, CreateCompletionRequest, CreateCompletionResponse } from "openai";
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import axios, { AxiosResponse, AxiosRequestHeaders, AxiosHeaders } from "axios";
import { outputLog } from "../logs";
import dotenv from 'dotenv'
dotenv.config();
import { database } from "../../data";
function initOpenAI(): OpenAIApi {
  const config: Configuration = new Configuration({
    //organization: "Witt",
    apiKey: status.apikey,
  });
  return new OpenAIApi(config);
}
const configTB = database.createTable("configMsg")
const chatRecordsTB = database.createTable("chatRecords")
type statusType = {
  start: boolean,
  talkInRoom: boolean,
  talkWith: string[],
  noRules: boolean,
  randomness: number,frequency?:number,
  n: number,
  maxLenght: number,
  apikey?: string
}
let status: statusType = {
  start: true,
  talkInRoom: false,
  talkWith: [], noRules: false
  , randomness: 0, n: 1,
  apikey: process.env.OPENAI_APIKEY, maxLenght: 500
}
let openai = initOpenAI();


function trimStringReverse(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return str.slice(-(maxLength))
  } else {
    return str
  }
}



export async function responseMsg(bot: WechatyInterface, msg: MessageInterface) {
  let text = msg.text();
  let talker = msg.talker();
  const alias = talker.name() || (await talker.alias()) || ''
  const currentUserName = bot.currentUser.name() || (await bot.currentUser.alias()) || ''
  console.log('talker.name', alias);

  let phones = await talker.phone()
  let isSentByMe = msg.self();
  const myself = currentUserName;//msg.listener()?.name()
  /*   msg.toSayable().then((say) => {//相当于拷贝人家的文字从而转发
      console.log('sayable', say);
    }) */
  const MentionedMe = await msg.mentionSelf();
  const room = await msg.room();
  let roomMember = await room?.memberAll?.();
  let roomMembers_serilizable = roomMember?.map(async (contact) => {
    const name = contact.name(),
      city = contact.city(),
      gender = contact.gender()?.toString()
      , phones = await contact.phone()
    return { name, city, gender, phones }
  })
  const date = msg.date();
  console.log('isSentByMe', isSentByMe, 'mention me', MentionedMe);

  const writeConf=()=> configTB.writeData(currentUserName, JSON.stringify(status)).then((a) => {
    console.log('write config data ', a);
  });
  if (isSentByMe) {
    switch (true) {
      case /^stop$/.test(text):
        status.start = false;
        return writeConf();
      case /^start$/.test(text):
        status.start = true;
        return writeConf();
      case /^not room$/.test(text):
        status.talkInRoom = false;
        return writeConf();
      case /^room$/.test(text):
        status.talkInRoom = true;
        return writeConf();
      case /@(.*)/g.test(text):
        const at = text.replace(/@/g, '');
        status.talkWith.push(at);
        return writeConf();
      case /not@(.*)/g.test(text):
        const notAt = text.replace(/not@/g, '');
        status.talkWith = status.talkWith.filter((v) => v != notAt);
        return writeConf();
      case /^@$/.test(text):
        status.noRules = true;
        return writeConf();
      case /^0$/.test(text):
        status.noRules = false;
        return writeConf();
      case /^r\d+$/.test(text):
        status.randomness = Number(text.replace('r', ''));
        return writeConf();
      case /^n\d+$/.test(text):
        status.n = Number(text.replace('n', ''));
        return writeConf();
      case /^f-?\d+$/.test(text):
        status.frequency = Number(text.replace('f', ''));
        return writeConf();
      case /^key.*/.test(text):
        status.apikey = text.replace('key', '');
        openai = initOpenAI();
        return writeConf();
      case /^l\d+$/.test(text):
        status.maxLenght = Number(text.replace('l', ''));
        return writeConf();

      default:
        break;
    }
   
  }


  if (msg.type() === bot.Message.Type.ChatHistory || msg.type() === bot.Message.Type.MiniProgram || msg.type() === bot.Message.Type.GroupNote
    || msg.type() === bot.Message.Type.Post) {
    return console.log('msg.type', msg.type());

  }

  async function useRules() {
    const datastr = await configTB.readData(currentUserName);
    const data: statusType = JSON.parse(datastr||"{}")

    Object.keys(data).length && (status = data) || configTB.writeData(currentUserName, JSON.stringify(status));

    return status.start && (
      /^( ).*( )$/.test(text) || !isSentByMe &&
      (status.noRules || status.talkWith.includes(talker.name()) || status.talkInRoom && room || MentionedMe))
  }
  
 await useRules().then(async (stat) => {
    console.log('configtb', status);


    if (<boolean>stat) {
      const headers: AxiosRequestHeaders = new AxiosHeaders();
      headers.setAuthorization('Bearer ' + status.apikey);
      headers.setContentType('application/json');

      const chatHistory = await chatRecordsTB.readData(alias);
      const trimendText = text.trimEnd()
      const punctuation = /.*(\?|？|\.|。|!|！)$/g.test(trimendText); //doing trimend,because of /( ) ( )/ 
      const prompt =chatHistory + '<|endoftext|>' +
        (punctuation ? text : (/.*吗$/.test(trimendText) ? trimendText + "？" : trimendText + "."));
      const Lm = ["gpt-4", 'text-davinci-003', 'gpt-3.5-turbo']
console.log('发送文本',trimStringReverse(prompt,status.maxLenght));


      //@ts-ignore
      const completionBody: CreateCompletionRequest = {
        max_tokens: status.maxLenght,
        model: Lm[1],
        prompt:trimStringReverse(prompt,status.maxLenght), temperature: status.randomness,
        //top_p: 1,
        frequency_penalty: status.frequency,
        presence_penalty: 2, n: status.n,
        //stop: "\n",
      }
      const res: CreateCompletionResponse = /* await axios.post(`https://api.openai.com/v1/engines/${Lm[1]}/completions`,
        completionBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${status.apikey}`
        }
      }).then((res: AxiosResponse) => {
        console.log('status', res.status);

        if (res.status == 200) {
          return res.data;
        }

      }).catch((reson) => console.log('requesting openai failed', reson) 
      )*/
        await openai.createCompletion(completionBody).then((res) => {
          return res.data
        })


      //msg.say(say);

      res && console.log('it said', res.object, res.usage?.total_tokens, 'prompt_tokens',
        res.usage?.prompt_tokens, 'completion_tokens', res.usage?.completion_tokens);

      if (res?.choices) {
        const texts = await res.choices.map((choice) => {
          const resText = choice.text?.trim();
          resText && msg.say(resText.replace(/(.*)(\?|？|\.|。|!|！)$/, '$1'));
          return resText
        });
        console.log('是否有alias值', alias,prompt +texts.join(''));

        chatRecordsTB.writeData(alias, prompt + texts?.join(''));
        outputLog(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + texts[0], "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });
      } else console.log('requesting OpenAI server failed!');


    }
  })
}