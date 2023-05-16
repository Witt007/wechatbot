"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSoket = exports.init = void 0;
const ws_1 = __importDefault(require("ws"));
let wsServer;
let socket;
function init(server) {
    wsServer = new ws_1.default.WebSocketServer({ server });
    wsServer.on("connection", function (sk, req) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("connected" + Math.random(), sk.url);
            socket = sk;
            socket.onmessage = function (ev) {
                console.log("Witt:received data", ev.data);
                if (typeof ev.data === "string") {
                    const data = JSON.parse(ev.data);
                    switch (data.msgType) {
                        case "resQR":
                            break;
                    }
                }
            };
            socket.onclose = function (ev) {
                console.log("Witt:closed", ev.reason);
            };
            socket.onerror = function (ev) {
                console.log("Witt:error", ev.message);
            };
            socket.onopen = function (ev) {
                console.log("Witt:opened", ev.target);
            };
        });
    });
}
exports.init = init;
function getSoket() {
    return socket;
}
exports.getSoket = getSoket;
