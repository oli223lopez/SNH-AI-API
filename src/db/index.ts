import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export async function initDb(filename: string = './db/snh-api.db'): Promise<Database> {
  try {
    const db = await open({
      filename: process.env.NODE_ENV === 'test' ? ':memory:' : filename,
      driver: sqlite3.Database,
    });
    await db.run(`
      CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        parentId INTEGER,
        FOREIGN KEY (parentId) REFERENCES nodes(id)
      )
    `);
    console.log('Nodes table created or already exists');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const dbPromise = initDb();

