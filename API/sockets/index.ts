
import websocket, { Server } from "ws";
import https from 'https'
import http, { IncomingMessage } from 'http'
let wsServer: websocket.WebSocketServer
let socket: websocket.WebSocket

export interface socketData {
    payload: any;
    msgType: "resQR"
}


export function init(server: https.Server) {
    wsServer = new websocket.WebSocketServer({ server });

    wsServer.on(
        "connection",
        async function (sk: websocket.WebSocket, req: IncomingMessage) {
            console.log("connected" + Math.random(), sk.url);
            socket = sk;

            socket.onmessage = function (ev: websocket.MessageEvent) {
                console.log("Witt:received data", ev.data);
                if (typeof ev.data === "string") {
                    const data: socketData = JSON.parse(ev.data);

                    switch (data.msgType) {
                        case "resQR":
                            break;
                    }
                }
            }

            socket.onclose = function (ev: websocket.CloseEvent) {
                console.log("Witt:closed", ev.reason);
            };
            socket.onerror = function (ev: websocket.ErrorEvent) {
                console.log("Witt:error", ev.message);
            };
            socket.onopen = function (ev: websocket.Event) {
                console.log("Witt:opened", ev.target);
            };
        }
    );
}

export function getSoket(): websocket.WebSocket {
    return socket
}




