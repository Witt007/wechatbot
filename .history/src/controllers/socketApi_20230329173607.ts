import config from "./config";
const socket=new WebSocket(config.soketUrl);
socket.onmessage=function (msg) {
    console.log(msg.type,msg.origin,msg.source,msg);
    
   const data:{path:string,payload:any}= JSON.parse(msg.data);
   

}
socket.onopen=function (ev) {
    console.log('opened',ev);
    
}
export {

}