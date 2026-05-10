import { z } from "zod";

const envSchema = z
  .object({
    TIDB_HOST: z.string().min(1),
    TIDB_PORT: z.coerce.number().int().positive().default(4000),
    TIDB_USER: z.string().min(1),
    TIDB_PASSWORD: z.string().min(1),
    TIDB_DATABASE: z.string().min(1),
    /** Full PEM text (preferred on Cloudflare Workers; file paths are unreliable there). */
    TIDB_CA: z.string().optional(),
    /** Path to PEM file (local dev / Node). Ignored if `TIDB_CA` is set. */
    TIDB_CA_PATH: z.string().optional(),
    JWT_SECRET: z.string().min(16),
    ADMIN_SEED_EMAIL: z.string().email(),
    ADMIN_SEED_PASSWORD: z.string().min(8),
    ADMIN_SEED_NAME: z.string().min(2).default("Cloud Vaathi Admin"),
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    GMAIL_USER: z.string().email(),
    GMAIL_APP_PASSWORD: z.string().min(1),
    APP_BASE_URL: z.string().url().default("http://localhost:8080"),
  })
  .superRefine((data, ctx) => {
    const hasInlineCa = !!(data.TIDB_CA && data.TIDB_CA.trim().length > 0);
    const hasPath = !!(data.TIDB_CA_PATH && data.TIDB_CA_PATH.trim().length > 0);
    if (!hasInlineCa && !hasPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set TIDB_CA (PEM) or TIDB_CA_PATH",
        path: ["TIDB_CA"],
      });
    }
  });

let cachedEnv: z.infer<typeof envSchema> | null = null;

/** Populated from the Worker `env` argument (Cloudflare). Local dev uses `.env` → `process.env` only. */
let bindingOverlay: Record<string, string> = {};

/**
 * Call once per request from `src/server.ts` before any server code runs.
 * Cloudflare bindings are not always visible on `process.env` until copied here.
 */
export function applyCloudflareWorkerBindings(env: unknown) {
  bindingOverlay = {};
  if (env && typeof env === "object") {
    for (const [key, value] of Object.entries(env as Record<string, unknown>)) {
      if (value == null) continue;
      const t = typeof value;
      if (t === "string" || t === "number" || t === "boolean") {
        bindingOverlay[key] = String(value);
      }
    }
  }
  cachedEnv = null;
  if (typeof process !== "undefined" && process.env) {
    Object.assign(process.env, bindingOverlay);
  }
}

function envSource(): Record<string, string | undefined> {
  return { ...(process.env as Record<string, string | undefined>), ...bindingOverlay };
}

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(envSource());
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`,
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
