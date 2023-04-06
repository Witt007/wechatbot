import config from "./config";

function handleLogin() {

}


interface dataType  { path: string, payload: any }
export function send<T extends dataType>(msg: T): Promise<T> {
        const socket = new WebSocket(config.soketUrl);


        socket.addEventListener("open", function () {
            socket.send(JSON.stringify(msg))
        }, { once: true })

        return new Promise((resolve) => {
            socket.addEventListener('message', (skMsg) => {
                const data: T = JSON.parse(skMsg.data);

                resolve(data)
            }, { once: true })
            socket.addEventListener('error', (err) => {
                console.log(er);
                
            }, { once: true })
        })
    }
