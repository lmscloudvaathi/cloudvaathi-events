import path from "node:path";
import { openMysqlBootstrapConnection } from "./db";
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

/**
 * One successful bootstrap per isolate (Worker instance). Re-running migrations + seeds on
 * every RPC blows the CPU budget → Cloudflare Error 1102 "Worker exceeded resource limits".
 *
 * Cold isolates still run full bootstrap. After you add a new `.sql` migration, redeploy —
 * new bundles spawn fresh isolates; warm isolates apply new files on next recycle, or retry deploy.
 */
let bootstrapCompletedInIsolate = false;

/** Single-flight bootstrap promise (parallel loaders share one run). */
let bootstrapPromise: Promise<void> | null = null;

type MysqlConn = Awaited<ReturnType<typeof openMysqlBootstrapConnection>>;

async function columnExists(conn: MysqlConn, table: string, column: string): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  const n = Array.isArray(rows) ? Number((rows[0] as { n?: number }).n ?? 0) : 0;
  return n > 0;
}

/** TiDB does not support ADD COLUMN IF NOT EXISTS. Check information_schema, then ALTER. */
async function ensureDateColumn(conn: MysqlConn, table: string, column: string): Promise<void> {
  if (await columnExists(conn, table, column)) return;
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` DATE NULL`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate column/i.test(msg)) return;
    throw err;
  }
}

let lifecycleColumnsReadyVersion = 0;
/** Bump when lifecycle column / backfill logic changes so warm isolates re-apply. */
const LIFECYCLE_COLUMNS_VERSION = 2;

async function ensureProgramLifecycleColumns(conn: MysqlConn): Promise<void> {
  if (lifecycleColumnsReadyVersion >= LIFECYCLE_COLUMNS_VERSION) return;

  for (const table of ["courses", "events"] as const) {
    for (const column of ["registration_open_date", "registration_close_date", "program_end_date"] as const) {
      await ensureDateColumn(conn, table, column);
    }
  }

  await conn.query(`
    UPDATE courses
    SET
      registration_open_date = DATE_SUB(start_date, INTERVAL 30 DAY),
      registration_close_date = start_date,
      program_end_date = start_date
    WHERE registration_open_date IS NULL
  `);
  await conn.query(`
    UPDATE events
    SET
      registration_open_date = DATE_SUB(event_date, INTERVAL 21 DAY),
      registration_close_date = event_date,
      program_end_date = event_date
    WHERE registration_open_date IS NULL
  `);

  // Rescheduled programs: start moved forward, close left in the past → public shows Registration Closed.
  await conn.query(`
    UPDATE courses
    SET
      registration_close_date = start_date,
      registration_open_date = COALESCE(
        registration_open_date,
        DATE_SUB(start_date, INTERVAL 30 DAY)
      ),
      program_end_date = CASE
        WHEN program_end_date IS NULL OR program_end_date < start_date THEN start_date
        ELSE program_end_date
      END
    WHERE start_date > CURDATE()
      AND registration_close_date IS NOT NULL
      AND registration_close_date <= CURDATE()
      AND registration_close_date < start_date
  `);
  await conn.query(`
    UPDATE events
    SET
      registration_close_date = event_date,
      registration_open_date = COALESCE(
        registration_open_date,
        DATE_SUB(event_date, INTERVAL 21 DAY)
      ),
      program_end_date = CASE
        WHEN program_end_date IS NULL OR program_end_date < event_date THEN event_date
        ELSE program_end_date
      END
    WHERE event_date > CURDATE()
      AND registration_close_date IS NOT NULL
      AND registration_close_date <= CURDATE()
      AND registration_close_date < event_date
  `);

  lifecycleColumnsReadyVersion = LIFECYCLE_COLUMNS_VERSION;
}

async function runBootstrapOnce(): Promise<void> {
  const conn = await openMysqlBootstrapConnection();
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
      const stripped = statement
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("--"))
        .join("\n");
      if (!stripped) continue;
      await conn.query(stripped);
    }
    await conn.query("INSERT INTO _migrations (name) VALUES (?)", [name]);
  }

  await ensureProgramLifecycleColumns(conn);
  await seedInitialData();
}

export async function ensureDatabaseReady(): Promise<void> {
  if (bootstrapCompletedInIsolate && lifecycleColumnsReadyVersion >= LIFECYCLE_COLUMNS_VERSION) return;
  if (bootstrapCompletedInIsolate && lifecycleColumnsReadyVersion < LIFECYCLE_COLUMNS_VERSION) {
    const conn = await openMysqlBootstrapConnection();
    await ensureProgramLifecycleColumns(conn);
    return;
  }
  bootstrapPromise ??= runBootstrapOnce()
    .then(() => {
      bootstrapCompletedInIsolate = true;
    })
    .catch((err) => {
      bootstrapPromise = null;
      throw err;
    });
  await bootstrapPromise;
}
