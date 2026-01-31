// Lobby management - stores players and broadcasts state
let ioRef = null;
let gameRef = null;
const players = [];

function init({ io, game }) {
  ioRef = io;
  gameRef = game;
}

function addPlayer(socket) {
  players.push({
    id: socket.id,
    name: `Joueur ${players.length + 1}`,
    hand: [],
    alive: true,
    ready: false
  });
}

function removePlayer(id) {
  const idx = players.findIndex(p => p.id === id);
  if (idx !== -1) players.splice(idx, 1);
}

function setName(id, name, cb) {
  const player = players.find(p => p.id === id);
  if (!player) {
    if (cb) cb({ ok: false, error: "Player not found" });
    return;
  }
  name = String(name || "").trim().slice(0, 20);
  if (!name) {
    if (cb) cb({ ok: false, error: "Nom invalide" });
    return;
  }
  player.name = name;
  broadcastState();
  if (cb) cb({ ok: true });
}

function toggleReady(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;
  player.ready = !player.ready;
  broadcastState();
}

function broadcastState() {
  if (!ioRef) return;
  players.forEach(player => {
    const stateForPlayer = {
      started: gameRef ? gameRef.isStarted() : false,
      current: gameRef ? gameRef.getCurrent() : 0,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
        ready: p.ready,
        cardCount: p.hand.length,
        hand: p.id === player.id ? p.hand : []
      }))
    };
    ioRef.to(player.id).emit('state', stateForPlayer);
  });
}

function getPlayers() {
  return players;
}

function getPlayerCount() {
  return players.length;
}

module.exports = {
  init,
  addPlayer,
  removePlayer,
  setName,
  toggleReady,
  broadcastState,
  getPlayers,
  getPlayerCount
};
