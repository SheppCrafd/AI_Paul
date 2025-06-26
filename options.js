require('dotenv').config(); // Loads your .env file

module.exports = {
  botOptions: {
    host: process.env.MC_HOST,
    port: parseInt(process.env.MC_PORT),
    username: process.env.MC_BOT_USERNAME,
    version: process.env.MC_VERSION,
    auth: process.env.MC_AUTH // usually "offline" or "mojang"
  }
};