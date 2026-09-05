import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// node:sqlite est expérimental sur Node 22 (avertissement au chargement, sans impact
// fonctionnel pour ce MVP). À réévaluer si Node LTS le stabilise ou si on migre vers
// Postgres (voir ARBORESCENCE.md, section "Notes de cohérence").

let instance: DatabaseSync | undefined;

function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH ?? "./data/prospection.db";
  return configured === ":memory:" ? configured : join(process.cwd(), configured);
}

function runMigrations(db: DatabaseSync): void {
  const migrationPath = join(process.cwd(), "db", "migrations", "001_init.sql");
  const sql = readFileSync(migrationPath, "utf-8");
  db.exec(sql);
}

export function getDb(): DatabaseSync {
  if (instance) return instance;

  const path = resolveDatabasePath();
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  instance = new DatabaseSync(path);
  instance.exec("PRAGMA foreign_keys = ON;");
  runMigrations(instance);
  return instance;
}

export function nowIso(): string {
  return new Date().toISOString();
}
