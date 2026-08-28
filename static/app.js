const chat = document.querySelector('#chat');
const form = document.querySelector('#form');
const input = document.querySelector('#message');

function add(role, text) {
  const item = document.createElement('div');
  item.className = `message ${role}`;
  item.textContent = text;
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  add('user', message);
  input.value = '';
  add('assistant', 'Thinking...');
  const placeholder = chat.lastElementChild;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message})
    });
    const data = await response.json();
    placeholder.textContent = data.response || data.detail || 'Something went wrong.';
  } catch (error) {
    placeholder.textContent = 'Connection error. Please try again.';
  }
});
