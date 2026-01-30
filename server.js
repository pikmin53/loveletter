const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); //const socketIOModule = require("socket.io"); const Server = socketIOModule.Server;

const os = require("os");



const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));


const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === "IPv4" && !net.internal) {
      console.log(`Accessible sur http://${net.address}:3000`);
    }
  }
}


const CARDS = [
  { name: "Garde", value: 1, count: 5 },
  { name: "Prêtre", value: 2, count: 2 },
  { name: "Baron", value: 3, count: 2 },
  { name: "Servante", value: 4, count: 2 },
  { name: "Prince", value: 5, count: 2 },
  { name: "Roi", value: 6, count: 1 },
  { name: "Comtesse", value: 7, count: 1 },
  { name: "Princesse", value: 8, count: 1 }
];

let game = {
  players: [],
  deck: [],
  current: 0,
  started: false
};



function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function buildDeck() {
  let deck = [];
  CARDS.forEach(c => {
    for (let i = 0; i < c.count; i++) deck.push({...c});
  });
  return shuffle(deck);
}



io.on("connection", socket => {
    if (game.started) {
        socket.disconnect(true);
        return;
    }

    if (game.players.length >= 6) return socket.disconnect();
        game.players.push({
        id: socket.id,
        hand: [],
        alive: true,
        ready: false
        });


    socket.emit("joined", socket.id);
    io.emit("state", game);

    socket.on("ready", () => {
        const player = game.players.find(p => p.id === socket.id);
        if (!player) return;
        player.ready = true;
        io.emit("state", game);
    });


    socket.on("start", () => {
        if (game.started) return;

        const allReady = game.players.length >= 2 &&
        game.players.every(p => p.ready);

        if (!allReady) return;

        game.started = true;
        game.deck = buildDeck();
        game.players.forEach(p => p.hand = [game.deck.pop()]);
        game.current = 0;
        game.players[0].hand.push(game.deck.pop());

        io.emit("state", game);
    });


  socket.on("play", index => {
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (player.id !== socket.id) return;
    if (playerIndex !== game.current) return;
    const card = player.hand.splice(index, 1)[0];
    if (card.name === "Princesse") player.alive = false;

    do {
      game.current = (game.current + 1) % game.players.length;
    } while (!game.players[game.current].alive);

    if (game.deck.length)
        game.players[game.current].hand.push(game.deck.pop());

    io.emit("state", game);
  });

  
  socket.on("disconnect", () => {
    game.players = game.players.filter(p => p.id !== socket.id);
    io.emit("state", game);
  });
});

server.listen(3000, () =>
  console.log("💌 Love Letter en ligne sur http://localhost:3000")
);
