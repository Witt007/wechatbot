import express, { Response, Request } from "express";
import { ContactSelf, ScanStatus, WechatyBuilder } from "wechaty";
import { PuppetPadlocal } from 'wechaty-puppet-padlocal'
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import https from "https";
import { IncomingMessage } from "http";
import fs from "fs";
import path from "path";
import { Configuration, OpenAIApi, CreateCompletionRequest, CreateCompletionResponse } from "openai";
import { Blob } from "buffer";
import { WechatyEventListenerMessage, WechatyEventListenerScan, WechatyEventListenerLogin, WechatyEventListenerLogout, WechatyEventListenerError } from "wechaty/dist/esm/src/schemas/wechaty-events";
const router = express.Router({ caseSensitive: true });
import axios, { AxiosResponse, AxiosRequestHeaders, AxiosHeaders } from "axios";
//const bot = initBot();
const openai = initOpenAI();

interface tableData {

}
type username = string
type user = { name?: string, token: string, isLoggedOut?: boolean }

interface userData extends tableData {
  [key: username]: user
}
type allBots = Map<username, WechatyInterface>;
type mapUsrRequestInfo = WeakMap<WechatyInterface, { token: username, res?: Response }>
interface log extends tableData {
  [key: username]: string
}
type botListenners = {
  onmessage: WechatyEventListenerMessage,
  onscan: WechatyEventListenerScan,
  onlogin: WechatyEventListenerLogin,
  onlogout: WechatyEventListenerLogout,
  onerror: WechatyEventListenerError
}
class Database {
  private tables: Map<string, Table> = new Map();
  databaseName: string
  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }
  createTable(tablename: string): Table {
    return new Table(tablename);
  }

  deleteTable(tablename: string) {
    const table = this.tables.get(tablename);
    if (table) {
      try {
        // table.delete()
      } catch (error) {
        console.log('failed to delete table', error);

      }

    }
  }
}


class Table {
  tablename: string
  constructor(tablename: string) {
    this.tablename = tablename;

  }

  private dataTemplate = JSON.stringify({ users: {}, msgRecord: {} })

  private readFile<T extends tableData>(): Promise<T> {
    const self = this;
    return new Promise<T>((resolve) => {
      const userpath = path.join(process.cwd(), 'data/', self.tablename + '.json');
      fs.access(userpath, fs.constants.F_OK, (error: any) => {

        if (error) {

          fs.writeFile(userpath, '{}', {}, (err) => {
            console.log(this.tablename, 'failed to read');
            readFile()
          })
        } else readFile()
        function readFile() {

          fs.readFile(userpath, function (error, data) {
            const datastr = data.toString(); console.log(typeof datastr);

            if (datastr) {
              resolve(JSON.parse(datastr));

            } else console.log('failed to read the json file'), resolve(JSON.parse(self.dataTemplate))
          })
        }


      })
    })

  }
  delete() {

  }
  writeData<T extends tableData>(data: T) {
    const dataStr = JSON.stringify(data);
    const userpath = path.join(process.cwd(), 'data/', this.tablename + '.json')
    fs.writeFile(userpath, dataStr, {}, function (error) {
      error && console.log('failed to write user data', error) || (2)

    })



  }
  readData<T extends tableData>(): Promise<T> {
    return this.readFile<T>();
  }


}

function getUsers<T extends tableData>(tb: Table): Promise<T> {
  return tb.readData<T>();
}
function setUsers(data: userData) {
  return tb.writeData(data);
}
async function deactiveUser(token: username) {
  getUsers<userData>(tb).then((data) => {
    data[token].isLoggedOut = true;
    setUsers(data);
  })
}

const database = new Database('chatbot');
const tb = database.createTable('users');
const tbLogs = database.createTable('logs');
const mapBots: allBots = new Map()
const weakMapUsrRequestInfo: mapUsrRequestInfo = new WeakMap<WechatyInterface, { token: username, res?: Response }>();

function getOrSetBotToken(req: Request, res: Response): string {
  let token = req.cookies["chatbotToken"];
  if (!token) {
    token = "Witt:" + Math.random().toString();
    res.cookie("chatbotToken", token); //.setHeader("Set-Cookie", ["chatbotToken=" + token]);

    console.log("cookie is set", req.cookies["chatbotToken"]);
  } else {

  }
  console.log("client token", token);
  return token;
}

function getInitBotListenners(): botListenners {
  return {
    onerror(this: WechatyInterface, err) {
      this.logout()
    },
    onlogin(this: WechatyInterface, self: ContactSelf) {
      console.log("success login");//todo 只要有请求就被迫下线
      const info = weakMapUsrRequestInfo.get(this)
      if (info?.token) {
        getUsers<userData>(tb).then(async (data) => {
          const alias = await self.alias()
          console.log('has ..........................', alias, data);

          data[info.token] = { isLoggedOut: false, token: info.token, name: alias }
          setUsers(data);

        })
      } else console.log('witt:encoutered error Onlogin');

    },
    onlogout(this: WechatyInterface) {
      console.log("logout");
      const token = weakMapUsrRequestInfo.get(this)?.token
      token &&
        (deactiveUser(token), mapBots.delete(token)) || console.log('witt:encoutered error Onlogout');

    },
    onscan(this: WechatyInterface, qrcode: string, status) {
      console.log("onscan");
      let res = weakMapUsrRequestInfo.get(this)?.res

      if (status == ScanStatus.Waiting || status == ScanStatus.Timeout) {
        const qrcodeImageUrl: string = [
          "https://api.qrserver.com/v1/create-qr-code/?data=",
          encodeURIComponent(qrcode),
        ].join("");
        console.log("Scanning...", qrcodeImageUrl);
        https
          .get(qrcodeImageUrl, function (req: IncomingMessage) {
            req.on("data", (chunk: Buffer) => {
              console.log('chunk', chunk);

              res?.status(200).type("jpeg").end(chunk);
            });
          })
          .on("error", (error) => {
            console.log("https.get", error);
          });
      }
    },
    onmessage(this: WechatyInterface, msg: MessageInterface) {
      if (msg.type() !== this.Message.Type.Text) return
      if (!msg.text()) {
        //return;
      }
      console.log("received a message", msg
        .talker()
        .name());


      responseMsg(this, msg);
    }
  }
}

