// Game logic: deck, start, play
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

let ioRef = null;
let lobbyRef = null;
let deck = [];
let started = false;
let current = 0;

function init({ io, lobby }) {
  ioRef = io;
  lobbyRef = lobby;
}

function buildDeck() {
  const d = [];
  CARDS.forEach(c => {
    for (let i = 0; i < c.count; i++) d.push({ ...c });
  });
  return shuffle(d);
}

function shuffle(d) {
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function isStarted() {
  return started;
}

function getCurrent() {
  return current;
}

function start(initiatorId) {
  if (started) return;
  const players = lobbyRef.getPlayers();
  const allReady = players.length >= 2 && players.every(p => p.ready);
  if (!allReady) return;

  started = true;
  deck = buildDeck();
  players.forEach(p => p.hand = [deck.pop()]);
  current = 0;
  players[0].hand.push(deck.pop());

  lobbyRef.broadcastState();
}

function play(playerId, index) {
  if (!started) return;
  const players = lobbyRef.getPlayers();
  const playerIndex = players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;
  if (playerIndex !== current) return;
  const player = players[playerIndex];
  if (index < 0 || index >= player.hand.length) return;

  const card = player.hand.splice(index, 1)[0];
  if (card.name === "Princesse") {
    player.alive = false;
  }

  // advance to next alive player
  if (players.some(p => p.alive)) {
    do {
      current = (current + 1) % players.length;
    } while (!players[current].alive);
  }

  if (deck.length) {
    players[current].hand.push(deck.pop());
  }

  lobbyRef.broadcastState();
}

function handleDisconnect(playerId) {
  // Keep simple: if players list is empty, reset game state
  const players = lobbyRef.getPlayers();
  if (players.length === 0) {
    started = false;
    deck = [];
    current = 0;
  } else if (started) {
    current = current % players.length;
  }
}

module.exports = {
  init,
  start,
  play,
  isStarted,
  getCurrent,
  handleDisconnect
};
