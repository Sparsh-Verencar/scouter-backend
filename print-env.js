// print-env.js
import dotenv from 'dotenv';
dotenv.config();
console.log('--- env debug ---');
console.log('CWD:', process.cwd());
console.log('DB_HOST=', process.env.DB_HOST);
console.log('DB_PORT=', process.env.DB_PORT);
console.log('DB_USER=', process.env.DB_USER === undefined ? '(undefined)' : `"${process.env.DB_USER}"`);
console.log('DB_PASS=', process.env.DB_PASS === undefined ? '(undefined)' : (process.env.DB_PASS ? '(set)' : '(empty)'));
console.log('DB_NAME=', process.env.DB_NAME);
console.log('--- end env debug ---');
