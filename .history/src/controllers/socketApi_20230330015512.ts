import config from "./config";

function handleLogin() {

}


export interface dataType { path: string, payload: any }
export function startSocket<T extends dataType>(onmessage: (data: T) => void, msg?: T): WebSocket {
    const socket = new WebSocket(config.soketUrl);


    socket.addEventListener("open", function () {
        msg && socket.send(JSON.stringify(msg))
    }, { once: true })


    socket.addEventListener('message', (skMsg) => {
        const data: T = JSON.parse(skMsg.data);
        onmessage(skMsg.data);
    }, { once: false })
    socket.addEventListener('error', (err) => {
        console.log('an error occurred when trying to communicate with websocket', err);

    }, { once: true })
    socket.addEventListener('close', (err) => {
        console.log('closed', err);

    }, { once: true })
    return socket;
}
