import { z } from "zod";

const envSchema = z.object({
  TIDB_HOST: z.string().min(1),
  TIDB_PORT: z.coerce.number().int().positive().default(4000),
  TIDB_USER: z.string().min(1),
  TIDB_PASSWORD: z.string().min(1),
  TIDB_DATABASE: z.string().min(1),
  TIDB_CA_PATH: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  ADMIN_SEED_EMAIL: z.string().email(),
  ADMIN_SEED_PASSWORD: z.string().min(8),
  ADMIN_SEED_NAME: z.string().min(2).default("Cloud Vaathi Admin"),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  GMAIL_USER: z.string().email(),
  GMAIL_APP_PASSWORD: z.string().min(1),
  APP_BASE_URL: z.string().url().default("http://localhost:8080"),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
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
