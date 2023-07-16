export default function strJSON(obj:any){
    for(let key in obj){
        if(key == 'data'){
            obj[key] = JSON.stringify(obj[key]);
        }
    }
    return JSON.stringify(obj);
}