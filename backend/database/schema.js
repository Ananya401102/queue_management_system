
import db from "./db.js";

// Create Managers table
db.exec(`
  CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create Queues table
db.exec(`
  CREATE TABLE IF NOT EXISTS queues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    manager_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (manager_id)
    REFERENCES managers(id)
    ON DELETE CASCADE
  );
`);

// Create Tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_number TEXT NOT NULL,
    person_name TEXT NOT NULL,
    queue_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING'
      CHECK (status IN ('WAITING', 'SERVING', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    called_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,

    FOREIGN KEY (queue_id)
    REFERENCES queues(id)
    ON DELETE CASCADE,

    UNIQUE (queue_id, token_number)
  );
`);

console.log("All database tables created successfully!");
