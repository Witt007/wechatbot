"use strict";
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
exports.Bot = exports.createAndRunBot = exports.deactiveUser = exports.setUser = exports.getUser = void 0;
const wechaty_1 = require("wechaty");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const https_1 = __importDefault(require("https"));
const events_1 = require("events");
const Msg = require("../openai");
const data_1 = require("../../data");
const sockets_1 = require("../sockets");
function getUser(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const datastr = yield data_1.tb.readData(token);
        return JSON.parse(datastr || "{}");
    });
}
exports.getUser = getUser;
function setUser(token, data) {
    return data_1.tb.writeData(token, JSON.stringify(data));
}
exports.setUser = setUser;
function getCurrUserName() {
    return __awaiter(this, void 0, void 0, function* () {
        const name = this.currentUser.name() || (yield this.currentUser.alias()) || '';
        console.log('getCurrUserName:', this.currentUser.name(), yield this.currentUser.alias());
        return name;
    });
}
function deactiveUser(token) {
    return __awaiter(this, void 0, void 0, function* () {
        getUser(token).then((data) => {
            data.isLoggedIn = false;
            setUser(token, data);
        });
    });
}
exports.deactiveUser = deactiveUser;
function createAndRunBot(name) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('starting to create bot');
        return new Bot(name);
    });
}
exports.createAndRunBot = createAndRunBot;
class Bot extends events_1.EventEmitter {
    getResponseData() {
        return this.resData;
    }
    bindBotEvt(botSelf) {
        const listeners = botSelf.getInitBotListenners();
        this.on("scan", listeners.onscan);
        this.on("stop", () => {
            console.log("Bot stopped");
        });
        this.on("login", listeners.onlogin);
        this.on("logout", listeners.onlogout);
        this.on("message", listeners.onmessage);
        this.on("error", listeners.onerror);
    }
    constructor(name) {
        super();
        this.resData = null;
        this.BotName = name;
        const bot = wechaty_1.WechatyBuilder.build({
            //@ts-ignore
            puppet: 'wechaty-puppet-wechat4u',
            name, puppetOptions: { logMsg: false }
        });
        this.bot = bot;
        this.bindBotEvt.call(bot, this);
        bot === null || bot === void 0 ? void 0 : bot.start().then(() => {
            console.log("chatbot started");
            return bot;
        }).catch((error) => {
            console.log("Witt:started error", error);
        });
    }
    on(eventName, listener) {
        console.log('Has been disposed successfully');
        return super.on(eventName, listener);
    }
    getInitBotListenners() {
        const botSelf = this;
        return {
            onerror(err) {
                // this.logout();
                console.log('encoutered a problem so it reset', err);
            },
            onlogin(self) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("success login"); //todo 只要有请求就被迫下线
                    botSelf.resData = null; //dispose the resource 
                    const username = yield getCurrUserName.call(this);
                    let contactArr = yield this.Contact.findAll({ alias: username });
                    const phone = yield self.phone();
                    const contact = contactArr.map((contact) => __awaiter(this, void 0, void 0, function* () {
                        const city = contact.city();
                        const name = contact.name();
                        const gender = contact.gender();
                        const phone = yield contact.phone();
                        const province = contact.province();
                        return { city, name, gender, phone, province };
                    }));
                    getUser(username).then((data) => __awaiter(this, void 0, void 0, function* () {
                        const alias = self.name() || (yield self.alias());
                        console.log('has ..........................', alias, data);
                        data = { isLoggedIn: true, token: this.name(), name: alias, contact, phone };
                        setUser(username, data);
                    })).then(() => {
                        var _a;
                        (_a = (0, sockets_1.getSoket)()) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ path: "/login", payload: "ok" }));
                        (0, sockets_1.getSoket)().close();
                    });
                });
            },
            onlogout() {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("logout");
                    yield this.stop();
                    yield deactiveUser(yield getCurrUserName.call(this));
                    botSelf.bot = null;
                    botSelf.emit("dispose");
                });
            },
            onscan(qrcode, status) {
                console.log("onscan");
                if (status == wechaty_1.ScanStatus.Waiting || status == wechaty_1.ScanStatus.Timeout) {
                    const qrcodeImageUrl = [
                        "https://api.qrserver.com/v1/create-qr-code/?data=",
                        encodeURIComponent(qrcode),
                    ].join("");
                    console.log("Scanning...", qrcodeImageUrl);
                    https_1.default
                        .get(qrcodeImageUrl, function (req) {
                        console.log('headers', req.rawHeaders);
                        req.on("data", (chunk) => {
                            var _a;
                            botSelf.resData = chunk;
                            console.log('chunk', chunk);
                            (_a = (0, sockets_1.getSoket)()) === null || _a === void 0 ? void 0 : _a.send(chunk);
                        });
                    })
                        .on("error", (error) => {
                        console.log("https.get", error);
                    });
                }
            },
            onmessage(msg) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!this.isLoggedIn) {
                        return console.log('Can not send message because of logged out!');
                    }
                    console.log("received a message", msg
                        .talker()
                        .id);
                    yield Msg.responseMsg(this, msg);
                });
            }
        };
    }
}
exports.Bot = Bot;
