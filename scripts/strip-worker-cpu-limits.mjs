/**
 * Free-plan Workers reject any explicit limits.cpu_ms (API error 100328).
 * Strip it from the Vite/Cloudflare generated dist config before wrangler deploy.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("dist/server/wrangler.json");
if (!existsSync(path)) {
  console.log("[strip-worker-cpu-limits] No dist/server/wrangler.json yet — skip.");
  process.exit(0);
}

const config = JSON.parse(readFileSync(path, "utf8"));
if (config.limits == null) {
  console.log("[strip-worker-cpu-limits] OK — no limits in dist/server/wrangler.json");
  process.exit(0);
}

console.warn(
  "[strip-worker-cpu-limits] Removing limits from dist/server/wrangler.json:",
  JSON.stringify(config.limits),
);
delete config.limits;
writeFileSync(path, JSON.stringify(config));
console.log("[strip-worker-cpu-limits] Stripped. Free plan deploy should not send cpu_ms.");
