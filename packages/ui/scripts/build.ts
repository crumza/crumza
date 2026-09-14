import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const packageRoot = new URL('../', import.meta.url);
const outdir = fileURLToPath(new URL('dist/', packageRoot));
// Only this package's generated output is removed; never source or checkout paths.
await rm(outdir, { recursive: true, force: true });
const result = await Bun.build({
  entrypoints: ['src/index.ts', 'src/web/index.ts', 'src/core/index.ts', 'src/tokens/index.ts'].map(
    (path) => fileURLToPath(new URL(path, packageRoot)),
  ),
  outdir,
  root: fileURLToPath(new URL('src/', packageRoot)),
  target: 'browser',
  packages: 'external',
  splitting: true,
});
if (!result.success) throw new AggregateError(result.logs, 'Package build failed');
console.log(`Built ${result.outputs.length} ESM artifacts.`);
