/**
 * Upload secrets to the Worker from your local `.env` (gitignored).
 * Plain `vars` in wrangler.jsonc are redeployed every time; secrets stay encrypted on Cloudflare.
 *
 * Usage: npm run cf:push-secrets
 * Requires: wrangler logged in (`npx wrangler login`), filled `.env`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

/** Keys stored as Wrangler secrets (never commit these). */
const SECRET_KEYS = [
  "TIDB_PASSWORD",
  "JWT_SECRET",
  "ADMIN_SEED_PASSWORD",
  "RAZORPAY_KEY_SECRET",
  "GMAIL_APP_PASSWORD",
];

function parseEnvLineFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath}. Copy .env.example and fill values.`);
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function resolveTidbCa(env) {
  if (env.TIDB_CA?.trim()) return env.TIDB_CA.trim();
  const p = env.TIDB_CA_PATH?.trim();
  if (!p) return "";
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  if (!fs.existsSync(abs)) {
    console.warn(`[skip TIDB_CA] File not found: ${abs}`);
    return "";
  }
  return fs.readFileSync(abs, "utf8").trim();
}

function wranglerSecretPut(key, value) {
  if (!value) {
    console.warn(`[skip ${key}] empty`);
    return;
  }
  const r = spawnSync("npx", ["wrangler", "secret", "put", key], {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    cwd: ROOT,
  });
  if (r.status !== 0) {
    console.error(`Failed: wrangler secret put ${key}`);
    process.exit(r.status ?? 1);
  }
  console.log(`OK secret: ${key}`);
}

const env = parseEnvLineFile(ENV_PATH);

for (const key of SECRET_KEYS) {
  wranglerSecretPut(key, env[key] ?? "");
}

const ca = resolveTidbCa(env);
if (ca) {
  wranglerSecretPut("TIDB_CA", ca);
} else {
  console.warn(
    "[skip TIDB_CA] Set TIDB_CA in .env or TIDB_CA_PATH to isrgrootx1.pem for TiDB TLS.",
  );
}

console.log("\nDone. Redeploy if needed: npm run build && npx wrangler deploy");
