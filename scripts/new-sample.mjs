// Usage: pnpm new "Sample Title"
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../src/samples');
const title = process.argv[2] ?? 'Untitled';

const next =
  Math.max(0, ...readdirSync(root).map((d) => Number(d.match(/^sample(\d+)$/)?.[1] ?? 0))) + 1;
const id = `sample${next}`;
const dir = join(root, id);

cpSync(join(root, '_template'), dir, { recursive: true });
const metaPath = join(dir, 'meta.ts');
writeFileSync(metaPath, readFileSync(metaPath, 'utf8').replace('__TITLE__', title.replaceAll("'", "\\'")));

console.log(`Created src/samples/${id} → #${id}`);
