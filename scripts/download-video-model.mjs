import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, chmod, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const revision = '1cd86afb9a95c410a6038ab3b40d8b578c892266';
const files = [
  ['Qwen3VL-4B-Instruct-Q4_K_M.gguf', '66358cb18bb6b3b1b6675aa412c7a88ef01d228f481184d13668e5201c730a0a'],
  ['mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf', '30ba2c7dd3127a4561b6cba9d13d0f711c91bdb38742e2f56d73c8cb596bd06d'],
];
async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
await mkdir('/models', { recursive: true, mode: 0o755 });
for (const [name, expected] of files) {
  const destination = `/models/${name}`;
  if (await stat(destination).catch(() => null) && await digest(destination) === expected) {
    console.log(`Verified cached model: ${name}`);
    continue;
  }
  const temporary = `${destination}.partial`;
  try {
    console.log(`Downloading pinned model: ${name}`);
    const response = await fetch(`https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF/resolve/${revision}/${name}`, { signal: AbortSignal.timeout(30 * 60_000) });
    if (!response.ok || !response.body) throw new Error('Model download failed');
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { mode: 0o644 }));
    if (await digest(temporary) !== expected) throw new Error('Model checksum verification failed');
    await chmod(temporary, 0o644);
    await rename(temporary, destination);
    console.log(`Model verified: ${name}`);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
