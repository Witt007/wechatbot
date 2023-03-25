"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wechaty_1 = require("wechaty");
const wechaty_puppet_padlocal_1 = require("wechaty-puppet-padlocal");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_1 = require("openai");
const router = express_1.default.Router({ caseSensitive: true });
const axios_1 = __importStar(require("axios"));
//const bot = initBot();
const openai = initOpenAI();
class Database {
    constructor(databaseName) {
        this.tables = new Map();
        this.databaseName = databaseName;
    }
    createTable(tablename) {
        return new Table(tablename);
    }
    deleteTable(tablename) {
        const table = this.tables.get(tablename);
        if (table) {
            try {
                // table.delete()
            }
            catch (error) {
                console.log('failed to delete table', error);
            }
        }
    }
}
class Table {
    constructor(tablename) {
        this.dataTemplate = JSON.stringify({ users: {}, msgRecord: {} });
        this.tablename = tablename;
    }
    readFile() {
        const self = this;
        return new Promise((resolve) => {
            const userpath = path_1.default.join(process.cwd(), 'data/', self.tablename + '.json');
            fs_1.default.access(userpath, fs_1.default.constants.F_OK, (error) => {
                if (error) {
                    fs_1.default.writeFile(userpath, '{}', {}, (err) => {
                        console.log(this.tablename, 'failed to read');
                        readFile();
                    });
                }
                else
                    readFile();
                function readFile() {
                    fs_1.default.readFile(userpath, function (error, data) {
                        const datastr = data.toString();
                        console.log(typeof datastr);
                        if (datastr) {
                            resolve(JSON.parse(datastr));
                        }
                        else
                            console.log('failed to read the json file'), resolve(JSON.parse(self.dataTemplate));
                    });
                }
            });
        });
    }
    delete() {
    }
    writeData(data) {
        const dataStr = JSON.stringify(data);
        const userpath = path_1.default.join(process.cwd(), 'data/', this.tablename + '.json');
        fs_1.default.writeFile(userpath, dataStr, {}, function (error) {
            error && console.log('failed to write user data', error) || (2);
        });
    }
    readData() {
        return this.readFile();
    }
}
function getUsers(tb) {
    return tb.readData();
}
function setUsers(data) {
    return tb.writeData(data);
}
function deactiveUser(token) {
    return __awaiter(this, void 0, void 0, function* () {
        getUsers(tb).then((data) => {
            data[token].isLoggedOut = true;
            setUsers(data);
        });
    });
}
function getOrSetBotToken(req, res) {
    let token = req.cookies["chatbotToken"];
    if (!token) {
        token = "Witt:" + Math.random().toString();
        res.cookie("chatbotToken", token); //.setHeader("Set-Cookie", ["chatbotToken=" + token]);
        console.log("cookie is set", req.cookies["chatbotToken"]);
    }
    else {
    }
    console.log("client token", token);
    return token;
}
function getInitBotListenners() {
    return {
        onerror(err) {
            this.logout();
        },
        onlogin(self) {
            console.log("success login"); //todo 只要有请求就被迫下线
            const info = weakMapUsrRequestInfo.get(this);
            if (info === null || info === void 0 ? void 0 : info.token) {
                getUsers(tb).then((data) => __awaiter(this, void 0, void 0, function* () {
                    const alias = yield self.alias();
                    console.log('has ..........................', alias, data);
                    data[info.token] = { isLoggedOut: false, token: info.token, name: alias };
                    setUsers(data);
                }));
            }
            else
                console.log('witt:encoutered error Onlogin');
        },
        onlogout() {
            var _a;
            console.log("logout");
            const token = (_a = weakMapUsrRequestInfo.get(this)) === null || _a === void 0 ? void 0 : _a.token;
            token &&
                (deactiveUser(token), mapBots.delete(token)) || console.log('witt:encoutered error Onlogout');
        },
        onscan(qrcode, status) {
            var _a;
            console.log("onscan");
            let res = (_a = weakMapUsrRequestInfo.get(this)) === null || _a === void 0 ? void 0 : _a.res;
            if (status == wechaty_1.ScanStatus.Waiting || status == wechaty_1.ScanStatus.Timeout) {
                const qrcodeImageUrl = [
                    "https://api.qrserver.com/v1/create-qr-code/?data=",
                    encodeURIComponent(qrcode),
                ].join("");
                console.log("Scanning...", qrcodeImageUrl);
                https_1.default
                    .get(qrcodeImageUrl, function (req) {
                    req.on("data", (chunk) => {
                        console.log('chunk', chunk);
                        res === null || res === void 0 ? void 0 : res.status(200).type("jpeg").end(chunk);
                    });
                })
                    .on("error", (error) => {
                    console.log("https.get", error);
                });
            }
        },
        onmessage(msg) {
            if (msg.type() !== this.Message.Type.Text)
                return;
            if (!msg.text()) {
                //return;
            }
            console.log("received a message", msg
                .talker()
                .name());
            responseMsg(this, msg);
        }
    };
}
router.get("/login", function (req, res) {
    const token = req.cookies['chatbotToken'];
    const bot = mapBots.get(token);
    //todo find actived bot
    if (bot && bot.isLoggedIn)
        res.end("You have logged in!");
    else
        bot && mapBots.delete(token), createAndRunBot(getOrSetBotToken(req, res)).then((bot) => {
            bindBotEvt.call(bot, getInitBotListenners());
            mapBots.set(token, bot);
            weakMapUsrRequestInfo.set(bot, { token, res });
            console.log('create and run bot successfully');
        });
    //what time?
});
function outputLog(token = "alternative", obj) {
    /*   const args: any[] = Object.entries(obj).map((v, i) => {
        return `Witt: the property ${v[0]} value is ${v[1]}\n`;
      }); */
    tbLogs.readData().then((data) => {
        data[token || 'alternative'] += 'newer:' + JSON.stringify(obj);
        tbLogs.writeData(data);
        console.log('logs', obj);
    });
}
function bindBotEvt(listeners) {
    this.once("scan", listeners.onscan);
    this.once("stop", () => {
        console.log("Bot stopped");
    });
    this.once("login", listeners.onlogin);
    this.once("logout", listeners.onlogout);
    this.on("message", listeners.onmessage);
    this.on("error", listeners.onerror);
}
function createAndRunBot(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const bot = wechaty_1.WechatyBuilder.build({
            //@ts-ignore
            puppet: new wechaty_puppet_padlocal_1.PuppetPadlocal({ token: "67f5cc1db0f84923827097fd1bfe6e7d" }),
            name: "wechat" + token,
            /*  puppetOptions: {
               uos: true,
               //token,
             }, */
        });
        console.log("entered");
        yield bot.start().then(() => {
            console.log("chatbot started");
            return bot;
        }).catch((error) => {
            console.log("Witt:started error", error);
            bot.start();
        });
        return bot;
    });
}
function initOpenAI() {
    const config = new openai_1.Configuration({
        organization: "Witt",
        apiKey: "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",
    });
    return new openai_1.OpenAIApi(config);
}
function responseMsg(bot, msg) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let text = msg.text();
        let talker = yield msg.talker();
        let alias = yield talker.name();
        let phones = yield talker.phone();
        let isSentByMe = msg.self();
        const myself = bot.currentUser.name; //msg.listener()?.name()
        /*   msg.toSayable().then((say) => {//相当于拷贝人家的文字从而转发
            console.log('sayable', say);
          }) */
        const MentionedMe = yield msg.mentionSelf();
        const room = yield msg.room();
        const date = msg.date();
        console.log('isSentByMe', isSentByMe);
        if (!text) {
            return;
        }
        if (/^( )/.test(text) || !isSentByMe) {
            const headers = new axios_1.AxiosHeaders();
            headers.setAuthorization('Bearer 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');
            headers.setContentType('application/json');
            //@ts-ignore
            const data = {
                max_tokens: 2000,
                prompt: text, temperature: 0.5,
                //top_p: 1,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                // stop: ["Witt","YOU"],
            };
            const Lm = ["gpt-4", 'text-davinci-003'];
            const res = yield axios_1.default.post(`https://api.openai.com/v1/engines/${Lm[0]}/completions`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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`
                }
            }).then((res) => {
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
            const resText = res.choices[0].text;
            resText && msg.say('' + resText);
            outputLog((_a = weakMapUsrRequestInfo.get(bot)) === null || _a === void 0 ? void 0 : _a.token, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + resText, "是否@了我：": MentionedMe, '群聊：': (_b = room === null || room === void 0 ? void 0 : room.memberAll) === null || _b === void 0 ? void 0 : _b.call(room) });
        }
    });
}
exports.default = router;
//if logged out then pop it out from users;
//let currentBot:WechatyInterface;
//only init Bots with logged in
function InitBots(map, mapBotToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const userTB = yield getUsers(tb);
        userTB && Object.values(userTB).map((user) => {
            user.isLoggedOut || createAndRunBot(user.token).then((bot) => {
                bindBotEvt.call(bot, getInitBotListenners());
                map.set(user.token, bot);
                mapBotToken.set(bot, { token: user.token });
            });
        });
    });
}
const database = new Database('chatbot');
const tb = database.createTable('users');
const tbLogs = database.createTable('logs');
const mapBots = new Map();
const weakMapUsrRequestInfo = new WeakMap();
InitBots(mapBots, weakMapUsrRequestInfo);
