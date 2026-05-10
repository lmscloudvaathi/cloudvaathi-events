import fs from "node:fs/promises";
import path from "node:path";
import { ensureDatabaseExists, getDbPool } from "./db";
import { seedInitialData } from "./seeds";

let initialized = false;

export async function ensureDatabaseReady() {
  if (initialized) return;
  await ensureDatabaseExists();
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const dir = path.resolve(process.cwd(), "src/lib/server/migrations");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const [rows] = await pool.query("SELECT name FROM _migrations WHERE name = ?", [file]);
    if (Array.isArray(rows) && rows.length > 0) continue;
    const sql = await fs.readFile(path.join(dir, file), "utf-8");
    for (const statement of sql.split(/;\s*\n/)) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      await pool.query(trimmed);
    }
    await pool.query("INSERT INTO _migrations (name) VALUES (?)", [file]);
  }

  await seedInitialData();
  initialized = true;
}
