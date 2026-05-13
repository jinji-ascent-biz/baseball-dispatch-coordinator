import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp('src', resolve(dist, 'src'), { recursive: true });

const html = await readFile('index.html', 'utf8');
await writeFile(resolve(dist, 'index.html'), html);

console.log('dist を作成しました。');
