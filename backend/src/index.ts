import WebSocket, { WebSocketServer } from 'ws';


const wss = new WebSocketServer({ port: 3000 });

wss.on('listening',()=>{
    console.log(`Server is running on port 3000`)
})

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});