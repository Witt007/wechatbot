import { WechatyEventListenerMessage, WechatyEventListenerScan, WechatyEventListenerLogin, WechatyEventListenerLogout, WechatyEventListenerError } from "wechaty/dist/esm/src/schemas/wechaty-events";
import { ContactSelf, ScanStatus, WechatyBuilder } from "wechaty";
import { MessageInterface, WechatyInterface } from "wechaty/impls";
import dotenv from 'dotenv'
dotenv.config();
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
export async function getUser(token: string): Promise<user> {
    const datastr = await tb.readData(token);
    return JSON.parse(datastr || "{}")
}
export function setUser(token: string, data: user) {
    return tb.writeData(token, JSON.stringify(data));
}

async function getCurrUserName(this: WechatyInterface): Promise<string> {
    const name= this.currentUser.name() || (await this.currentUser.alias()) || '';
    console.log('getCurrUserName:',this.currentUser.name(),await this.currentUser.alias());
    
    return name
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
           // this.logout();
            console.log('encoutered a problem so it reset', err);

        },
        async onlogin(this: WechatyInterface, self: ContactSelf) {
            console.log("success login");//todo 只要有请求就被迫下线
            resData = null//dispose the resource 
            const username = await getCurrUserName.call(this);
            let contactArr = await this.Contact.findAll({ alias: username });
            const phone = await self.phone()
            const contact = contactArr.map(async (contact) => {
                const city = contact.city();
                const name = contact.name();
                const gender = contact.gender();
                const phone = await contact.phone();
                const province = contact.province();
                return { city, name, gender, phone, province };
            })
            getUser(username).then(async (data) => {
                const alias = self.name() || await self.alias()
                console.log('has ..........................', alias, data);

                data = { isLoggedIn: true, token: this.name(), name: alias, contact, phone }
                setUser(username, data);
            }).then(() => {
                getSoket()?.send(JSON.stringify({ path: "/login", payload: "ok" }));
                getSoket().close();
            })

        },
        async onlogout(this: WechatyInterface) {
            console.log("logout");
           await this.stop();
           await deactiveUser(await getCurrUserName.call(this));
            //FIXME:
            mapBots.delete(this.name());
            
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
                        console.log('headers', req.rawHeaders);

                        req.on("data", (chunk: Buffer) => {
                            resData = chunk;
                            console.log('chunk', chunk);
                            getSoket()?.send(chunk);
                        });
                    })
                    .on("error", (error) => {
                        console.log("https.get", error);
                    });
            }
        },
        async onmessage(this: WechatyInterface, msg: MessageInterface) {
            if (!this.isLoggedIn) {
                return console.log('Can not send message because of logged out!');
            }
            console.log("received a message", msg
                .talker()
                .id);
            await responseMsg(this, msg);
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
        puppet: 'wechaty-puppet-wechat4u', 
        name
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

