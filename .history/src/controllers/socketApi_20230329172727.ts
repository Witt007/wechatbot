import config from "./config";
const socket=new WebSocket(config.soketUrl);
socket.onmessage=function (msg) {
   const data= msg.data
}
export {

}