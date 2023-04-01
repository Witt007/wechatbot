
import { Configuration, OpenAIApi, CreateCompletionRequest, CreateCompletionResponse } from "openai";
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import axios, { AxiosResponse, AxiosRequestHeaders, AxiosHeaders } from "axios";
import { outputLog } from "../logs";
import dotenv from 'dotenv'
dotenv.config();
import { database } from "../../data";
export function initOpenAI(): OpenAIApi {
  const config: Configuration = new Configuration({
    organization: "Witt",
    apiKey: process.env.OPENAI_APIKEY,
  });
  return new OpenAIApi(config);
}
const configTB = database.createTable("configMsg")
type statusType = {
  start: boolean,
  talkInRoom: boolean,
  talkWith: string[],
  noRules: boolean,
  randomness: number,
  n: number
}
let status: statusType = {
  start: true,
  talkInRoom: false,
  talkWith: [], noRules: false
  , randomness: 0, n: 1
}


export async function responseMsg(bot: WechatyInterface, msg: MessageInterface) {
  let text = msg.text();
  let talker = await msg.talker();
  let alias = await talker.name() as string
  let phones = await talker.phone()
  let isSentByMe = msg.self();
  const myself = bot.currentUser.name()//msg.listener()?.name()
  /*   msg.toSayable().then((say) => {//相当于拷贝人家的文字从而转发
      console.log('sayable', say);
    }) */
  const MentionedMe = await msg.mentionSelf();
  const room = await msg.room();
  let roomMember = await room?.memberAll?.();
  let roomMembers_serilizable = roomMember?.map(async (contact) => {
    const name = contact.name(),
      city = contact.city(),
      gender = contact.gender().toString()
      , phones = await contact.phone()
    return { name, city, gender, phones }
  })
  const date = msg.date();
  console.log('isSentByMe', isSentByMe);

  function setRules() {
    if (isSentByMe) {
      switch (true) {
        case /^stop$/g.test(text):
          status.start = false;
          break;
        case /^start$/g.test(text):
          status.start = true;
          break;
        case /^not room$/g.test(text):
          status.talkInRoom = false;
          break;
        case /^room$/g.test(text):
          status.talkInRoom = true;
          break;
        case /@(.*)/g.test(text):
          const at = text.replace(/@/g, '');
          status.talkWith.push(at);
          break;
        case /not@(.*)/g.test(text):
          const notAt = text.replace(/not@/g, '');
          status.talkWith = status.talkWith.filter((v) => v != notAt);
          break;
        case /^@$/g.test(text):
          status.noRules = true;
          break;
        case /^0$/g.test(text):
          status.noRules = false;
          break;
        case /^r$/g.test(text):
          status.randomness = Number(text.replace('r', ''));
          break;
        case /^n$/g.test(text):
          status.n = Number(text.replace('n', ''));
          break;

        default:
          break;
      }
      configTB.writeData(bot.name(), status).then((a)=>{console.log('write config data ',a);
      });
    }
  }

  setRules()

  if (!text) {
    return
  }

  async function useRules() {
    const data: statusType = await configTB.readData(bot.name());
    console.log('configtb',data);
    
    data &&Object.keys(data).length&& (status = data) || configTB.writeData(bot.name(), status);
    return status.start && (
      /^( ).*( )$/.test(text) || !isSentByMe && (status.noRules || status.talkWith.includes(talker.name()) || status.talkInRoom && room))
  }
  useRules().then(async (stat) => {
console.log(status);

    if (<boolean>stat) {
      const headers: AxiosRequestHeaders = new AxiosHeaders();
      headers.setAuthorization('Bearer ' + process.env.OPENAI_APIKEY);
      headers.setContentType('application/json');
      //@ts-ignore
      const completionBody: CreateCompletionRequest = {
        max_tokens: 3800,
        prompt: text, temperature: status.randomness,
        //top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0, n: status.n,
         stop: "\n",
      }
      const Lm = ["gpt-4", 'text-davinci-003', 'gpt-3.5-turbo']
      const res: CreateCompletionResponse = await axios.post(`https://api.openai.com/v1/engines/${Lm[1]}/completions`,
        completionBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_APIKEY}`
        }
      }).then((res: AxiosResponse) => {
        console.log('status', res.status);

        if (res.status == 200) {
          return res.data;
        }

      }).catch((reson) => console.log('requesting openai failed', reson)
      )
      /*   openai.createCompletion({
          prompt: text ||
            "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: I'd like to cancel my subscription.\nAI:",
          model: "text-davinci-003",
          //prompt: "I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with \"Unknown\".\n\nQ: What is human life expectancy in the United States?\nA: Human life expectancy in the United States is 78 years.\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower was president of the United States in 1955.\n\nQ: Which party did he belong to?\nA: He belonged to the Republican Party.\n\nQ: What is the square root of banana?\nA: Unknown\n\nQ: How does a telescope work?\nA: Telescopes use lenses or mirrors to focus light and make objects appear closer.\n\nQ: Where were the 1992 Olympics held?\nA: The 1992 Olympics were held in Barcelona, Spain.\n\nQ: How many squigs are in a bonk?\nA: Unknown\n\nQ: Where is the Valley of Kings?\nA:",
          temperature: 0,
          max_tokens: 100,
          top_p: 1,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          stop: ["\n"],
        }, { headers }).then((res) => {
          let say = res.data.choices[0].text || "";
          console.log('it said', res.data.choices);
      
        }) */


      //msg.say(say);

      console.log('it said', res.choices);
      const texts = res.choices.map((choice) => {
        const resText = choice.text?.trim();
        resText && msg.say(resText);
        return resText
      });

      outputLog(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + texts[0], "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });


    }
  })
}