import fs from 'node:fs/promises';
import path from 'node:path';
import { getDb, closeDb } from './client';

async function main() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(process.cwd(), 'server', 'db', 'migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const exists = await db.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
    if (exists.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await db.query('COMMIT');
      console.log(`[DB] Applied ${filename}`);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error('[DB] Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => closeDb().catch(() => undefined));
