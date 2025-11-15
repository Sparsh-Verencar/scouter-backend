// db/users.js
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');
let writeLock = Promise.resolve();

async function readUsers() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeUsers(users) {
  const doWrite = async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(users, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  };
  writeLock = writeLock.then(doWrite, doWrite);
  return writeLock;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const users = await readUsers();
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser({ email, passwordHash, name }) {
  const users = await readUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    const e = new Error('UserExists'); e.code = 'UserExists'; throw e;
  }
  const id = users.length ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
  const user = { id, email, name: name || null, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  await writeUsers(users);
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}
