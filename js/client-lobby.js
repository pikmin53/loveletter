// Client lobby script
const socket = io();
let myId = null;
let isReady = false;

socket.on('connect', () => { myId = socket.id; });

function setName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('Entre un pseudo');
  socket.emit('setName', name, (res) => {
    if (!res || !res.ok) {
      return alert(res && res.error ? res.error : 'Erreur lors de la mise à jour du pseudo');
    }
    document.getElementById('login').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
  });
}

function ready() {
  socket.emit('ready');
  isReady = !isReady;
  document.getElementById('readyBtn').innerHTML = isReady ? '❌ Ne plus être prêt' : '✅ Prêt';
}

function toggleChat() {
  const frame = document.getElementById('chatFrame');
  const btn = document.getElementById('chatToggle');
  if (!frame || !btn) return;
  const hidden = frame.style.display === 'none';
  frame.style.display = hidden ? 'block' : 'none';
  btn.textContent = hidden ? '✖' : '💬';
}

socket.on('state', game => {
  if (game.started) {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    return;
  }

  const div = document.getElementById('players');
  div.innerHTML = '';

  game.players.forEach(p => {
    const line = document.createElement('div');
    line.className = 'player' + (p.id === myId ? ' me' : '');
    line.innerHTML = `
      ${p.name || 'Sans pseudo'}
      <span class="${p.ready ? 'ready' : 'not-ready'}">
        ${p.ready ? '✔ Prêt' : '⏳ Pas prêt'}
      </span>
      ${p.id === myId ? ' 👈 toi' : ''}
    `;
    div.appendChild(line);
  });
});

// Init UI behavior
document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('chatFrame');
  const btn = document.getElementById('chatToggle');
  const small = window.matchMedia('(max-width:700px)').matches;

  if (small) {
    if (frame) frame.style.display = 'none';
    if (btn) btn.textContent = '💬';
  } else {
    if (frame) frame.style.display = 'block';
    if (btn) btn.textContent = '✖';
  }

  const nameInput = document.getElementById('nameInput');
  if (nameInput) {
    nameInput.addEventListener('focus', () => {
      if (window.matchMedia('(max-width:700px)').matches) {
        setTimeout(() => nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      }
    });
  }
});

window.addEventListener('resize', () => {
  const frame = document.getElementById('chatFrame');
  const btn = document.getElementById('chatToggle');
  const small = window.matchMedia('(max-width:700px)').matches;
  if (small) {
    if (frame) frame.style.display = 'none';
    if (btn) btn.textContent = '💬';
  } else {
    if (frame) frame.style.display = 'block';
    if (btn) btn.textContent = '✖';
  }
});

// expose to global scope for inline attribute handlers
window.setName = setName;
window.ready = ready;
window.toggleChat = toggleChat;
