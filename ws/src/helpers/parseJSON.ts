// import { ReqCreateOrLogin } from "../types/types";

// type JsonObject = {
//     [key:string] : object
// }

export default function parseJSON(obj:any){
    for(let key in obj){
        if(key == 'data' && obj[key]){
            obj[key] = JSON.parse(obj[key]);
        }
    }
}
