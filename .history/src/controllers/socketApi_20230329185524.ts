import config from "./config";
const socket = new WebSocket(config.soketUrl);

function handleLogin() {

}
socket.onmessage = function (msg) {
    console.log(msg.type, msg.origin, msg.source, msg);

    const data: { path: string, payload: any } = JSON.parse(msg.data);
    switch (data.path) {
        case '/login':
            handleLogin();
            break;

        default:
            break;
    }

}

socket.onopen = function (ev) {
    console.log('opened', ev);
    socket.send()
}
export default {
    async send(msg: {path:string,payload:any}) {

        socket.addEventListener("open",function(){
            socket.send(JSON.stringify(msg))
        },{once:true})

         new Promise((resolve) => {
            socket.addEventListener('message', (skMsg:{path:string,payload:any}) => {
                resolve()
            }, { once: true })
        })
    }
}