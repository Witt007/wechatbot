"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const redis_1 = require("redis");
const table_1 = require("../table");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Database {
    constructor(databaseName) {
        this.tables = new Map();
        this.databaseName = databaseName;
        console.log(process.env.REDIS_PORT);
        this.redis = (0, redis_1.createClient)({
            password: process.env.REDIS_PWD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT)
            }
        });
        this.redis.connect();
        this.redis.on('connect', () => console.log('Redis Client Connected'));
    }
    createTable(tablename) {
        return new table_1.Table(tablename, this.redis);
    }
    deleteTable(tablename) {
        const table = this.tables.get(tablename);
        if (table) {
            try {
                // table.delete()
            }
            catch (error) {
                console.log('failed to delete table', error);
            }
        }
    }
}
exports.Database = Database;
