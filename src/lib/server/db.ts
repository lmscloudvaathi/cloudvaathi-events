import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { getEnv } from "./env";

let pool: mysql.Pool | null = null;

function sslOptions() {
  const env = getEnv();
  const inline = env.TIDB_CA?.trim();
  if (inline) {
    return { ca: inline };
  }
  const caPathFromEnv = env.TIDB_CA_PATH?.trim();
  if (!caPathFromEnv) {
    throw new Error("TIDB_CA or TIDB_CA_PATH must be set for TLS");
  }
  const caPath = path.isAbsolute(caPathFromEnv)
    ? caPathFromEnv
    : path.resolve(process.cwd(), caPathFromEnv);
  return { ca: fs.readFileSync(caPath, "utf-8") };
}

/** Connect without a schema and create TIDB_DATABASE if missing (first-time bootstrap). */
export async function ensureDatabaseExists() {
  const env = getEnv();
  const conn = await mysql.createConnection({
    host: env.TIDB_HOST,
    port: env.TIDB_PORT,
    user: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    ssl: sslOptions(),
  });
  try {
    const name = env.TIDB_DATABASE.replace(/`/g, "");
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` DEFAULT CHARACTER SET utf8mb4`);
  } finally {
    await conn.end();
  }
}

export function getDbPool() {
  if (pool) return pool;
  const env = getEnv();

  pool = mysql.createPool({
    host: env.TIDB_HOST,
    port: env.TIDB_PORT,
    user: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
    ssl: sslOptions(),
    connectionLimit: 10,
    waitForConnections: true,
    namedPlaceholders: true,
  });

  return pool;
}

export async function dbQuery<T = unknown>(sql: string, values?: unknown) {
  const [rows] = await getDbPool().query(sql, values);
  return rows as T;
}
