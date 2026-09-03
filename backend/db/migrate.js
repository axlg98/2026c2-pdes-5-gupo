import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import pool from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDirectory = path.join(__dirname, "migrations");

async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query(`
    SELECT filename
    FROM schema_migrations
    ORDER BY filename;
  `);

  return new Set(result.rows.map(row => row.filename));
}

async function getMigrationFiles() {
  const files = await fs.readdir(migrationsDirectory);

  return files
    .filter(file => file.endsWith(".sql"))
    .sort();
}

async function runMigration(filename) {
  const filePath = path.join(migrationsDirectory, filename);
  const sql = await fs.readFile(filePath, "utf8");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(sql);

    await client.query(
      `
        INSERT INTO schema_migrations (filename)
        VALUES ($1);
      `,
      [filename]
    );

    await client.query("COMMIT");

    console.log(`Migration applied: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(`Migration failed: ${filename}`);

    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  console.log("Checking database migrations...");

  await createMigrationsTable();

  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = await getMigrationFiles();

  for (const filename of migrationFiles) {
    if (appliedMigrations.has(filename)) {
      console.log(`Migration already applied: ${filename}`);
      continue;
    }

    await runMigration(filename);
  }

  console.log("Database migrations completed.");
}