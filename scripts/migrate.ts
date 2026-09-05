import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/shared/integration/db";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

function run() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((row) => (row as { name: string }).name),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    })();
    console.log(`Migration appliquee : ${file}`);
  }

  console.log("Migrations a jour.");
}

run();
