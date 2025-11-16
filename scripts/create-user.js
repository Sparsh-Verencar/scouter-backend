// backend/scripts/create-user.js
// Usage: node scripts/create-user.js email@example.com Password123 "Optional Name"

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const [,, email, password, name] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-user.js email@example.com password [name]');
  process.exit(1);
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

async function readUsers() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeUsers(users) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

async function main() {
  const users = await readUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    console.error('User already exists:', email);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = users.length ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
  const user = {
    id,
    email,
    name: name || null,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  console.log('Created user:', email);
}

main().catch(err => {
  console.error('Error creating user:', err);
  process.exit(1);
});
