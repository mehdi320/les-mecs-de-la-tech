import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "db", "dev.db");

let instance: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!instance) {
    instance = new Database(DB_PATH);
    instance.pragma("journal_mode = WAL");
    instance.pragma("foreign_keys = ON");
  }
  return instance;
}
