import { AsyncLocalStorage } from "node:async_hooks";
import type { Connection } from "mysql2/promise";
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

export type ParsedEnv = z.infer<typeof envSchema>;

type EnvRecord = Record<string, string | undefined>;

/** Per Worker HTTP request: env bindings + one TiDB connection (Workers forbid sharing TCP across requests). */
export type WorkerRequestStore = {
  env: EnvRecord;
  /** Parsed once per request — avoids repeated Zod work on hot paths. */
  parsedEnv?: ParsedEnv;
  mysqlConn: Connection | null;
  /** Single-flight while opening MySQL for this request */
  mysqlPending?: Promise<Connection>;
};

const workerRequestAls = new AsyncLocalStorage<WorkerRequestStore>();

function flattenWorkerBindings(env: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!env || typeof env !== "object") return out;
  const o = env as Record<string, unknown>;
  const keys = new Set<string>();
  for (const k of Reflect.ownKeys(o)) {
    if (typeof k === "string") keys.add(k);
  }
  for (const k in o) {
    keys.add(k);
  }
  for (const key of keys) {
    const value = o[key];
    if (value == null) continue;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") {
      out[key] = String(value);
      continue;
    }
    if (t === "object") {
      const maybe = value as { get?: () => string };
      if (typeof maybe.get === "function") {
        try {
          const s = maybe.get();
          if (typeof s === "string") out[key] = s;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return out;
}

function mergeEnvSource(flat: Record<string, string>): EnvRecord {
  return { ...(process.env as EnvRecord), ...flat };
}

/**
 * Wrap the Worker fetch body so `getEnv()` sees this request's bindings only.
 * Must wrap before any await that yields (otherwise concurrent requests overwrite globals).
 */
export function runWithCloudflareBindings<T>(env: unknown, fn: () => T): T {
  const flat = flattenWorkerBindings(env);
  if (
    Object.keys(flat).length === 0 &&
    process.env.NODE_ENV === "production"
  ) {
    console.warn(
      "[env] Worker bindings object has no string keys. Add Variables & Secrets on this Worker in the Cloudflare dashboard (exact names: TIDB_HOST, …).",
    );
  }
  const merged = mergeEnvSource(flat);
  const store: WorkerRequestStore = { env: merged, mysqlConn: null };
  return workerRequestAls.run(store, fn);
}

/** Close TiDB connection for the current request (call from `fetch` finally). */
export async function closeWorkerMysql(): Promise<void> {
  const s = workerRequestAls.getStore();
  if (!s?.mysqlConn) return;
  try {
    await s.mysqlConn.end();
  } catch {
    /* ignore */
  }
  s.mysqlConn = null;
  s.mysqlPending = undefined;
}

export function getWorkerRequestStore(): WorkerRequestStore | undefined {
  return workerRequestAls.getStore();
}

function envSource(): EnvRecord {
  return workerRequestAls.getStore()?.env ?? (process.env as EnvRecord);
}

export function getEnv(): ParsedEnv {
  const store = workerRequestAls.getStore();
  if (store?.parsedEnv) return store.parsedEnv;

  const parsed = envSchema.safeParse(envSource());
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`,
    );
  }
  const data = parsed.data;
  if (store) store.parsedEnv = data;
  return data;
}
