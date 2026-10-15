import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE } from "../signup-constants";
import { dbQuery } from "./db";
import { getEnv } from "./env";

/** Cost 12 is too heavy for Cloudflare Workers CPU limits (Error 1102 / HTTP 503 on login). */
export const BCRYPT_ROUNDS = 8;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

type DbUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: "user" | "admin";
  email_verified: number;
};

function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; errno?: number };
  return e.code === "ER_DUP_ENTRY" || e.errno === 1062;
}

function bcryptCostFromHash(hash: string): number | null {
  const m = hash.match(/^\$2[aby]?\$(\d{2})\$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** After a successful login, quietly re-hash expensive legacy hashes to BCRYPT_ROUNDS. */
async function maybeDowngradePasswordHash(userId: number, password: string, currentHash: string) {
  const cost = bcryptCostFromHash(currentHash);
  if (cost == null || cost <= BCRYPT_ROUNDS) return;
  try {
    const next = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbQuery(`UPDATE users SET password_hash = ? WHERE id = ?`, [next, userId]);
  } catch (err) {
    console.error("password rehash failed", err);
  }
}

export async function createUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    await dbQuery(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verified)
       VALUES (?, ?, ?, ?, 'user', 0)`,
      [input.name, input.email.toLowerCase(), input.phone ?? null, hash],
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new Error(SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE);
    }
    throw err;
  }
}

export async function verifyUserOtp(email: string) {
  await dbQuery(`UPDATE users SET email_verified = 1 WHERE email = ?`, [email.toLowerCase()]);
}

export async function loginUser(email: string, password: string): Promise<SessionUser | null> {
  const rows = await dbQuery<DbUser[]>(
    `SELECT id, name, email, phone, password_hash, role, email_verified FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok || !user.email_verified) return null;
  await maybeDowngradePasswordHash(user.id, password, user.password_hash);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.email_verified === 1,
  };
}

/** Admin console only: must have role admin; OTP / email_verified not required. */
export async function loginAdminUser(email: string, password: string): Promise<SessionUser | null> {
  const rows = await dbQuery<DbUser[]>(
    `SELECT id, name, email, phone, password_hash, role, email_verified FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user || user.role !== "admin") return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  await maybeDowngradePasswordHash(user.id, password, user.password_hash);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.email_verified === 1,
  };
}

export function issueSessionToken(user: SessionUser) {
  return jwt.sign(
    {
      // JWT `sub` must be a string (RFC 7519); keep id numeric on the session object.
      sub: String(user.id),
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
    },
    getEnv().JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function decodeSessionToken(token: string): SessionUser | null {
  try {
    const trimmed = token?.trim();
    if (!trimmed) return null;
    const payload = jwt.verify(trimmed, getEnv().JWT_SECRET) as {
      sub: string | number;
      role: "user" | "admin";
      email: string;
      name: string;
      phone: string | null;
    };
    const id = typeof payload.sub === "number" ? payload.sub : Number(payload.sub);
    if (!Number.isFinite(id) || id <= 0) return null;
    return {
      id,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      emailVerified: true,
    };
  } catch {
    return null;
  }
}
