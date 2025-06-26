const util = require('util');
const exec = util.promisify(require('child_process').exec);

const input = 'hi';

async function run() {
  try {
    const { stdout, stderr } = await exec(
      `powershell.exe -NoLogo -Command "& { ollama run llama3 \\"${input.replace(/"/g, '\\"')}\\" }"`
    );
    if (stderr) console.error('STDERR:', stderr);
    console.log('STDOUT:', stdout);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

run();