import { WebSocket, WebSocketServer } from "ws";
import { Player, RoomsInterface, Room, ActivePlayer } from "../types/types"
import createMatrix from "../helpers/createMatrix";
import db from "./db";


class Rooms implements RoomsInterface {
    static gameId = 0;
    rooms: Room[];
    activeRooms: ActivePlayer[][];
    constructor() {
        this.rooms = [];
        this.activeRooms = [];
    }
    createRoom(player: Player, socket: WebSocket) {
        let isExistPlayer = this.rooms.find(room => {
            return room.roomUsers[0].id == socket.id;
        });
        if (!isExistPlayer) {
            this.rooms.push({ roomId: socket.id, roomUsers: [{ ...player, socket }] })

            this.updateRoom();
        } else {
            if (isExistPlayer.roomUsers[0].id != player.id) {
                this.rooms.push({ roomId: socket.id, roomUsers: [{ ...player, socket }] })

                this.updateRoom();
            }
        }
    }

    updateRoom() {
        let availableRooms = this.rooms.filter(room => {
            if (room.roomUsers.length == 1) {
                return room;
            }
        })
        let transformRoom = availableRooms.map(room => {
            if (room) {
                let { name, id } = room?.roomUsers[0];
                return {
                    roomId: room?.roomId,
                    roomUsers: [{
                        name: name,
                        index: id
                    }],
                }
            }
        })
        this.rooms.forEach(room => {
            if (room) {
                room.roomUsers[0].socket?.send(JSON.stringify({
                    type: "update_room",
                    data: JSON.stringify(transformRoom),
                    id: 0
                }))
            }
        })
    }
    addUserToRoom(socket: WebSocket, indexRoom: number) {
        let socketUser = this.rooms.filter(room => {
            return room.roomUsers[0].id == socket.id;
        })
        let indexRoomUser = this.rooms.filter(room => {
            return room.roomUsers[0].id == indexRoom;
        })
        if (socketUser[0].roomUsers[0].id !== indexRoomUser[0].roomUsers[0].id) {
            //[current user, enemy]
            this.activeRooms.push([socketUser[0].roomUsers[0], indexRoomUser[0].roomUsers[0]]);
            this.rooms = this.rooms.filter(room => {
                return room.roomId != socket.id && room.roomId != indexRoom;
            });
            console.log(this.rooms);
            this.updateRoom();

            let whoStartGame = this.activeRooms.findIndex((rooms) => {
                let [first] = rooms;
                return first.id === socket.id
            });

            this.activeRooms[whoStartGame].forEach(activeRoom => {
                activeRoom.socket?.send(JSON.stringify({
                    type: "create_game",
                    data: JSON.stringify({
                        idGame: Rooms.gameId,
                        idPlayer: activeRoom.id
                    }),
                    id: 0
                }))
            });

            Rooms.gameId += 1;
        }
    }
    startGame(data: any) {

        let whereAddShips = this.activeRooms[data.gameId].findIndex(room => {
            return room.id == data.indexPlayer;
        })

        // Записываю корабли врага в обьект текущего пользователя и создаю матрицу с кораблями
        if (whereAddShips == 0) {
            this.activeRooms[data.gameId][1].ships = data.ships;
            let { matrix, coords } = createMatrix(this.activeRooms[data.gameId][1].ships);
            this.activeRooms[data.gameId][1].coords = coords;
            this.activeRooms[data.gameId][1].matrix = matrix;
            this.activeRooms[data.gameId][1].attack = false;
        } else {
            this.activeRooms[data.gameId][0].ships = data.ships;
            let { matrix, coords } = createMatrix(this.activeRooms[data.gameId][0].ships);
            this.activeRooms[data.gameId][0].coords = coords;
            this.activeRooms[data.gameId][0].matrix = matrix;
            this.activeRooms[data.gameId][0].attack = true;
        }
        if ("ships" in this.activeRooms[data.gameId][0] && "ships" in this.activeRooms[data.gameId][1]) {
            this.activeRooms[data.gameId].forEach(room => {
                room.socket?.send(JSON.stringify({
                    type: "start_game",
                    data: JSON.stringify({
                        ships: room.ships,
                        currentPlayerIndex: room.id
                    }),
                    id: 0
                }))
            })
            this.activeRooms[data.gameId].forEach(room => {
                room.socket?.send(JSON.stringify({
                    type: "turn",
                    data: JSON.stringify({
                        currentPlayer: this.activeRooms[data.gameId][0].id
                    }),
                    id: 0
                }))
            })
        }
    }
    attack(data: any, wss: WebSocketServer) {
        let currentRoom = this.activeRooms[data.gameId];
        let whoTurn = currentRoom.findIndex(room => {
            return room.id == data.indexPlayer
        })
        let activePlayer = this.activeRooms[data.gameId][whoTurn];
        let transformCoord = activePlayer.matrix![data.y][data.x];
        if (activePlayer.attack) {
            if (transformCoord) {
                let ship = activePlayer.coords?.[`${transformCoord}`];
                if (ship) {
                    let findCoordElem = ship?.findIndex(coord => {
                        return coord.x == data.x && coord.y == data.y;
                    });
                    if (ship!.length > 1) {
                        this.broadcastAttack(data, 'shoot');
                        this.broadcastAttack(data, 'killed');
                        this.broadcastTurn(data, activePlayer.id)
                        ship?.splice(findCoordElem, 1);
                        activePlayer.attack = true;
                    } else {
                        this.broadcastAttack(data, 'killed');
                        this.broadcastTurn(data, activePlayer.id)
                        ship?.splice(findCoordElem, 1);
                        delete activePlayer.coords?.[`${transformCoord}`];
                        activePlayer.attack = true;
                    }
                }
            } else {
                this.broadcastAttack(data, 'miss');
                this.broadcastTurn(data, whoTurn == 0 ? this.activeRooms[data.gameId][1].id : this.activeRooms[data.gameId][0].id);
                activePlayer.attack = false;
                let whosTurn = this.activeRooms[data.gameId].findIndex(room => {
                    return room.id == activePlayer.id;
                })
                if (whosTurn == 0) {
                    this.activeRooms[data.gameId][1].attack = true;
                } else {
                    this.activeRooms[data.gameId][0].attack = true;
                }
            }
            if (activePlayer.coords) {
                if (Object.keys(activePlayer.coords).length == 0) {
                    this.broadcastFinishGame(data, activePlayer.id);
                    this.broadcastUpdateWinner(activePlayer.name, wss);
                    this.activeRooms[data.gameId].forEach(activePlayer => {
                        if (activePlayer.socket) {
                            this.createRoom({ name: activePlayer.name, id: activePlayer.id }, activePlayer.socket);
                            this.updateRoom();
                        }
                    })
                }
            }
        }
    }
    broadcastAttack(data: any, status: string) {
        this.activeRooms[data.gameId].forEach(room => {
            room.socket?.send(JSON.stringify({
                type: 'attack',
                data: JSON.stringify({
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    currentPlayer: data.indexPlayer,
                    status
                })
            }))
        })
    }
    broadcastTurn(data: any, id: number) {
        this.activeRooms[data.gameId].forEach(room => {
            room.socket?.send(JSON.stringify({
                type: "turn",
                data: JSON.stringify({
                    currentPlayer: id
                }),
                id: 0
            }))
        })
    }
    broadcastFinishGame(data: any, winPlayer: number) {
        this.activeRooms[data.gameId].forEach(room => {
            room.socket?.send(JSON.stringify({
                type: "finish",
                data: JSON.stringify({
                    winPlayer
                }),
                id: 0
            }))
        })
    }
    broadcastUpdateWinner(name: string, wss: WebSocketServer) {
        let winnerUserIndex = db.players.findIndex(player => {
            return player.name == name;
        });
        console.log(winnerUserIndex, name, db.players);
        db.players[winnerUserIndex].wins += 1;
        let winners = db.players.filter(player => {
            return player.wins > 0;
        }).map(player => {
            return {
                name: player.name,
                wins: player.wins,
            }
        })
        wss.clients.forEach(client => {
            client.send(JSON.stringify({
                type: "update_winners",
                data: JSON.stringify(winners),
                id: 0
            }));
        });
    }
}

let rooms = new Rooms;
export default rooms;
