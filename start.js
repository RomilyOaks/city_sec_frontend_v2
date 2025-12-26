import { exec } from 'child_process';

const PORT = process.env.PORT || 3000;
const command = `serve dist -s -n -l tcp://0.0.0.0:${PORT}`;

console.log(`Starting server on port ${PORT}...`);
const child = exec(command);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  process.exit(code);
});
