import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { getEnv } from "./env";

let pool: mysql.Pool | null = null;

function sslOptions() {
  const env = getEnv();
  const caPath = path.isAbsolute(env.TIDB_CA_PATH)
    ? env.TIDB_CA_PATH
    : path.resolve(process.cwd(), env.TIDB_CA_PATH);
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
