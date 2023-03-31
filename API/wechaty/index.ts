import { WechatyEventListenerMessage, WechatyEventListenerScan, WechatyEventListenerLogin, WechatyEventListenerLogout, WechatyEventListenerError } from "wechaty/dist/esm/src/schemas/wechaty-events";
import { ContactSelf, ScanStatus, WechatyBuilder } from "wechaty";
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import dotenv from 'dotenv'
dotenv.config();
import { PuppetPadlocal } from 'wechaty-puppet-padlocal'
import https from "https";
import { IncomingMessage } from "http";
import { tableData } from "../DB/Redis/table";
import { user, username } from "../../data/types";
import { responseMsg } from "../openai";
import { Response } from "express";
import { Buffer } from 'node:buffer'
//@ts-ignore
import Wechat4u from "wechat4u";

import { tb } from "../../data";
import { getSoket } from "../sockets";
type botListenners = {
    onmessage: WechatyEventListenerMessage,
    onscan: WechatyEventListenerScan,
    onlogin: WechatyEventListenerLogin,
    onlogout: WechatyEventListenerLogout,
    onerror: WechatyEventListenerError
}

let mapBots: Map<string, WechatyInterface> = new Map<string, WechatyInterface>();

let resData: any = null

export function getResponseData<T>() {
    return resData;
}
export function getUser(token: string): Promise<user> {
    return tb.readData(token);
}
export function setUser(token: string, data: user) {
    return tb.writeData(token, data);
}
export async function deactiveUser(token: username) {
    getUser(token).then((data) => {
        data.isLoggedIn = false;
        setUser(token, data);
    })
}

function getInitBotListenners(): botListenners {
    return {
        onerror(this: WechatyInterface, err) {
            mapBots.delete(this.name())
            this.logout();
            console.log('encoutered a problem so it reset', err);

        },
        async onlogin(this: WechatyInterface, self: ContactSelf) {
            console.log("success login");//todo 只要有请求就被迫下线
            getSoket().close();
            resData = null//dispose the resource 
            let contactArr = await this.Contact.findAll();
            const phone = await self.phone()
            const contact = contactArr.map(async (contact) => {
                const city = contact.city();
                const name = contact.name();
                const gender = contact.gender();
                const phone = await contact.phone();
                const province = contact.province();
                return { city, name, gender, phone, province };
            })
            getUser(this.name()).then(async (data) => {
                const alias = await self.alias()
                console.log('has ..........................', alias, data);

                data = { isLoggedIn: true, token: this.name(), name: alias, contact, phone }
                setUser(this.name(), data);
            }).then(() => {
                getSoket()?.send(JSON.stringify({ path: "/login", payload: "ok" }))
            })

        },
        onlogout(this: WechatyInterface) {
            console.log("logout");
            deactiveUser(this.name());
            mapBots.delete(this.name())
            this.stop()
        },
        onscan(this: WechatyInterface, qrcode: string, status) {
            console.log("onscan");
            if (status == ScanStatus.Waiting || status == ScanStatus.Timeout) {
                const qrcodeImageUrl: string = [
                    "https://api.qrserver.com/v1/create-qr-code/?data=",
                    encodeURIComponent(qrcode),
                ].join("");
                console.log("Scanning...", qrcodeImageUrl);
                https
                    .get(qrcodeImageUrl, function (req: IncomingMessage) {
                        console.log('headers',req.rawHeaders);
                        
                        req.on("data", (chunk: Buffer) => {
                            resData = chunk;
                            console.log('chunk', chunk);
                            getSoket().send(chunk); // actively send msg
                            /* evEmitter.on('responseQR',(res:Response)=>{                                
                                res.status(200).type("jpeg").end(chunk);
                            }) */
                            //evEmitter.emit('responseQR',chunk)
                        });
                    })
                    .on("error", (error) => {
                        console.log("https.get", error);
                    });
            }
        },
        async onmessage(this: WechatyInterface, msg: MessageInterface) {
            if (msg.type() !== this.Message.Type.Text) return
            if (!msg.text()) {
                //return;
            }
            console.log("received a message", msg
                .talker()
                .name());
            responseMsg(this, msg);
        }
    }
}


export function bindBotEvt(this: WechatyInterface, res?: Response) {
    const listeners: botListenners = getInitBotListenners()
    this.on("scan", listeners.onscan);
    this.on("stop", () => {
        console.log("Bot stopped");
    });

    this.on("login", listeners.onlogin);
    this.on("logout", listeners.onlogout);
    this.on("message", listeners.onmessage);
    this.on("error", listeners.onerror)
}

export async function createAndRunBot(name: string): Promise<WechatyInterface> {
    console.log('starting to create bot');

    const bot = WechatyBuilder.build({
        //@ts-ignore
        puppet:'wechaty-puppet-wechat4u', //new PuppetPadlocal({ token: name /* timeoutSeconds: 8000  */ }),
        name, //puppetOptions: { token: name, uos: true },
    })
    bindBotEvt.call(bot);

    await bot.start().then(() => {
        console.log("chatbot started");
        return bot;
    }).catch((error) => {
        console.log("Witt:started error", error);
    })

    mapBots.set(name, bot)
    return bot;
}

export function getMapBots() {
    return mapBots;
}

