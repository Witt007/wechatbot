import config from "./config";
const socket = new WebSocket(config.soketUrl);

function handleLogin() {

}


socket.onopen = function (ev) {
    console.log('opened', ev);
    socket.send()
}
type dataType = { path: string, payload: any }
export default {
    send<T>(msg: T): Promise<T> {
        socket.addEventListener("open", function () {
            socket.send(JSON.stringify(msg))
        }, { once: true })

        return new Promise((resolve) => {
            socket.addEventListener('message', (skMsg) => {
                const data: T = JSON.parse(skMsg.data);

                resolve(data)
            }, { once: true })
        })
    }
}