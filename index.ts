import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cluster from "cluster";
import https from "https";
import http from "http";
import fs from 'fs'
//@ts-ignore
import websocket from "ws";
import { IncomingMessage, ServerResponse, createServer } from "http";
import cookieParser from "cookie-parser";


import path from "path";
import routerChatbot from "./router/chatbot";
import { init as initWs } from './API/sockets'
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
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  //res.clearCookie('chatbotToken');
  
  next();
 
  
});
app.get('/', (req, res) => {
  //verifyLoggedIn(req, res);

})
app.use('/chat', routerChatbot);
const cert = fs.readFileSync(path.join(__dirname, 'certs/v2ray.pem'));
const certKey = fs.readFileSync(path.join(__dirname, 'certs/v2ray.key'));
const server = https.createServer({ cert, key: certKey }, app);
//const server = http.createServer( app);
server.listen(82);

initWs(server);




/**
 * 
 * @param req express.Request
 * @param res express.Response
 * 
 */
function verifyLoggedIn(req: Request, res: Response) {
  let token = req.cookies["chatbotToken"];
  if (!token) {
    res.redirect('/chat/login');
  }
}

/* getUsers<userData>().then((data) => {
  const token = Object.values(data).find((user) => {
    return !user.isLoggedOut
  })?.token

  
}) */
console.log('程序已启动！');



