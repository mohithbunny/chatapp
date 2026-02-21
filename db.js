const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'chat-db.json');

const initialData = {
  users: [],
  groups: {
    general: {
      messages: [],
    },
  },
};

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return structuredClone(initialData);
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    parsed.users ||= [];
    parsed.groups ||= {};
    if (!parsed.groups.general) {
      parsed.groups.general = { messages: [] };
    }
    return parsed;
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return structuredClone(initialData);
  }
}

let db = loadDb();

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function addUser(username) {
  if (!db.users.includes(username)) {
    db.users.push(username);
    saveDb();
  }
}

function sanitizeGroupName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 30);
}

function ensureGroup(groupName) {
  if (!db.groups[groupName]) {
    db.groups[groupName] = { messages: [] };
  }
}

function createGroup(rawName) {
  const groupName = sanitizeGroupName(rawName);
  if (!groupName) {
    return { ok: false, error: 'Invalid group name.' };
  }

  if (!db.groups[groupName]) {
    db.groups[groupName] = { messages: [] };
    saveDb();
  }

  return { ok: true, groupName };
}

function listGroups() {
  return Object.keys(db.groups);
}

function systemMessage(text) {
  return {
    id: `sys_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type: 'system',
    text,
    timestamp: new Date().toISOString(),
    readBy: {},
  };
}

function addSystemMessage(groupName, text) {
  ensureGroup(groupName);
  const msg = systemMessage(text);
  db.groups[groupName].messages.push(msg);
  saveDb();
  return msg;
}

function addChatMessage(groupName, user, text) {
  ensureGroup(groupName);
  const cleaned = String(text || '').trim().slice(0, 500);
  if (!cleaned) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type: 'chat',
    user,
    text: cleaned,
    timestamp,
    readBy: {
      [user]: timestamp,
    },
  };

  db.groups[groupName].messages.push(msg);
  saveDb();
  return msg;
}

function getGroupHistory(groupName) {
  ensureGroup(groupName);
  return db.groups[groupName].messages;
}

function markMessageRead(groupName, messageId, username) {
  ensureGroup(groupName);
  const messages = db.groups[groupName].messages;
  const message = messages.find((item) => item.id === messageId);

  if (!message || message.type !== 'chat' || !username) {
    return null;
  }

  if (!message.readBy[username]) {
    message.readBy[username] = new Date().toISOString();
    saveDb();
  }

  return {
    messageId: message.id,
    groupName,
    readBy: message.readBy,
  };
}

module.exports = {
  addChatMessage,
  addSystemMessage,
  addUser,
  createGroup,
  getGroupHistory,
  listGroups,
  markMessageRead,
  sanitizeGroupName,
};
