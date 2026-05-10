import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbQuery } from "./db";
import { getEnv } from "./env";

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

export async function createUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const hash = await bcrypt.hash(input.password, 12);
  await dbQuery(
    `INSERT INTO users (name, email, phone, password_hash, role, email_verified)
     VALUES (?, ?, ?, ?, 'user', 0)`,
    [input.name, input.email.toLowerCase(), input.phone ?? null, hash],
  );
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
    { sub: user.id, role: user.role, email: user.email, name: user.name, phone: user.phone ?? null },
    getEnv().JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function decodeSessionToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, getEnv().JWT_SECRET) as {
      sub: number;
      role: "user" | "admin";
      email: string;
      name: string;
      phone: string | null;
    };
    return {
      id: payload.sub,
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
