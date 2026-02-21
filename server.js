const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  addChatMessage,
  addSystemMessage,
  addUser,
  createGroup,
  getGroupHistory,
  listGroups,
  markMessageRead,
  sanitizeGroupName,
} = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DEFAULT_GROUP = 'general';
const users = new Map();

app.use(express.static(path.join(__dirname)));

function broadcastGroups() {
  io.emit('groups', { allGroups: listGroups() });
}

function joinGroup(socket, groupName, username) {
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
    }
  }

  socket.join(groupName);
  socket.data.currentGroup = groupName;

  addSystemMessage(groupName, `${username} joined #${groupName}`);

  const history = getGroupHistory(groupName);

  for (const message of history) {
    if (message.type === 'chat' && message.user !== username) {
      const receipt = markMessageRead(groupName, message.id, username);
      if (receipt) {
        io.to(groupName).emit('message-read', receipt);
      }
    }
  }

  return getGroupHistory(groupName);
}

io.on('connection', (socket) => {
  socket.on('register-user', ({ username }, callback) => {
    const cleanUsername = String(username || '').trim().slice(0, 20);

    if (!cleanUsername) {
      callback({ ok: false, error: 'Username is required.' });
      return;
    }

    users.set(socket.id, cleanUsername);
    addUser(cleanUsername);
    callback({ ok: true });

    const history = joinGroup(socket, DEFAULT_GROUP, cleanUsername);

    socket.emit('joined-group', {
      groupName: DEFAULT_GROUP,
      history,
    });

    io.to(DEFAULT_GROUP).emit('group-message', {
      groupName: DEFAULT_GROUP,
      message: addSystemMessage(DEFAULT_GROUP, `${cleanUsername} entered the room.`),
    });

    broadcastGroups();
  });

  socket.on('create-group', ({ groupName }, callback) => {
    const result = createGroup(groupName);

    if (!result.ok) {
      callback(result);
      return;
    }

    callback({ ok: true });
    broadcastGroups();
  });

  socket.on('join-group', ({ groupName }, callback) => {
    const cleanGroup = sanitizeGroupName(groupName);
    const username = users.get(socket.id);

    if (!username) {
      callback({ ok: false, error: 'Register first.' });
      return;
    }

    if (!listGroups().includes(cleanGroup)) {
      callback({ ok: false, error: 'Group not found.' });
      return;
    }

    const history = joinGroup(socket, cleanGroup, username);

    io.to(cleanGroup).emit('group-message', {
      groupName: cleanGroup,
      message: addSystemMessage(cleanGroup, `${username} joined the group.`),
    });

    callback({ ok: true, history });
  });

  socket.on('group-message', ({ groupName, text }) => {
    const cleanGroup = sanitizeGroupName(groupName);
    const username = users.get(socket.id);

    if (!username || !listGroups().includes(cleanGroup)) {
      return;
    }

    const message = addChatMessage(cleanGroup, username, text);
    if (!message) {
      return;
    }

    io.to(cleanGroup).emit('group-message', { groupName: cleanGroup, message });
  });

  socket.on('message-seen', ({ groupName, messageId }) => {
    const cleanGroup = sanitizeGroupName(groupName);
    const username = users.get(socket.id);

    if (!username || !listGroups().includes(cleanGroup)) {
      return;
    }

    const receipt = markMessageRead(cleanGroup, messageId, username);
    if (receipt) {
      io.to(cleanGroup).emit('message-read', receipt);
    }
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });

  socket.emit('groups', { allGroups: listGroups() });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
