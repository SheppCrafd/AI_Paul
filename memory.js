const fs = require('fs');
const path = require('path');
const CHAT_HISTORY_FILE = path.join(__dirname, '..', '..', 'chatMemory.json');

function saveChatMemory(memory) {
  try {
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(memory, null, 2));
  } catch (err) {
    console.error('Failed to save chat memory:', err);
  }
}

function loadChatMemory() {
  try {
    if (!fs.existsSync(CHAT_HISTORY_FILE)) return [];
    const data = fs.readFileSync(CHAT_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load chat memory:', err);
    return [];
  }
}

module.exports = { saveChatMemory, loadChatMemory };