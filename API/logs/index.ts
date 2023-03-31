
import { database } from "../../data";
const tbLogs = database.createTable('logs');
import { username } from "../../data/types";
import { tableData } from "../DB/Redis/table";

export interface log extends tableData {
    [index: string]: any
  }
export function outputLog(token: username , obj: log) {
    tbLogs.readData<log[]>(token).then((data) => {
        if(Object.prototype.toString.call(data)==='[object Array]')
        data.push(obj);
        else data=[obj];
        tbLogs.writeData<log[]>(token,data);
        console.log('a log info written:', obj);
    })
}