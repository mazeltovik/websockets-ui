import { ReqCreateOrLogin, UserDB, User } from "../types/types";
import { WebSocket } from "ws";

class DB implements UserDB {
    players: User[];
    constructor() {
        this.players = [];
    }
    createPlayer(data:ReqCreateOrLogin,ws:WebSocket) {
        if(this.isPlayerNotExist(data.data)){
            //player is not exist
            this.players.push({...data.data,id:ws.id,wins:0});
            return {
                status: 'Player created successfully',
                data:{
                    id:ws.id,
                    name:data.data.name
                }
            };
        } else {
            return this.checkLoginAndPassword(data.data);
        }

    }
    isPlayerNotExist(data:ReqCreateOrLogin['data']){
        let player = this.players.find(player => player.name == data.name);
        return !player? true : false;
    }
    checkLoginAndPassword(data:ReqCreateOrLogin['data']){
        let filteredPlayers = this.players.filter(player=>player.name == data.name);
        if(filteredPlayers.length > 1){
            return {
                status: 'Player with this login is already exist',
                data:{
                    id:null,
                    name:null,
                }
            }
        } else {
            if(filteredPlayers[0].password == data.password){
                return {
                    status: 'Succsess login',
                    data:{
                        id:filteredPlayers[0].id,
                        name:filteredPlayers[0].name
                    }
                };
            } else {
                return {
                    status:'Wrong password',
                    data:{
                        id:null,
                        name:null
                    }
                
                }
            }
        }
    }
}

const db = new DB();

export default db