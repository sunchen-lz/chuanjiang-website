import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist', 'cloudflare');
const client = path.join(root, 'apps', 'web', 'dist', 'client');
await fs.mkdir(output, { recursive: true });
await fs.cp(client, output, { recursive: true });
const video = 'media/chuanjiang-brand-film.mp4';
const source = path.join(root, 'apps', 'web', 'public', video);
const compressed = path.join(output, video);
if ((await fs.stat(source)).size > 24 * 1024 * 1024) {
  const ffmpeg = process.env.CJ_FFMPEG || 'ffmpeg';
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'warning', '-y', '-i', source, '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=854:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', '29', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', compressed], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Install ffmpeg (or set CJ_FFMPEG) to prepare the online video.');
}
await fs.copyFile(path.join(root, 'deploy', 'preview-worker.mjs'), path.join(output, '_worker.js'));
await fs.writeFile(path.join(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }, null, 2));
await fs.writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
for (const entry of await fs.readdir(output, { recursive: true, withFileTypes: true })) {
  if (entry.isFile()) {
    const full = path.join(entry.parentPath, entry.name);
    if ((await fs.stat(full)).size > 25 * 1024 * 1024) throw new Error(`Cloudflare Pages asset exceeds 25 MiB: ${path.relative(output, full)}`);
  }
}
console.log(JSON.stringify({ output, passwordProtection: true, allRoutesProtected: true, videoBytes: (await fs.stat(compressed)).size }, null, 2));
