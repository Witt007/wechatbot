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
const openai_1 = require("openai");
const axios_1 = __importStar(require("axios"));
const logs_1 = require("../logs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const data_1 = require("../../data");
function initOpenAI() {
    const config = new openai_1.Configuration({
        organization: "Witt",
        apiKey: status.apikey, //username:"witt007@qq.com",password:"robertwitt"
    });
    return new openai_1.OpenAIApi(config);
}
const configTB = data_1.database.createTable("configMsg");
const chatRecordsTB = data_1.database.createTable("chatRecords");
let status = {
    start: true,
    talkInRoom: false,
    talkWith: [], noRules: false,
    randomness: 0, n: 1, presence_penalty: 0, top_p: 1, stop: "\n", frequency: 0,
    maxLenght: 500, IsChatMode: 0,
    emoji: [],
    newTopic: "",
    apikey: process.env.OPENAI_APIKEY,
};
//let openai = initOpenAI();
function trimStringReverse(str, maxLength) {
    if (str.length > maxLength) {
        return str.slice(-(maxLength));
    }
    else {
        return str;
    }
}
function getEmoji() {
    const emoji = (status.emoji[Math.round(status.emoji.length * 2 * (1 - Math.random()))] || "");
    return emoji;
}
exports.responseMsg = function responseMsg(bot, msg) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.type() === bot.Message.Type.ChatHistory || msg.type() === bot.Message.Type.MiniProgram || msg.type() === bot.Message.Type.GroupNote
            || msg.type() === bot.Message.Type.Post) {
            return console.log('msg.type', msg.type());
        }
        let text = msg.text();
        let talker = msg.talker();
        const alias = talker.name() || (yield talker.alias()) || '';
        const currentUserName = bot.currentUser.name() || (yield bot.currentUser.alias()) || '';
        let phones = yield talker.phone();
        let isSentByMe = msg.self();
        const myself = currentUserName; //msg.listener()?.name()
        /*   msg.toSayable().then((say) => {//相当于拷贝人家的文字从而转发
            console.log('sayable', say);
          }) */
        const MentionedMe = yield msg.mentionSelf();
        const room = yield msg.room();
        let roomMember = yield ((_a = room === null || room === void 0 ? void 0 : room.memberAll) === null || _a === void 0 ? void 0 : _a.call(room));
        let roomMembers_serilizable = roomMember === null || roomMember === void 0 ? void 0 : roomMember.map((contact) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const name = contact.name(), city = contact.city(), gender = (_b = contact.gender()) === null || _b === void 0 ? void 0 : _b.toString(), phones = yield contact.phone();
            return { name, city, gender, phones };
        }));
        const date = msg.date();
        !isSentByMe && console.log('type', msg.type, "当前用户：", currentUserName, 'talker.name', alias, '当前话题：', status.newTopic, 'isRoom', room, 'mention me', MentionedMe, text);
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
                    }
                    else if (status.stop == "null") {
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
        function useRules() {
            return __awaiter(this, void 0, void 0, function* () {
                const datastr = yield configTB.readData(currentUserName);
                const data = JSON.parse(datastr || "{}");
                Object.keys(data).length && (status = data) || configTB.writeData(currentUserName, JSON.stringify(status));
                return status.start && (/^( ).*( )$/.test(text) ||
                    (status.noRules || status.talkWith.includes(alias) || status.talkInRoom && room || MentionedMe));
            });
        }
        yield useRules().then((stat) => __awaiter(this, void 0, void 0, function* () {
            if (stat) {
                !status.emoji && (status.emoji = []);
                // the status is temporary this time
                if (status.emoji.find((v) => text.startsWith(v))) {
                    status.IsChatMode = 0;
                }
                if (msg.type() === bot.Message.Type.Transfer) {
                    text = '我给你转了一笔钱，算是对你的爱意';
                }
                else if (msg.type() === bot.Message.Type.Recalled) {
                    text = '撤回了一条消息';
                }
                //区分是多人对话还是双人对话
                const topic = (room ? alias + "Room" : alias) + status.newTopic;
                const headers = new axios_1.AxiosHeaders();
                headers.setAuthorization('Bearer ' + status.apikey);
                headers.setContentType('application/json');
                const chatDatastr = yield chatRecordsTB.readData(currentUserName);
                const chatData = JSON.parse(chatDatastr || "{}");
                const currTalkerRecords = chatData[topic] || [];
                const trimendText = text.trimEnd();
                const punctuation = /.*(\?|？|\.|。|!|！)$/g.test(trimendText); //doing trimend,because of /( ) ( )/ 
                const Lm = ["gpt-4", 'text-davinci-003-playground', 'gpt-3.5-turbo'];
                if (!/^( ).*( )$/.test(text) && isSentByMe) {
                    return writeResponse(text);
                }
                function writeResponse(messages) {
                    currTalkerRecords.push({ content: messages, role: "assistant" });
                    chatData[topic] = currTalkerRecords;
                    messages && chatRecordsTB.writeData(currentUserName, JSON.stringify(chatData));
                }
                function requestTextCompletion() {
                    var _a, _b;
                    return __awaiter(this, void 0, void 0, function* () {
                        currTalkerRecords.push({
                            content: (punctuation ? (/.*(\.{2,})|(。{2,})$/.test(trimendText) ? text.replace(/(\.{2,})|(。{2,})$/, '') : text) ? "" : text : (/.*吗$/.test(trimendText) ? text + "？" : text + ".")), role: "user"
                        });
                        const prompt = currTalkerRecords.map((message, i) => {
                            const base = message.content;
                            if (i % 2 == 0) {
                                return '<|endoftext|>' + base;
                            }
                            return base + ""; //
                        }).join('');
                        console.log('TextMode_待发送的信息', trimStringReverse(prompt, status.maxLenght));
                        //@ts-ignore
                        const completionBody = {
                            max_tokens: status.maxLenght,
                            //model: Lm[1],
                            prompt: trimStringReverse(prompt, status.maxLenght), temperature: status.randomness,
                            top_p: status.top_p,
                            frequency_penalty: status.frequency,
                            presence_penalty: status.presence_penalty, n: status.n,
                            stop: status.stop,
                        };
                        const res = yield axios_1.default.post(`https://api.openai.com/v1/engines/${Lm[1]}/completions`, completionBody, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(_a = status.apikey) === null || _a === void 0 ? void 0 : _a.trim()}`
                            }
                        }).then((res) => {
                            console.log('status', res.status);
                            if (res.status == 200) {
                                return res.data;
                            }
                        }).catch((reson) => console.log('requesting openai failed', reson));
                        /* await openai.createCompletion(completionBody).then((res) => {
                          return res.data
                        }) */
                        //msg.say(say);
                        /* res && console.log('it said', res.object, res.usage?.total_tokens, 'prompt_tokens',
                          res.usage?.prompt_tokens, 'completion_tokens', res.usage?.completion_tokens); */
                        if (res === null || res === void 0 ? void 0 : res.choices) {
                            const texts = (_b = res.choices.map((choice) => {
                                const resText = choice.text; //?.trim();
                                resText && msg.say(resText.trim().replace(/(.*)(\?|？|\.|。|!|！)$/, '$1') + getEmoji());
                                return resText;
                            })) === null || _b === void 0 ? void 0 : _b.join('');
                            console.log('响应后的信息：', alias, prompt + texts);
                            writeResponse(texts);
                            (0, logs_1.outputLog)(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + texts, "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });
                        }
                        else
                            console.log('requesting OpenAI server failed!');
                    });
                }
                function requestChatCompletion() {
                    var _a, _b;
                    return __awaiter(this, void 0, void 0, function* () {
                        currTalkerRecords.push({ role: "user", content: (punctuation ? text : (/.*吗$/.test(trimendText) ? text + "？" : text + ".")) });
                        const res = yield axios_1.default.post(`https://api.openai.com/v1/chat/completions`, {
                            messages: currTalkerRecords, model: Lm[2], stop: status.stop,
                            frequency_penalty: status.frequency, presence_penalty: status.presence_penalty, max_tokens: status.maxLenght, n: status.n, temperature: status.randomness
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(_a = status.apikey) === null || _a === void 0 ? void 0 : _a.trim()}`
                            }
                        }).then((res) => {
                            console.log('status', res.status);
                            if (res.status == 200) {
                                return res.data;
                            }
                        }).catch((reson) => console.log('requesting openai failed', reson));
                        if (res === null || res === void 0 ? void 0 : res.choices) {
                            const messages = (_b = res.choices.map((choice) => {
                                var _a, _b;
                                const content = (_a = choice.message) === null || _a === void 0 ? void 0 : _a.content;
                                //sending msg using the @ symbol such as @someone if the conversation with the talker is from Room  
                                content && msg.say((room ? '@' + alias + content : content) + getEmoji());
                                return (_b = choice.message) === null || _b === void 0 ? void 0 : _b.content;
                            })) === null || _b === void 0 ? void 0 : _b.join('');
                            (0, logs_1.outputLog)(myself, { "消息日期：": date, '消息：': alias + ' ' + phones + '说：' + text, resText: myself + '回复道：' + messages, "是否@了我：": MentionedMe, '群聊：': roomMembers_serilizable });
                            writeResponse(messages);
                        }
                    });
                }
                switch (status.IsChatMode) {
                    case 0:
                        requestTextCompletion();
                        break;
                    case 1:
                        requestChatCompletion();
                        break;
                    default:
                        requestChatCompletion();
                        break;
                }
            }
        }));
    });
};
