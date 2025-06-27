const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const GENERATED_DIR = path.join(__dirname, '..', 'generatedFuncs');

async function generateAndSave(prompt) {
  const filename = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) + '.js';

  const filePath = path.join(GENERATED_DIR, filename);
  const ollamaPrompt = `Write a clean async JavaScript function for a Mineflayer bot that does the following:\n\n${prompt}\n\n Only give the function code.`;

  const ollama = spawn('ollama', ['run', 'codellama'], { stdio: ['pipe', 'pipe', 'pipe'] });

  let output = '';
  ollama.stdout.on('data', (data) => {
    output += data.toString();
  });

  ollama.stderr.on('data', (data) => {
    console.error('Code Llama error:', data.toString());
  });

  return new Promise((resolve, reject) => {
    ollama.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Ollama exited with code ${code}`));

      const cleanCode = output
        .replace(/```(?:javascript)?/g, '')
        .replace(/```/g, '')
        .trim();

      fs.writeFileSync(filePath, cleanCode, 'utf8');
      resolve(filename);
    });

    ollama.stdin.write(ollamaPrompt);
    ollama.stdin.end();
  });
}

async function runFunction(bot, name) {
  const funcPath = path.join(GENERATED_DIR, name + '.js');
  if (!fs.existsSync(funcPath)) {
    bot.chat(`Function "${name}" not found.`);
    return;
  }

  try {
    const func = require(funcPath);
    await func(bot);
  } catch (err) {
    bot.chat(`Error running "${name}": ${err.message}`);
    console.error(err);
  }
}

module.exports = { generateAndSave, runFunction };