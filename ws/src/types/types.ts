import { WebSocket, WebSocketServer } from "ws";


export type ReqCreateOrLogin = {
    type:string,
    data:{
        name:string,
        password:string
    },
    id:0
}

export type ResCreateOrLogin = {
    status:string,
    data:{
        id:number|null,
        name:string|null,
    }

}

export type Player = {
    name:string,
    // password?:string,
    id:number,
    socket?: WebSocket;
}

export type ActivePlayer = {
    name:string,
    id:number,
    socket?: WebSocket,
    ships?:Ships,
    matrix?:number[][],
    coords?:Coords,
    attack?:boolean,
}

export type Coords = {
    [key:string]:{x:number,y:number}[]
}

export type Room = {
    roomId:number,
    roomUsers:Player[],
}

export interface UserDB{
    createPlayer(data:ReqCreateOrLogin,ws:WebSocket):ResCreateOrLogin
    isPlayerNotExist(data:ReqCreateOrLogin['data']):boolean
    checkLoginAndPassword(data:ReqCreateOrLogin['data']):ResCreateOrLogin
}

export interface RoomsInterface{
    createRoom(player:Player,socket:WebSocket):void
    updateRoom():void
    addUserToRoom(socket:WebSocket,indexRoom:number):void
    attack(data:any,wss:WebSocketServer):void
    broadcastTurn(data:any,id:number):void
}

type Ship = {
    position:{
        x:number,
        y:number,
    }
    direction:boolean,
    type:string,
    length: number
}

export type Ships = Ship[]


export type User = {
    name:string,
    password:string,
    id:number,
    wins:number, 
}