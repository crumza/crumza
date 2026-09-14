import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../apps/website/dist/", import.meta.url).pathname;
const htmlFiles = readdirSync(root, { recursive: true }).filter(
  (file): file is string => typeof file === "string" && file.endsWith(".html"),
);
const errors: string[] = [];
let checked = 0;
for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf8");
  if (["index.html", "ui/index.html", "docs/components/button/index.html"].includes(file) &&
      !/<html[^>]*data-material="liquid"/.test(html))
    errors.push(file + ": Crumza must open in liquid glass, not solid");
  const route = "/" + file.replace(/index\.html$/, "");
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (!href || /^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
    const url = new URL(href, "https://local.invalid" + route);
    const destination = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (!existsSync(join(root, destination)) && !existsSync(join(root, destination, "index.html")))
      errors.push(file + ": missing " + href);
    checked++;
  }
}
const css = readFileSync(
  new URL("../apps/website/src/styles/catalog.css", import.meta.url),
  "utf8",
);
const sizes = [
  ...new Set([...css.matchAll(/font-size:\s*([\d.]+px)/g)].map((match) => match[1])),
].sort();
if (sizes.join(",") !== "12px,13px,16px")
  errors.push("Website font scale changed: " + sizes.join(","));
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  `Checked ${htmlFiles.length} pages, ${checked} local links and the 12/13/16px type scale.`,
);
