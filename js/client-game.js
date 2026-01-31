// Client game script (for playing.html)
const socketGame = io();
let myId = null;

socketGame.on('joined', id => { myId = id; });

function sendReady() { socketGame.emit('ready'); }
function startGame() { socketGame.emit('start'); }
function play(index) { socketGame.emit('play', index); }

socketGame.on('state', game => {
  const div = document.getElementById('game');
  if (!div) return;
  div.innerHTML = `<h2>Tour en cours</h2>`;
  div.innerHTML += `<p>Partie ${game.started ? 'en cours' : 'en attente'} - Joueur courant: ${game.current + 1}</p>`;

  game.players.forEach((p, idx) => {
    div.innerHTML += `
      <div class="player ${!p.alive ? 'dead' : ''}">
        <strong>${p.name || 'Joueur ' + (idx + 1)}</strong> ${!p.alive ? '💀' : ''}
        ${p.id === myId ? (
          p.hand.map((c, i) => `<button onclick="play(${i})">${c.name}</button>`).join(' ')
        ) : (p.hand.length > 0 ? `🂠 ${p.cardCount} carte(s)` : '')}
        ${p.ready ? ' ✅ Prêt' : ''}
      </div>
    `;
  });

  if (!game.started) {
    div.innerHTML += `<button onclick="sendReady()">✓ Prêt</button>`;
    const amReady = game.players.some(p => p.id === myId && p.ready);
    const allReady = game.players.length >= 2 && game.players.every(p => p.ready);
    if (amReady && allReady) {
      div.innerHTML += `<button onclick="startGame()">🎮 Démarrer</button>`;
    }
  }
});

// expose functions
window.sendReady = sendReady;
window.startGame = startGame;
window.play = play;
