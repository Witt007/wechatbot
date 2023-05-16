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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
class Table {
    constructor(tablename, redis) {
        this.dataTemplate = JSON.stringify({ users: {}, msgRecord: {} });
        this.tablename = tablename;
        this.redis = redis;
    }
    readData(token) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('hget', this.redis.hGet);
                const v = yield this.redis.hGet(this.tablename, token).catch((err) => {
                    console.log(err, token);
                });
                resolve(v || '');
            }
            catch (error) {
                console.log('reading data encountered an error', error);
            }
        }));
        /* new Promise<T>((resolve) => {
          const userpath = path.join(process.cwd(), 'data/', self.tablename + '.json');
          fs.access(userpath, fs.constants.F_OK, (error: any) => {
     
            if (error) {
     
              fs.writeFile(userpath, '{}', {}, (err) => {
                console.log(this.tablename, 'failed to read');
                readFile()
              })
            } else readFile()
            function readFile() {
     
              fs.readFile(userpath, function (error, data) {
                const datastr = data.toString(); console.log(typeof datastr);
     
                if (datastr) {
                  resolve(JSON.parse(datastr));
     
                } else console.log('failed to read the json file'), resolve(JSON.parse(self.dataTemplate))
              })
            }
     
     
          })
        }) */
    }
    delete() {
    }
    writeData(token, data) {
        //console.log('write data', data);
        return this.redis.hSet(this.tablename, token, data);
        /*   const userpath = path.join(process.cwd(), 'data/', this.tablename + '.json')
          fs.writeFile(userpath, dataStr, {}, function (error) {
            error && console.log('failed to write user data', error) || (2)
      
          }) */
    }
}
exports.Table = Table;
