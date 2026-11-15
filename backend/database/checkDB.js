
import db from "./db.js";

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
`).all();

console.log("Database tables:", tables);
