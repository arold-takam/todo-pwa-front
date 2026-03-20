// src/db.js
import Dexie from 'dexie';

const db = new Dexie('TodoAppDB');

db.version(1).stores({
    tasks: '++id, tempId, title, details, date, time, done, userId, synced, updatedAt',
});

export default db;