import { expect, test } from "bun:test";

function cacheFor(mode: string | undefined): string {
  const result = Bun.spawnSync(
    [
      "bun",
      "-e",
      "const {default: config} = await import('./astro.config.mjs'); process.stdout.write(config.vite.cacheDir)",
    ],
    {
      cwd: new URL("../apps/website/", import.meta.url).pathname,
      env: { ...process.env, NODE_ENV: mode },
    },
  );
  expect(result.exitCode).toBe(0);
  return result.stdout.toString();
}

test("Astro checks cannot replace the running site's development React cache", () => {
  const development = cacheFor("development");
  const production = cacheFor("production");
  expect(development).not.toBe(production);
  expect(development).toEndWith("/.vite/development");
  expect(production).toEndWith("/.vite/production");
  expect(cacheFor(undefined)).toBe(development);
});