router.get("/login", function (req, res) {
  const token = req.cookies['chatbotToken']
  const bot = mapBots.get(token);
  //todo find actived bot

  if (bot && bot.isLoggedIn)
    res.end("You have logged in!");
  else
    bot && mapBots.delete(token), createAndRunBot(getOrSetBotToken(req, res)).then((bot) => {

      bindBotEvt.call(bot, getInitBotListenners())
      mapBots.set(token, bot);
      weakMapUsrRequestInfo.set(bot, { token, res }); console.log('create and run bot successfully');

    })
  //what time?
});



function outputLog(token: username = "alternative", obj: {}) {
  /*   const args: any[] = Object.entries(obj).map((v, i) => {
      return `Witt: the property ${v[0]} value is ${v[1]}\n`;
    }); */

  tbLogs.readData<log>().then((data: log) => {
    data[token || 'alternative'] += 'newer:' + JSON.stringify(obj);
    tbLogs.writeData<log>(data);
    console.log('logs', obj);
  })
}



function bindBotEvt(this: WechatyInterface, listeners: botListenners) {
  this.once("scan", listeners.onscan);
  this.once("stop", () => {
    console.log("Bot stopped");
  });

  this.once("login", listeners.onlogin);
  this.once("logout", listeners.onlogout);
  this.on("message", listeners.onmessage);
  this.on("error", listeners.onerror)
}
async function createAndRunBot(
  token: string
): Promise<WechatyInterface> {

  const bot = WechatyBuilder.build({
    //@ts-ignore
    puppet: new PuppetPadlocal({ token: "67f5cc1db0f84923827097fd1bfe6e7d" }),
    name: "wechat" + token,
    /*  puppetOptions: {
       uos: true,
       //token,
     }, */
  });
  console.log("entered");


  await bot.start().then(() => {
    console.log("chatbot started");
    return bot;
  }).catch((error) => {
    console.log("Witt:started error", error);
    bot.start();
  });

  return bot;
}

function initOpenAI(): OpenAIApi {
  const config: Configuration = new Configuration({
    organization: "Witt",
    apiKey: "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",
  });
  return new OpenAIApi(config);
}

async function responseMsg(bot: WechatyInterface, msg: MessageInterface) {
  let text = msg.text();
  let talker = await msg.talker();
  let alias = await talker.name() as string
  let phones = await talker.phone()
  let isSentByMe = msg.self();
  const myself = bot.currentUser.name//msg.listener()?.name()
  /*   msg.toSayable().then((say) => {//相当于拷贝人家的文字从而转发
      console.log('sayable', say);
    }) */
  const MentionedMe = await msg.mentionSelf();
  const room = await msg.room();
  const date = msg.date();
  console.log('isSentByMe', isSentByMe);

  if (!text) {
    return
  }
  if (/^( )/.test(text) || !isSentByMe) {
    const headers: AxiosRequestHeaders = new AxiosHeaders();
    headers.setAuthorization('Bearer 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');
    headers.setContentType('application/json');
    //@ts-ignore
    const data: CreateCompletionRequest = {
      max_tokens: 2000,
      prompt: text, temperature: 0.5,
      //top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      // stop: ["Witt","YOU"],
    }
    const Lm = ["gpt-4", 'text-davinci-003']
    const res: CreateCompletionResponse = await axios.post(`https://api.openai.com/v1/engines/${Lm[0]}/completions`,
      data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`
      }
    }).then((res: AxiosResponse) => {
      console.log('status', res.status);

      if (res.status == 200) {
        return res.data;
      }

    });
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
    const resText = res.choices[0].text
    resText && msg.say('' + resText);
    outputLog(weakMapUsrRequestInfo.get(bot)?.token, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + resText, "是否@了我：": MentionedMe, '群聊：': room?.memberAll?.() });


  }

}


export default router;

//if logged out then pop it out from users;

//let currentBot:WechatyInterface;




//only init Bots with logged in
async function InitBots(map: allBots, mapBotToken: mapUsrRequestInfo) {

  const userTB: userData = await getUsers<userData>(tb);
  userTB && Object.values(userTB).map((user: user) => {

    user.isLoggedOut || createAndRunBot(user.token).then((bot: WechatyInterface) => {
      bindBotEvt.call(bot, getInitBotListenners())
      map.set(user.token, bot);
      mapBotToken.set(bot, { token: user.token });
    })


  })
}
InitBots()



