import WebSocket, { WebSocketServer } from 'ws';
import db from './models/db';
import loginOrCreate from './controllers/LoginOrCreate';
import parseJSON from './helpers/parseJSON';
import rooms from './models/rooms';


let socketId = 0;


const wss = new WebSocketServer({ port: 3000 });

wss.on('listening',()=>{
    console.log(`Server is running on port 3000`)
})

wss.on('connection', function connection(ws) {
  ws.id = socketId;
  socketId += 1;
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    let reqMsg = JSON.parse(data.toString());
    parseJSON(reqMsg);
    if(reqMsg.type == 'reg'){
      loginOrCreate(db.createPlayer(reqMsg,ws),ws)
    }
    if(reqMsg.type == 'create_room'){
      let player = db.players.find(player=>player.id == ws.id);
      if(player){
        rooms.createRoom({name:player.name,id:player.id},ws);
      }
    }
    if(reqMsg.type == 'add_user_to_room'){
      rooms.addUserToRoom(ws,reqMsg.data.indexRoom);
    }
    if(reqMsg.type == 'add_ships'){
      rooms.startGame(reqMsg.data);
    }
    if(reqMsg.type == 'attack'){
      rooms.attack(reqMsg.data,wss);
    }
  });
});

