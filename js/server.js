// server management
const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); //const socketIOModule = require("socket.io"); const Server = socketIOModule.Server;

const os = require("os");
const path = require("path");
const { send } = require("process");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the project root so `/css`, `/html`, `/js` are accessible
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
});

const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === "IPv4" && !net.internal) {
      console.log(`Accessible sur http://${net.address}:3000`);
    }
  }
}


// use separated modules for lobby, game and chat
const lobby = require('./lobby');
const game = require('./game');
const chat = require('./chat');

// initialize modules with references
lobby.init({ io, game });
game.init({ io, lobby });
chat.init({ io, lobby });

// main server loop
io.on('connection', socket => {
  if (game.isStarted()) {
    socket.disconnect(true);
    return;
  }

  if (lobby.getPlayerCount() >= 6) return socket.disconnect();
  lobby.addPlayer(socket);

  socket.emit('joined', socket.id);
  lobby.broadcastState();

  socket.on('setName', (name, cb) => lobby.setName(socket.id, name, cb));
  socket.on('ready', () => lobby.toggleReady(socket.id));
  socket.on('start', () => game.start(socket.id));
  socket.on('play', index => game.play(socket.id, index));
  socket.on('chat message', msg => chat.handleMessage(socket.id, msg));

  socket.on('disconnect', () => {
    lobby.removePlayer(socket.id);
    game.handleDisconnect(socket.id);
    lobby.broadcastState();
  });
});

server.listen(3000, () =>
  console.log("💌 Love Letter en ligne sur http://localhost:3000")
);
