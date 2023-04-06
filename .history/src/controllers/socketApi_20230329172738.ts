import config from "./config";
const socket=new WebSocket(config.soketUrl);
socket.onmessage=function (msg) {
    console.log();
    
   const data= JSON.parse(msg.data);
}
export {

}