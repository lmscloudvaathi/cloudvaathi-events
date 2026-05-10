import path from "node:path";
import { ensureDatabaseExists, getOrCreateMysqlConnection } from "./db";
import { seedInitialData } from "./seeds";

/** Embedded at build time — Workers have no project filesystem for `fs.readdir`. */
const migrationSqlByPath = import.meta.glob<string>("./migrations/*.sql", {
  eager: true,
  query: "?raw",
  import: "default",
});

function sortedMigrations(): { name: string; sql: string }[] {
  return Object.entries(migrationSqlByPath)
    .map(([filePath, sql]) => ({
      name: path.basename(filePath.replace(/\\/g, "/")),
      sql,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function ensureDatabaseReady() {
  await ensureDatabaseExists();
  const conn = await getOrCreateMysqlConnection();
  await conn.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const { name, sql } of sortedMigrations()) {
    const [rows] = await conn.query("SELECT name FROM _migrations WHERE name = ?", [name]);
    if (Array.isArray(rows) && rows.length > 0) continue;
    for (const statement of sql.split(/;\s*\n/)) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      await conn.query(trimmed);
    }
    await conn.query("INSERT INTO _migrations (name) VALUES (?)", [name]);
  }

  await seedInitialData();
}
