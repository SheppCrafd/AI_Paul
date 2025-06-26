const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
const say = require('./utils/say');
const { saveChatMemory, loadChatMemory } = require('./memory/memory');
require('dotenv').config();

const execPromise = util.promisify(exec);
const GENERATED_FUNCS_DIR = path.join(__dirname, '..', 'generatedFuncs');

module.exports = function (bot, mcData) {
  let following = false;
  const chatMemory = loadChatMemory();
  const dynamicFunctions = {};

  function loadDynamicFunctions() {
    if (!fs.existsSync(GENERATED_FUNCS_DIR)) fs.mkdirSync(GENERATED_FUNCS_DIR);
    const files = fs.readdirSync(GENERATED_FUNCS_DIR).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const funcModule = require(path.join(GENERATED_FUNCS_DIR, file));
        const funcName = path.basename(file, '.js');
        if (typeof funcModule === 'function') {
          dynamicFunctions[funcName] = funcModule;
          console.log(`Loaded dynamic function: ${funcName}`);
        }
      } catch (err) {
        console.error(`Error loading ${file}:`, err);
      }
    }
  }

  loadDynamicFunctions();

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    if (username.toLowerCase() !== process.env.MC_PLAYER_USERNAME.toLowerCase()) return;

    const logLine = `${username}: ${message}`;
    chatMemory.push(logLine);
    if (chatMemory.length > 64) chatMemory.shift();

    if (message.startsWith('createfunc ')) {
      const funcName = message.split(' ')[1];
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(funcName)) {
        return bot.chat('Invalid function name!');
      }

      bot.chat(`Generating function ${funcName}...`);

      const prompt = `
Write a Node.js async function named ${funcName}
that takes no arguments and returns a string
describing what it does.
Export with module.exports = async function() { ... };
      `.trim();

      try {
        const { stdout, stderr } = await execPromise(`powershell.exe -NoLogo -Command "& {ollama run llama3 \\"${message.replace(/"/g, '\\"')}\\" }"`);
        if (stderr) return bot.chat(`AI error: ${stderr}`);
        const code = stdout.trim();
        if (!code.includes('module.exports') || !code.includes('async function')) {
          return bot.chat('Function looks sus, canceled.');
        }

        const filePath = path.join(GENERATED_FUNCS_DIR, `${funcName}.js`);
        fs.writeFileSync(filePath, code);

        delete require.cache[require.resolve(filePath)];
        const newFunc = require(filePath);
        if (typeof newFunc === 'function') {
          dynamicFunctions[funcName] = newFunc;
          bot.chat(`Function ${funcName} is ready!`);
        } else {
          bot.chat('Oops. That file didn’t export a function.');
        }
      } catch (err) {
        console.error(err);
        bot.chat('Something went wrong making the function.');
      }

      return;
    }

    if (message.startsWith('runfunc ')) {
      const funcName = message.split(' ')[1];
      const func = dynamicFunctions[funcName];
      if (!func) return bot.chat(`Function ${funcName} not found!`);
      try {
        const result = await func();
        bot.chat(`Result: ${result}`);
      } catch (err) {
        bot.chat(`Error running ${funcName}: ${err.message}`);
      }

      return;
    }

    // Send everything else to llama3
    bot.chat('Thinking...');
    try {
      const { stdout, stderr } = await execPromise(`powershell.exe -Command "ollama run llama3 '${message.replace(/'/g, "''")}'"`);
      if (stderr) {
        console.error('AI error:', stderr);
        return bot.chat(`⚠️ AI error.`);
      }

      const lines = stdout.trim().split('\n').filter(line => line.trim().length > 0);
      const response = lines[lines.length - 1];
      const trimmedResponse = response.slice(0, 100); // Trim for Minecraft chat

      chatMemory.push(`AI_Paul: ${trimmedResponse}`);
      if (chatMemory.length > 64) chatMemory.shift();
      saveChatMemory(chatMemory);

      bot.chat(trimmedResponse);
      say(trimmedResponse);
    } catch (err) {
      console.error('AI call failed:', err);
      bot.chat('⚠️ Failed to reach AI.');
    }
  });

  return { following };
};