import express, { Response, Request } from "express";
import { WechatyInterface } from "wechaty/impls";
import evEmitter from "../../API/events";

import { createAndRunBot, getUser, bindBotEvt, getMapBots, getResponseData } from "../../API/wechaty";
import { fork } from "child_process";
import path from 'path'
import { tb } from "../../data";
import stream from 'stream'

const router = express.Router({ caseSensitive: true });

//FIXME:Each user can only possess one token. here is not best way to set a token. Seems that the function is just a way to set a cookie
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

const mapBots = getMapBots()

function communicateWithBot(res: Response) {
  evEmitter.on('responseQR', function (buffData: Buffer) {
    console.log('responseQR again');

    res.status(200).type("jpeg").end(buffData);
  })
}

router.post("/login", async function (req, res) {
  const token = getBotTokenOrset(req, res);
  let bot = mapBots.get(token);
  console.log('token and bot in /login', token, bot?.name());
  if (!bot)
    createAndRunBot(token).then((result) => {
      //communicateWithBot(res)
      res.end("starting successfully");
    }).catch(() => {
      res.end(null);
    })
  else { //the same user
    // return bot.reset().then(()=>{});
    if (!token) return res.end("seems to encountered a problem: there does not exist a token!")
    const user = await getUser(token);//getting data from redis must has registered user
    const dataFromOnscan:Buffer = getResponseData();
    if (dataFromOnscan) {
      //if exists data, then it demonstrate logged out but the bot still not dispose;
      //if (!user.isLoggedIn)
       bot.reset().then(() => {console.log('reset...');
       res.end("starting successfully"); });
      /*  {
        const pass=new stream.PassThrough();
        pass.end(dataFromOnscan);
        pass.pipe(res);
       } */
    } else {
      res.end('You have logged in!')
    }
  }
  /*   if (!bot) //creating
    else {
      const user = await getUser(token);//getting data from redis must has registered user
      console.log('user', user);
      if (!user?.isLoggedIn) { //the same user
        //  resData && res.end(resData);// Passively send msg
        responseData(res);
  
   
        //res.end("You have logged in!")
  
      } else {
        res.end('You have logged in!')
      }
    } */

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



