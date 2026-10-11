import { cp, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = resolve('.vendor/bible-blitz');
const release = JSON.parse(await readFile('bible-blitz-release.json', 'utf8'));
const checked = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' });
if (checked.status !== 0 || checked.stdout.trim() !== release.revision) {
  throw new Error('Bible Blitz checkout does not match the pinned release.');
}
const environment = {
  ...process.env,
  STATIC_EXPORT: 'true',
  NEXT_PUBLIC_BASE_PATH: '/bibleblitz',
  NEXT_PUBLIC_REALTIME_ORIGIN: 'https://ff.adeticket.com',
  NEXT_PUBLIC_REALTIME_PATH: '/bibleblitz/socket.io',
};
for (const args of [['ci'], ['run', 'build']]) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd: source, env: environment, stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error(`Bible Blitz ${args.join(' ')} failed.`);
}
const destination = resolve('sites/adeticket/bibleblitz');
await mkdir(destination, { recursive: true });
await cp(resolve(source, 'out'), destination, { recursive: true });
console.log(`Bible Blitz ${release.revision} prepared at /bibleblitz.`);
