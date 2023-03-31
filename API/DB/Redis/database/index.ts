
import { RedisClientType ,createClient} from "redis";
import {Table} from "../table";
import dotenv from 'dotenv'
dotenv.config();
export  class Database {
    private tables: Map<string, Table> = new Map();
    databaseName: string
    redis: RedisClientType
    constructor(databaseName: string) {
      this.databaseName = databaseName; console.log(process.env.REDIS_PORT);
      
      this.redis = createClient({
        password: process.env.REDIS_PWD,
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT)
        }
      });
      this.redis.connect();
  
      this.redis.on('connect', () => console.log('Redis Client Connected'));
    }
    createTable(tablename: string): Table {
      return new Table(tablename, this.redis);
    }
  
    deleteTable(tablename: string) {
      const table = this.tables.get(tablename);
      if (table) {
        try {
          // table.delete()
        } catch (error) {
          console.log('failed to delete table', error);
  
        }
  
      }
    }
  }