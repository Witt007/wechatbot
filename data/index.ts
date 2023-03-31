
import { Database } from "../API/DB/Redis/database";
const database = new Database('chatbot');
const tb = database.createTable('users');
export { tb, database }
