const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DEFAULT_GROUP = 'general';

const groups = new Map([[DEFAULT_GROUP, []]]);
const users = new Map();

app.use(express.static(path.join(__dirname)));

function systemMessage(text) {
  return {
    type: 'system',
    text,
    timestamp: new Date().toISOString(),
  };
}

function chatMessage(user, text) {
  return {
    type: 'chat',
    user,
    text,
    timestamp: new Date().toISOString(),
  };
}

function sanitizeGroupName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 30);
}

function broadcastGroups() {
  io.emit('groups', { allGroups: Array.from(groups.keys()) });
}

io.on('connection', (socket) => {
  socket.on('register-user', ({ username }, callback) => {
    const cleanUsername = String(username || '').trim().slice(0, 20);

    if (!cleanUsername) {
      callback({ ok: false, error: 'Username is required.' });
      return;
    }

    users.set(socket.id, cleanUsername);
    callback({ ok: true });

    socket.join(DEFAULT_GROUP);
    groups.get(DEFAULT_GROUP).push(systemMessage(`${cleanUsername} joined #${DEFAULT_GROUP}`));

    socket.emit('joined-group', {
      groupName: DEFAULT_GROUP,
      history: groups.get(DEFAULT_GROUP),
    });

    io.to(DEFAULT_GROUP).emit('group-message', {
      groupName: DEFAULT_GROUP,
      message: systemMessage(`${cleanUsername} entered the room.`),
    });

    broadcastGroups();
  });

  socket.on('create-group', ({ groupName }, callback) => {
    const cleanGroup = sanitizeGroupName(groupName);

    if (!cleanGroup) {
      callback({ ok: false, error: 'Invalid group name.' });
      return;
    }

    if (!groups.has(cleanGroup)) {
      groups.set(cleanGroup, [systemMessage(`Group #${cleanGroup} created.`)]);
      broadcastGroups();
    }

    socket.emit('groups', { allGroups: Array.from(groups.keys()) });
    callback({ ok: true });
  });

  socket.on('join-group', ({ groupName }, callback) => {
    const cleanGroup = sanitizeGroupName(groupName);
    const username = users.get(socket.id);

    if (!username) {
      callback({ ok: false, error: 'Register first.' });
      return;
    }

    if (!groups.has(cleanGroup)) {
      callback({ ok: false, error: 'Group not found.' });
      return;
    }

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    socket.join(cleanGroup);
    const history = groups.get(cleanGroup);
    history.push(systemMessage(`${username} joined #${cleanGroup}`));

    io.to(cleanGroup).emit('group-message', {
      groupName: cleanGroup,
      message: systemMessage(`${username} joined the group.`),
    });

    callback({ ok: true, history });
  });

  socket.on('group-message', ({ groupName, text }) => {
    const cleanGroup = sanitizeGroupName(groupName);
    const username = users.get(socket.id);

    if (!username || !groups.has(cleanGroup)) {
      return;
    }

    const message = chatMessage(username, String(text || '').trim().slice(0, 500));

    if (!message.text) {
      return;
    }

    groups.get(cleanGroup).push(message);
    io.to(cleanGroup).emit('group-message', { groupName: cleanGroup, message });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });

  socket.emit('groups', { allGroups: Array.from(groups.keys()) });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
