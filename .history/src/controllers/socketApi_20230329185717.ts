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
type
export default {
     send(msg: { path: string, payload: any })Promise<> {

        socket.addEventListener("open", function () {
            socket.send(JSON.stringify(msg))
        }, { once: true })

       return new Promise((resolve) => {
            socket.addEventListener('message', (skMsg) => {
                const data:  = JSON.parse(skMsg.data);

                resolve(data)
            }, { once: true })
        })
    }
}