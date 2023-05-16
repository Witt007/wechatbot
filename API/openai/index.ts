
import { Configuration, OpenAIApi, CreateCompletionRequest, CreateCompletionResponse, ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import axios, { AxiosResponse, AxiosRequestHeaders, AxiosHeaders } from "axios";
import { outputLog } from "../logs";
import dotenv from 'dotenv'
dotenv.config();
import { database } from "../../data";
function initOpenAI(): OpenAIApi {
  const config: Configuration = new Configuration({
    organization: "Witt",
    apiKey: status.apikey,//username:"witt007@qq.com",password:"robertwitt"
  });
  return new OpenAIApi(config);
}
const configTB = database.createTable("configMsg")
const chatRecordsTB = database.createTable("chatRecords");
type statusType = {
  start: boolean,
  talkInRoom: boolean,
  talkWith: string[],
  noRules: boolean;
  IsChatMode?: number;

  emoji: string[]
  newTopic?: string;

  randomness: number, frequency?: number,
  presence_penalty: number,
  top_p: number,
  stop?: string, n: number;
  maxLenght: number,
  apikey?: string,
}
let status: statusType = {
  start: true,
  talkInRoom: false,
  talkWith: [], noRules: false
  , randomness: 0, n: 1, presence_penalty: 0, top_p: 1, stop: "\n", frequency: 0,
  maxLenght: 500, IsChatMode: 0,
  emoji: [],
  newTopic: "",
  apikey: process.env.OPENAI_APIKEY,
}
//let openai = initOpenAI();


function trimStringReverse(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return str.slice(-(maxLength))
  } else {
    return str
  }
}

function getEmoji() {
  const emoji = (status.emoji[Math.round(status.emoji.length * 2 * (1 - Math.random()))] || "");
  return emoji
}

