"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outputLog = void 0;
const data_1 = require("../../data");
const tbLogs = data_1.database.createTable('logs');
function outputLog(token, obj) {
    tbLogs.readData(token).then((datastr) => {
        let data = JSON.parse(datastr || "{}");
        if (Object.prototype.toString.call(data) === '[object Array]')
            data.push(obj);
        else
            data = [obj];
        tbLogs.writeData(token, JSON.stringify(data));
        console.log('a log info written:', obj);
    });
}
exports.outputLog = outputLog;
