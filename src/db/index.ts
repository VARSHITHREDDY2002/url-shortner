import Database, { type Database as DB } from "better-sqlite3";

const db: DB = new Database("urls.db");

db.exec(`
CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL
);
`);

export default db;