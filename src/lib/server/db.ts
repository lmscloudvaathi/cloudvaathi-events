import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { getEnv, getWorkerRequestStore } from "./env";

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

function mysqlCommonOptions(): Pick<
  mysql.ConnectionOptions,
  "host" | "port" | "user" | "password" | "ssl" | "namedPlaceholders" | "disableEval"
> {
  const env = getEnv();
  return {
    host: env.TIDB_HOST,
    port: env.TIDB_PORT,
    user: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    ssl: sslOptions(),
    namedPlaceholders: false,
    disableEval: true,
  };
}

/**
 * One TCP handshake for bootstrap: create schema if missing, USE it, attach to this request.
 * Avoids one throwaway connect/close plus a second connection for migrations.
 */
export async function openMysqlBootstrapConnection(): Promise<mysql.Connection> {
  const store = getWorkerRequestStore();
  if (!store) {
    throw new Error(
      "TiDB bootstrap requested outside a Worker request context (missing runWithCloudflareBindings).",
    );
  }
  if (store.mysqlConn) return store.mysqlConn;

  const env = getEnv();
  const conn = await mysql.createConnection({
    ...mysqlCommonOptions(),
  });
  const name = env.TIDB_DATABASE.replace(/`/g, "");
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` DEFAULT CHARACTER SET utf8mb4`,
    );
    await conn.query(`USE \`${name}\``);
  } catch (err) {
    await conn.end().catch(() => {});
    throw err;
  }
  store.mysqlConn = conn;
  store.mysqlPending = undefined;
  return conn;
}

/**
 * One MySQL connection per incoming Worker request (stored on AsyncLocalStorage).
 * A global pool shares TCP across requests → Cloudflare error:
 * "Cannot perform I/O on behalf of a different request".
 */
export async function getOrCreateMysqlConnection(): Promise<mysql.Connection> {
  const store = getWorkerRequestStore();
  if (!store) {
    throw new Error(
      "TiDB connection requested outside a Worker request context (missing runWithCloudflareBindings).",
    );
  }
  if (store.mysqlConn) return store.mysqlConn;

  if (!store.mysqlPending) {
    const env = getEnv();
    store.mysqlPending = mysql
      .createConnection({
        ...mysqlCommonOptions(),
        database: env.TIDB_DATABASE,
      })
      .then((c) => {
        store.mysqlConn = c;
        store.mysqlPending = undefined;
        return c;
      })
      .catch((err) => {
        store.mysqlPending = undefined;
        throw err;
      });
  }

  return store.mysqlPending;
}

export async function dbQuery<T = unknown>(sql: string, values?: unknown) {
  const conn = await getOrCreateMysqlConnection();
  const [rows] = await conn.query(sql, values);
  return rows as T;
}
