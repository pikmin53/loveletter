// server management
const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); //const socketIOModule = require("socket.io"); const Server = socketIOModule.Server;

const os = require("os");
const { send } = require("process");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.get('/', (req, res) => {
  res.sendFile('/home/cytech/loveletter/html/index.html');
});

const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === "IPv4" && !net.internal) {
      console.log(`Accessible sur http://${net.address}:3000`);
    }
  }
}


// game state and set up variables
const CARDS = [
  { name: "Espionne", value: 0, count: 2 },
  { name: "Garde", value: 1, count: 6 },
  { name: "Prêtre", value: 2, count: 2 },
  { name: "Baron", value: 3, count: 2 },
  { name: "Servante", value: 4, count: 2 },
  { name: "Prince", value: 5, count: 2 },
  { name: "Chancelier", value: 6, count: 2 },
  { name: "Roi", value: 7, count: 1 },
  { name: "Comtesse", value: 7, count: 1 },
  { name: "Princesse", value: 8, count: 1 }
];

let game = {
  players: [],
  deck: [],
  current: 0,
  started: false
};


// functions to play the game

function buildDeck() {
  let deck = [];
  CARDS.forEach(c => {
    for (let i = 0; i < c.count; i++) deck.push({...c});
  });
  return shuffle(deck);
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function sendState() {
  game.players.forEach(player => {
    const stateForPlayer = {
      started: game.started,
      current: game.current,
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
        ready: p.ready,
        cardCount: p.hand.length,
        hand: p.id === player.id ? p.hand : [] // 👈 SECRET
      }))
    };

    io.to(player.id).emit("state", stateForPlayer);
  });
}

// main server loop
io.on("connection", socket => {
    if (game.started) {
        socket.disconnect(true);
        return;
    }

    if (game.players.length >= 6) return socket.disconnect(); //A MODIFIER ABSOLUEMENT POUR AFFICHER LE NOM DES JOUEURS DANS LE LOBBY
        game.players.push({
        id: socket.id,
        name: `Joueur ${game.players.length + 1}`,
        hand: [],
        alive: true,
        ready: false
        });


    socket.emit("joined", socket.id);
    sendState();

    socket.on("ready", () => {
        const player = game.players.find(p => p.id === socket.id);
        if (!player) return;
        player.ready = !player.ready;
        sendState();
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

        sendState();
    });


  socket.on("play", index => {
    if (!game.started) return;
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    const player = game.players[playerIndex];
    if (playerIndex !== game.current) return;
    if (index < 0 || index >= player.hand.length) return;

    const card = player.hand.splice(index, 1)[0];
    if (card.name === "Princesse") {
      player.alive = false;
    }

    // advance to next alive player
    if (game.players.some(p => p.alive)) {
      do {
        game.current = (game.current + 1) % game.players.length;
      } while (!game.players[game.current].alive);
    }

    if (game.deck.length) {
      game.players[game.current].hand.push(game.deck.pop());
    }

    sendState();
  });

  
  socket.on("disconnect", () => {
    game.players = game.players.filter(p => p.id !== socket.id);
    sendState();
  });
});

server.listen(3000, () =>
  console.log("💌 Love Letter en ligne sur http://localhost:3000")
);
