import config from "./config";
const socket=new WebSocket(config.soketUrl);

function handleLogin(){

}
socket.onmessage=function (msg) {
    console.log(msg.type,msg.origin,msg.source,msg);
    
   const data:{path:string,payload:any}= JSON.parse(msg.data);
   switch (data.path) {
    case '/login':
        handleLogin();
        break;
   
    default:
        break;
   }

}
socket.dispatchEvent('').addEventListener('message')
socket.onopen=function (ev) {
    console.log('opened',ev);
    
}
export {

}