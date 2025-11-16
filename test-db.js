// test-db.js
import { connectToDB, db } from './db/db.js';

(async () => {
  try {
    await connectToDB(); // initializes pool
    const [rows] = await db.execute('SELECT DATABASE() AS db, NOW() AS now');
    console.log('Connected DB:', rows);
  } catch (err) {
    console.error('DB Test Error:', err.message || err);
  } finally {
    process.exit();
  }
})();

