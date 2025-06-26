const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT),
  username: process.env.MC_BOT_USERNAME,
  version: process.env.MC_VERSION,
  auth: process.env.MC_AUTH
});

bot.on('login', () => {
  console.log('Bot logged in successfully!');
  bot.chat('Ping success!');
});

bot.on('spawn', () => {
  console.log('Bot has spawned in the world.');
});

bot.on('error', (err) => {
  console.error('Connection failed:', err);
});

bot.on('end', () => {
  console.log('Disconnected from server.');
});