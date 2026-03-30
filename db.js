// db.js
import Dexie from 'dexie';

const db = new Dexie('TodoAppDB');

db.version(2).stores({
    tasks: '++id, tempId, title, details, date, time, done, userId, synced, pendingAction, updatedAt',
});

export default db;