import {  tableData} from "../../API/DB/Redis/table";
export type username = string

export type user = { name?: string, token: string, isLoggedIn?: boolean, contact?: any, phone?: any,isVip?:boolean }

export interface userData extends tableData {
  [key: username]: user
}
