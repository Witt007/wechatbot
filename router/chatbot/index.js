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
const express_1 = __importDefault(require("express"));
const wechaty_1 = require("../../API/wechaty");
const router = express_1.default.Router({ caseSensitive: true });
//FIXME:Each user can only possess one token. this is not the best way to set a token. Seems that the function is just a way to set a cookie
function getBotTokenOrset(req, res) {
    let token = req.cookies['chatbotToken'];
    if (!token) {
        token = Math.random() * Math.pow(10, 16); //process.env.PUPPET_TOKENS;
        res.cookie("chatbotToken", token, { httpOnly: true }); //.setHeader("Set-Cookie", ["chatbotToken=" + token]);
        console.log("cookie is set", req.cookies["chatbotToken"]);
    }
    console.log("client token", token);
    return token;
}
let mapBots = new Map();
router.post("/login", function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const token = getBotTokenOrset(req, res);
        let bot = mapBots.get(token);
        console.log('token and bot in /login', token, bot === null || bot === void 0 ? void 0 : bot.BotName);
        if (!bot)
            (0, wechaty_1.createAndRunBot)(token).then((result) => {
                console.log('bot.name', result.BotName);
                mapBots.set(result.BotName, result);
                result.on("dispose", () => {
                    mapBots.delete(result.BotName);
                });
                res.end("starting successfully");
            }).catch(() => {
                res.end(null);
            });
        else { //the same user
            if (!token)
                return res.end("seems to encountered a problem: there does not exist a token!");
            const dataFromOnscan = bot.getResponseData();
            if (dataFromOnscan) {
                (_a = bot.bot) === null || _a === void 0 ? void 0 : _a.reset().then(() => {
                    console.log('reset...');
                    res.end("starting successfully");
                });
            }
            else {
                res.end('You have logged in!');
            }
        }
    });
});
router.get('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return;
        /*   const token = req.cookies['chatbotToken'];
          const bot = mapBots.get(token);
          console.log('chat/ entered', token, bot);
        
          if (!bot) {
            createAndRunBot(getOrSetBotToken(req, res)).then((bot) => {
              res.redirect('/chat/login?' + Math.random() * Math.pow(10, 16))
            })
          } else res.end('the bot already started') */
    });
});
exports.default = router;
