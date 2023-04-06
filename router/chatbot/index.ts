import express, { Response, Request } from "express";

import { createAndRunBot, Bot } from "../../API/wechaty";


const router = express.Router({ caseSensitive: true });

//FIXME:Each user can only possess one token. this is not the best way to set a token. Seems that the function is just a way to set a cookie
function getBotTokenOrset(req: Request, res: Response): string {
  let token = req.cookies['chatbotToken'];

  if (!token) {
    token = Math.random() * Math.pow(10, 16) //process.env.PUPPET_TOKENS;

    res.cookie("chatbotToken", token, { httpOnly: true }); //.setHeader("Set-Cookie", ["chatbotToken=" + token]);

    console.log("cookie is set", req.cookies["chatbotToken"]);
  }
  console.log("client token", token);
  return token;
}

let mapBots: Map<string, Bot> = new Map<string, Bot>();

router.post("/login", async function (req, res) {
  const token = getBotTokenOrset(req, res);
  let bot = mapBots.get(token);
  console.log('token and bot in /login', token, bot?.BotName);
  if (!bot)
    createAndRunBot(token).then((result) => {
      console.log('bot.name', result.BotName);
      mapBots.set(result.BotName, result);
      result.on("dispose", () => {
        mapBots.delete(result.BotName);
      });
      res.end("starting successfully");
    }).catch(() => {
      res.end(null);
    })
  else { //the same user

    if (!token) return res.end("seems to encountered a problem: there does not exist a token!")
    const dataFromOnscan: Buffer = bot.getResponseData();
    if (dataFromOnscan) {

      bot.bot?.reset().then(() => {
        console.log('reset...');
        res.end("starting successfully");
      });

    } else {
      res.end('You have logged in!')
    }
  }
});

router.get('/', async function (req: Request, res: Response) {
  return
  /*   const token = req.cookies['chatbotToken'];
    const bot = mapBots.get(token);
    console.log('chat/ entered', token, bot);
  
    if (!bot) {
      createAndRunBot(getOrSetBotToken(req, res)).then((bot) => {
        res.redirect('/chat/login?' + Math.random() * Math.pow(10, 16))
      })
    } else res.end('the bot already started') */
})



export default router;



