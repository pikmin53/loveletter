// Simple chat handler
let ioRef = null;
let lobbyRef = null;

function init({ io, lobby }) {
  ioRef = io;
  lobbyRef = lobby;
}

function handleMessage(playerId, msg) {
  if (!ioRef) return;
  const players = lobbyRef.getPlayers();
  const player = players.find(p => p.id === playerId);
  const name = player ? (player.name || playerId) : playerId;
  ioRef.emit('chat message', `${name}: ${String(msg)}`);
}

module.exports = { init, handleMessage };
