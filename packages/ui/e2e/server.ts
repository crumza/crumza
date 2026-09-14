/** Starts the playground on its own port for the e2e run and stops it afterwards. */
import { afterAll, beforeAll } from 'bun:test';

export const BASE_URL = 'http://127.0.0.1:5191/';
let proc: ReturnType<typeof Bun.spawn> | undefined;

beforeAll(async () => {
  proc = Bun.spawn(['bunx', 'vite', '--port', '5191', '--strictPort', '--host', '127.0.0.1'], {
    cwd: new URL('../../../apps/playground/', import.meta.url).pathname,
    stdout: 'ignore',
    stderr: 'ignore',
  });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE_URL)).ok) return;
    } catch {
      await Bun.sleep(200);
    }
  }
  throw new Error('playground did not start');
});

afterAll(() => {
  proc?.kill();
});
