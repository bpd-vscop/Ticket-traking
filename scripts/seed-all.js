// scripts/seed-all.js
const { spawn } = require('child_process');

const scripts = [
  'seed-admin.js',
  'seed-users.js',
  'seed-teachers.js',
  'seed-sheets.js',
  'seed-families.js'
];

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [scriptPath], { stdio: 'inherit' });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  for (const script of scripts) {
    try {
      console.log(`
Running ${script}...`);
      await runScript(`scripts/${script}`);
      console.log(`${script} completed successfully.`);
    } catch (error) {
      console.error(`Failed to run ${script}:`, error);
      process.exit(1); // Exit with an error code if any script fails
    }
  }
  console.log('\nAll seed scripts completed successfully!');
}

main();
