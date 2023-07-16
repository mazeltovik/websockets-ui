import { type } from "os";
import { ReqCreateOrLogin, ResCreateOrLogin } from "../types/types"
import { WebSocket } from "ws";
import strJSON from "../helpers/strJson";
import parseJSON from "../helpers/parseJSON";
import rooms from "../models/rooms";


export default function loginOrCreate(data: ResCreateOrLogin, ws: WebSocket) {
    if (data.status == 'Player created successfully' || data.status == 'Succsess login') {
        let res = {
            type: 'reg',
            data: {
                name: data.data.name,
                index: data.data.id,
                error: false,
                errorText: ''
            },
            id: 0
        }
        ws.send(strJSON(res));
        parseJSON(res);
        // rooms.createRoom({ name: String(res.data.name), id: Number(res.data.index) }, ws)
    }
    if (data.status == 'Player with this login is already exist' || data.status == 'Wrong password') {
        let res = {
            type: 'reg',
            data: {
                name: data.data.name,
                index: data.data.id,
                error: true,
                errorText: data.status
            },
            id: 0
        }
        ws.send(strJSON(res));
    }
}