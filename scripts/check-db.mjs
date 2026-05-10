import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();
const caPath = path.resolve(process.cwd(), process.env.TIDB_CA_PATH);
const ca = fs.readFileSync(caPath, "utf8");
const base = {
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  ssl: { ca },
};

const dbName = process.env.TIDB_DATABASE.replace(/`/g, "");

try {
  const c = await mysql.createConnection(base);
  await c.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4`,
  );
  await c.end();
  const p = mysql.createPool({ ...base, database: process.env.TIDB_DATABASE });
  const [rows] = await p.query("SELECT COUNT(*) AS n FROM courses");
  console.log("OK", rows);
  await p.end();
} catch (e) {
  console.error("FAIL", e.code, e.message);
  process.exit(1);
}
