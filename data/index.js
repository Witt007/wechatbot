"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.tb = void 0;
const database_1 = require("../API/DB/Redis/database");
const database = new database_1.Database('chatbot');
exports.database = database;
const tb = database.createTable('users');
exports.tb = tb;
