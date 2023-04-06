import config from "./config";
const socket=new WebSocket(config.soketUrl);
socket.onmessage=function (msg) {
    msg.data
}
export {

}