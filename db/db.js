// ./db/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME,
  DB_DATABASE,
  DB_CONNECTION_LIMIT = '10',
} = process.env;

// Allow either DB_NAME or DB_DATABASE in .env, default to "scouter"
const DB_NAME_FINAL = DB_NAME || DB_DATABASE || 'scouter';

let pool = null;

export async function connectToDB() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME_FINAL,
      waitForConnections: true,
      connectionLimit: Number(DB_CONNECTION_LIMIT),
      queueLimit: 0,
    });

    // quick smoke-test
    const [rows] = await pool.execute('SELECT 1 + 1 AS result');
    console.log('DB pool created, smoke test result:', rows);
    console.log('DB config in use:', {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      database: DB_NAME_FINAL,
    });

    return pool;
  } catch (err) {
    console.error(
      'connectToDB() failed:',
      err && err.message ? err.message : err
    );
    pool = null;
    throw err;
  }
}

// expose a `db` helper object
export const db = {
  execute: async (...args) => {
    if (!pool) {
      throw new Error(
        'DB pool not initialized. Call connectToDB() first.'
      );
    }
    return pool.execute(...args);
  },
  query: async (...args) => {
    if (!pool) {
      throw new Error(
        'DB pool not initialized. Call connectToDB() first.'
      );
    }
    return pool.query(...args);
  },
  getPool: () => pool,
};
