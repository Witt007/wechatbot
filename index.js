"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const node_https_1 = __importDefault(require("node:https"));
const fs_1 = __importDefault(require("fs"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const chatbot_1 = __importDefault(require("./router/chatbot"));
const sockets_1 = require("./API/sockets");
let socket;
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use(express_1.default.static("./static"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded());
app.use((0, cookie_parser_1.default)());
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
});
app.use('/chat', chatbot_1.default);
<<<<<<< HEAD
const cert = fs_1.default.readFileSync(path_1.default.join(__dirname, 'certs/cert.pem'));
const certKey = fs_1.default.readFileSync(path_1.default.join(__dirname, 'certs/cert.key'));
=======
const cert = fs_1.default.readFileSync(path_1.default.join(__dirname, 'certs/v2ray.pem'));
const certKey = fs_1.default.readFileSync(path_1.default.join(__dirname, 'certs/v2ray.key'));
>>>>>>> 674fc87e72fe5a89f16e0f8a98f144112ef40705
const server = node_https_1.default.createServer({ cert, key: certKey }, app);
//const server = http.createServer( app);
server.listen(88, "0.0.0.0");
(0, sockets_1.init)(server);
/**
 *
 * @param req express.Request
 * @param res express.Response
 *
 */
function verifyLoggedIn(req, res) {
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
