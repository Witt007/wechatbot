import config from "./config";

function handleLogin() {

}


export interface dataType  { path: string, payload: any }
export function startSocket<T extends dataType>(msg?: T,onmessage?:()=>void): Promise<{data:T;socket:WebSocket}> {
        const socket = new WebSocket(config.soketUrl);


        socket.addEventListener("open", function () {
            msg&&socket.send(JSON.stringify(msg))
        }, { once: true })

        return new Promise((resolve) => {
            socket.addEventListener('message', (skMsg) => {
                const data: T = JSON.parse(skMsg.data);

                resolve({data,socket});
            }, { once: false })
            socket.addEventListener('error', (err) => {
                console.log('an error occurred when trying to communicate with websocket',err);
                
            }, { once: true })
            socket.addEventListener('close', (err) => {
                console.log('closed',err);
                
            }, { once: true })
        })
    }
