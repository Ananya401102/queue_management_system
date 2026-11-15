
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or connect to the database
const dbPath = path.join(__dirname, "queue_management.db");

const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

console.log("Database connected successfully!");

// Export database connection
export default db;
