import config from "./config";
const socket=new WebSocket(config.soketUrl);
socket.onmessage=function (msg) {
    console.log(msg.type,msg.origin,msg.source,msg);
    
   const data= JSON.parse(msg.data);

}
socket.onopen=function (params:type) {
    
}
export {

}