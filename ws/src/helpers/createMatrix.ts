import { Ships, Coords } from "../types/types";

export default function createMatrix(ships:Ships | undefined){
    let matrix = new Array(10);
    for(let i = 0;i<matrix.length;i++){
        matrix[i] = new Array(10).fill(0);
    }
    let coords:Coords = {};
    ships?.forEach((ship,index)=>{
        let coord = [];
        if(ship.direction){
            for(let y = ship.position.y,i=0;i<ship.length;y++,i++){
                coord.push({x:ship.position.x,y})
            }
        } else {
            for(let x = ship.position.x,i=0;i<ship.length;x++,i++){
                coord.push({x,y:ship.position.y})
            }
        }
        coords[`id${index}`] = coord
    })
    for(let key in coords){
        coords[key].forEach(coord =>{
            matrix[coord.y][coord.x] = key
        })
    }
    return {matrix,coords}
}