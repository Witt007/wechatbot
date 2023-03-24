import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cluster from "cluster";
import https from "https";
import fs from 'fs'
//@ts-ignore
import websocket from "ws";
import { IncomingMessage, ServerResponse, createServer } from "http";
import cookieParser from "cookie-parser";


import path from "path";
import routerChatbot from "./router/chatbot";
let socket: websocket.WebSocket;


const app = express();

app.disable("x-powered-by");
app.use(express.static("./static"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
//app.set("views", path.join(__dirname, "views"));
app.set("view engine", 'ejs');
app.use(function doCors(req, res, next) {
  console.log("middleware-", req.url);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept,X-Request-With');
  if (req.method == 'OPTION') {
    res.setHeader("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE');
  }
  //res.clearCookie('chatbotToken')
  next();
});
app.get('/',(req,res)=>{
  verifyLoggedIn(req, res);

})
app.use('/', routerChatbot);
const cert = fs.readFileSync(path.join(__dirname, 'certs/v2ray.pem'));
const certKey = fs.readFileSync(path.join(__dirname, 'certs/v2ray.key'));
const server = https.createServer({ cert, key: certKey }, app);
server.listen(82);




const wsServer = new websocket.WebSocketServer({ server });

wsServer.on(
  "connection",
  async function (sk: websocket.WebSocket, req: IncomingMessage) {
    console.log("connected" + Math.random(), sk.url);
    socket = sk;

    socket.onmessage = function (ev: websocket.MessageEvent) {
      console.log("Witt:received data", ev.data);
      const data = ev.data;
      if (data === "qrcode") {
        /*    if (bot.isLoggedIn)
             return socket.send(JSON.stringify({ type: "hasloggedIn" }));
           */
      }
    };

    socket.onclose = function (ev: websocket.CloseEvent) {
      console.log("Witt:closed", ev.reason);
    };
    socket.onerror = function (ev: websocket.ErrorEvent) {
      console.log("Witt:error", ev.message);
    };
    socket.onopen = function (ev: websocket.Event) {
      console.log("Witt:opened", ev.target);
    };
  }
);

/**
 * 
 * @param req express.Request
 * @param res express.Response
 * 
 */
function verifyLoggedIn(req: Request, res: Response) {
  let token = req.cookies["chatbotToken"];
  if (!token) {
    res.redirect('/login');
  }
}


