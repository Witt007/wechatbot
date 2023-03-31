import { RedisClientType, createClient } from "redis";

export interface tableData {

}
export class Table {
  tablename: string
 private redis: RedisClientType
  constructor(tablename: string, redis: RedisClientType) {
    this.tablename = tablename;
    this.redis = redis;
  }

  private dataTemplate = JSON.stringify({ users: {}, msgRecord: {} })

   readData<T extends tableData>(token:string): Promise<T> {
    return new Promise<T>(async (resolve) => {
      try {
        console.log('hget',this.redis.hGet);
        
        const v = await this.redis.hGet(this.tablename,token).catch((err)=>{console.log(err,token);
        });
        
        resolve(JSON.parse(v || '{}'));
        
      } catch (error) {
        console.log('reading data encountered an error',error);
        
      }
    })

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
  writeData<T extends tableData>(token:string,data: T) {
    const dataStr = JSON.stringify(data);
    //console.log('write data', data);

    return this.redis.hSet(this.tablename,token, dataStr);

    /*   const userpath = path.join(process.cwd(), 'data/', this.tablename + '.json')
      fs.writeFile(userpath, dataStr, {}, function (error) {
        error && console.log('failed to write user data', error) || (2)
  
      }) */



  }
 


}