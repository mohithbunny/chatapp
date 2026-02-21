const socket = io();

const groupList = document.getElementById('group-list');
const messagesContainer = document.getElementById('messages');
const activeGroupLabel = document.getElementById('active-group');
const groupMeta = document.getElementById('group-meta');
const createGroupForm = document.getElementById('create-group-form');
const groupNameInput = document.getElementById('group-name');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const usernameDialog = document.getElementById('username-dialog');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');

let username = '';
let currentGroup = '';
const groups = [];

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage({ user, text, timestamp, type }) {
  const messageElement = document.createElement('article');
  messageElement.className = `message ${type === 'system' ? 'system' : ''}`;

  if (type === 'system') {
    messageElement.textContent = text;
  } else {
    if (user === username) {
      messageElement.classList.add('self');
    }

    messageElement.innerHTML = `
      <div class="meta">
        <strong>${user}</strong>
        <time>${formatTime(timestamp)}</time>
      </div>
      <div>${text}</div>
    `;
  }

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderGroups() {
  groupList.innerHTML = '';

  groups.forEach((groupName) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = groupName;

    if (groupName === currentGroup) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      if (groupName === currentGroup) {
        return;
      }

      messagesContainer.innerHTML = '';
      socket.emit('join-group', { groupName }, (response) => {
        if (response.ok) {
          currentGroup = groupName;
          activeGroupLabel.textContent = `# ${groupName}`;
          groupMeta.textContent = `You are chatting as ${username}`;
          response.history.forEach(appendMessage);
          renderGroups();
          messageInput.focus();
        } else {
          alert(response.error);
        }
      });
    });

    item.appendChild(button);
    groupList.appendChild(item);
  });
}

createGroupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const groupName = groupNameInput.value.trim().toLowerCase();

  if (!groupName) {
    return;
  }

  socket.emit('create-group', { groupName }, (response) => {
    if (!response.ok) {
      alert(response.error);
      return;
    }

    groupNameInput.value = '';
  });
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentGroup) {
    return;
  }

  const text = messageInput.value.trim();
  if (!text) {
    return;
  }

  socket.emit('group-message', { groupName: currentGroup, text });
  messageInput.value = '';
});

usernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = usernameInput.value.trim();

  if (!name) {
    return;
  }

  username = name;
  socket.emit('register-user', { username }, (response) => {
    if (!response.ok) {
      alert(response.error);
      return;
    }

    usernameDialog.close();
  });
});

socket.on('groups', ({ allGroups }) => {
  groups.length = 0;
  groups.push(...allGroups);
  renderGroups();
});

socket.on('group-message', (payload) => {
  if (payload.groupName === currentGroup) {
    appendMessage(payload.message);
  }
});

socket.on('joined-group', ({ groupName, history }) => {
  currentGroup = groupName;
  activeGroupLabel.textContent = `# ${groupName}`;
  groupMeta.textContent = `You are chatting as ${username}`;
  messagesContainer.innerHTML = '';
  history.forEach(appendMessage);
  renderGroups();
});

usernameDialog.showModal();
