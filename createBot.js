const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const chatHandler = require('./chatHandler');
const options = require('./options'); //Pulls in .env stuff safely

function createBot() {
  const bot = mineflayer.createBot(options.botOptions); // ✅ uses your setup
  bot.loadPlugin(pathfinder);

  bot.on('login', () => console.log('Logged in!'));
  bot.on('error', err => console.log('Bot error:', err));
  bot.on('end', () => {
    console.log('Disconnected, reconnecting...');
    setTimeout(() => createBot(), 10000);
  });

  bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version);
    chatHandler(bot, mcData);
  });

  return bot;
}

module.exports = createBot;