exports.responseMsg = async function responseMsg(bot: WechatyInterface, msg: MessageInterface) {
  if (msg.type() === bot.Message.Type.ChatHistory || msg.type() === bot.Message.Type.MiniProgram || msg.type() === bot.Message.Type.GroupNote
    || msg.type() === bot.Message.Type.Post) {
    return console.log('msg.type', msg.type());

  }
  let text = msg.text();
  let talker = msg.talker();
  const alias = talker.name() || (await talker.alias()) || ''
  const currentUserName = bot.currentUser.name() || (await bot.currentUser.alias()) || ''

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
  !isSentByMe && console.log('type',msg.type,"当前用户：", currentUserName, 'talker.name', alias, '当前话题：', status.newTopic,'isRoom',room, 'mention me', MentionedMe, text);

  const writeConf = () => configTB.writeData(currentUserName, JSON.stringify(status)).then((a) => {
    console.log('write config data ', '配置信息', status);
  });



  if (isSentByMe) {
    switch (true) {
      case /^chat\d{1}$/.test(text):
        status.IsChatMode = Number(text.replace('chat', ''));
        return writeConf();
      case /^stopR$/.test(text):
        status.start = false;
        return writeConf();
      case /^startR$/.test(text):
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
      case /^rand.+$/.test(text):
        status.randomness = Number(text.replace('rand', ''));
        return writeConf();
      case /^num.+$/.test(text):
        status.n = Number(text.replace('num', ''));
        return writeConf();
      case /^penaltyF.+$/.test(text):
        status.frequency = Number(text.replace('penaltyF', ''));
        return writeConf();
      case /^key.*/.test(text):
        status.apikey = text.replace('key', '');
        //openai = initOpenAI();
        return writeConf();
      case /^length.+$/.test(text):
        status.maxLenght = Number(text.replace('length', ''));
        return writeConf();
      case /^penalty.+$/.test(text):
        status.presence_penalty = Number(text.replace('penalty', ''));
        return writeConf();
      case /^stop.+$/.test(text):
        status.stop = text.replace('stop', '');
        if (status.stop == "undefined") {
          status.stop = undefined;
        } else if (status.stop == "null") {
          status.stop = '\n';
        }
        return writeConf();
      case /^topP.+$/.test(text):
        status.top_p = Number(text.replace('topP', ''));
        return writeConf();
      case /^emoji.+$/.test(text):
        status.emoji.push(text.replace('emoji', ''));
        return writeConf();
      case /^topic.+$/.test(text):
        status.newTopic = text.replace('topic', '');
        return writeConf();

      default:
        break;
    }

  }


  async function useRules() {
    const datastr = await configTB.readData(currentUserName);
    const data: statusType = JSON.parse(datastr || "{}")

    Object.keys(data).length && (status = data) || configTB.writeData(currentUserName, JSON.stringify(status));

    return status.start && (
      /^( ).*( )$/.test(text) ||
      (status.noRules || status.talkWith.includes(alias) || status.talkInRoom && room || MentionedMe))
  }

  await useRules().then(async (stat) => {

    if (<boolean>stat) {

      !status.emoji && (status.emoji = [])
      // the status is temporary this time
      if (status.emoji.find((v) => text.startsWith(v))) {
        status.IsChatMode = 0;
      }
      if (msg.type() === bot.Message.Type.Transfer) {
        text = '我给你转了一笔钱，算是对你的爱意'
      } else if (msg.type() === bot.Message.Type.Recalled) {
        text = '撤回了一条消息'
      }
      //区分是多人对话还是双人对话
      const topic = (room ? alias + "Room" : alias) + status.newTopic;
      const headers: AxiosRequestHeaders = new AxiosHeaders();
      headers.setAuthorization('Bearer ' + status.apikey);
      headers.setContentType('application/json');

      const chatDatastr = await chatRecordsTB.readData(currentUserName);
      const chatData = JSON.parse(chatDatastr || "{}");
      const currTalkerRecords: ChatCompletionRequestMessage[] = chatData[topic] || [];
      const trimendText = text.trimEnd()
      const punctuation = /.*(\?|？|\.|。|!|！)$/g.test(trimendText); //doing trimend,because of /( ) ( )/ 

      const Lm = ["gpt-4", 'text-davinci-003-playground', 'gpt-3.5-turbo']

      if (!/^( ).*( )$/.test(text)&&isSentByMe) {
        return writeResponse(text)
      }

      function writeResponse(messages: string) {
        currTalkerRecords.push({ content: messages, role: "assistant" });
        chatData[topic] = currTalkerRecords
        messages && chatRecordsTB.writeData(currentUserName, JSON.stringify(chatData));
      }

      async function requestTextCompletion() {
        currTalkerRecords.push({
          content:
            (punctuation ? (/.*(\.{2,})|(。{2,})$/.test(trimendText) ? text.replace(/(\.{2,})|(。{2,})$/, '') : text) ? "" : text : (/.*吗$/.test(trimendText) ? text + "？" : text + ".")), role: "user"
        })
        const prompt = currTalkerRecords.map((message, i) => {
          const base = message.content
          if (i % 2 == 0) {
            return '<|endoftext|>' + base
          }
          return base + "" //
        }).join('')
        console.log('TextMode_待发送的信息', trimStringReverse(prompt, status.maxLenght));

        //@ts-ignore
        const completionBody: CreateCompletionRequest =
        {
          max_tokens: status.maxLenght,
          //model: Lm[1],
          prompt: trimStringReverse(prompt, status.maxLenght), temperature: status.randomness,
          top_p: status.top_p,
          frequency_penalty: status.frequency,
          presence_penalty: status.presence_penalty, n: status.n,
          stop: status.stop,
        }
        const res: CreateCompletionResponse = await axios.post(`https://api.openai.com/v1/engines/${Lm[1]}/completions`,
          completionBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${status.apikey?.trim()}`
          }
        }).then((res: AxiosResponse) => {
          console.log('status', res.status);

          if (res.status == 200) {
            return res.data;
          }

        }).catch((reson) => console.log('requesting openai failed', reson)
        )
        /* await openai.createCompletion(completionBody).then((res) => {
          return res.data
        }) */


        //msg.say(say);

        /* res && console.log('it said', res.object, res.usage?.total_tokens, 'prompt_tokens',
          res.usage?.prompt_tokens, 'completion_tokens', res.usage?.completion_tokens); */

        if (res?.choices) {
          const texts = res.choices.map((choice) => {
            const resText = choice.text//?.trim();
            resText && msg.say(resText.trim().replace(/(.*)(\?|？|\.|。|!|！)$/, '$1') + getEmoji());
            return resText
          })?.join('');
          console.log('响应后的信息：', alias, prompt + texts);

          writeResponse(texts)
          outputLog(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + texts, "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });
        } else console.log('requesting OpenAI server failed!');
      }
      async function requestChatCompletion() {
        currTalkerRecords.push({ role: "user", content: (punctuation ? text : (/.*吗$/.test(trimendText) ? text + "？" : text + ".")) })
        const res: CreateChatCompletionResponse = await axios.post<CreateChatCompletionResponse>(`https://api.openai.com/v1/chat/completions`,
          {
            messages: currTalkerRecords, model: Lm[2], stop: status.stop,
            frequency_penalty: status.frequency, presence_penalty: status.presence_penalty, max_tokens: status.maxLenght, n: status.n, temperature: status.randomness
          }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${status.apikey?.trim()}`
          }
        }).then((res: AxiosResponse) => {
          console.log('status', res.status);

          if (res.status == 200) {
            return res.data;
          }

        }).catch((reson) => console.log('requesting openai failed', reson)
        )
        if (res?.choices) {
          const messages = res.choices.map((choice) => {
            const content = choice.message?.content;
            //sending msg using the @ symbol such as @someone if the conversation with the talker is from Room  
            content && msg.say((room?'@'+alias+content:content) + getEmoji());
            return choice.message?.content
          })?.join('');
          outputLog(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + messages, "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });

          writeResponse(messages);
        }

      }



      switch (status.IsChatMode) {
        case 0:
          requestTextCompletion();
          break;
        case 1:
          requestChatCompletion()
          break;

        default: requestChatCompletion()
          break;
      }

    }
  })
}