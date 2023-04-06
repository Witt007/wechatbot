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
    async send(callback: () => any) {

        socket.addEventListener("message",)
         new Promise((resolve) => {
            socket.addEventListener('open', () => {
                resolve('')
            }, { once: true })
        })
    }
}