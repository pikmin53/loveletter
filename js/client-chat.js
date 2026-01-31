// Client chat script (used inside message.html iframe)
const socketChat = io();

const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socketChat.emit('chat message', input.value);
      input.value = '';
    }
  });
}

socketChat.on('chat message', function(msg) {
  if (!messages) return;
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
