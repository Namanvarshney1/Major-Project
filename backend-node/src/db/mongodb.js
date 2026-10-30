import { MongoClient, ObjectId } from 'mongodb';
import { config } from '../config.js';
import { hashPassword } from '../services/security.js';

let client = null;
let db = null;
let isConnected = false;
let isMock = false;

// High-fidelity in-memory fallback store if MongoDB is offline and allowMockDb is enabled
class MockCollection {
  constructor(name) {
    this.name = name;
    this.docs = new Map();
  }

  async findOne(query) {
    for (const doc of this.docs.values()) {
      if (this.matches(doc, query)) {
        return { ...doc };
      }
    }
    return null;
  }

  find(query = {}) {
    let items = Array.from(this.docs.values()).filter(doc => this.matches(doc, query));
    let skipCount = 0;
    let limitCount = items.length;

    const cursor = {
      sort: (sortSpec) => {
        const [field, dir] = Object.entries(sortSpec)[0] || ['created_at', -1];
        items.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return dir === 1 ? -1 : 1;
          if (valA > valB) return dir === 1 ? 1 : -1;
          return 0;
        });
        return cursor;
      },
      skip: (n) => {
        skipCount = n;
        return cursor;
      },
      limit: (l) => {
        limitCount = l;
        return cursor;
      },
      toArray: async () => {
        return items.slice(skipCount, skipCount + limitCount).map(d => ({ ...d }));
      }
    };

    return cursor;
  }

  async insertOne(doc) {
    const id = doc._id || new ObjectId();
    const toInsert = { ...doc, _id: id };
    this.docs.set(id.toString(), toInsert);
    return { insertedId: id };
  }

  async updateOne(filter, update, options = {}) {
    let targetId = null;
    let targetDoc = null;

    for (const [id, doc] of this.docs.entries()) {
      if (this.matches(doc, filter)) {
        targetId = id;
        targetDoc = doc;
        break;
      }
    }

    if (!targetDoc) {
      if (options.upsert) {
        const newDoc = { _id: filter._id || new ObjectId() };
        if (update.$set) Object.assign(newDoc, update.$set);
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        this.docs.set(newDoc._id.toString(), newDoc);
        return { upsertedId: newDoc._id, modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }

    const updated = { ...targetDoc };
    if (update.$set) {
      Object.assign(updated, update.$set);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        updated[k] = (updated[k] || 0) + v;
      }
    }
    this.docs.set(targetId, updated);
    return { modifiedCount: 1 };
  }

  async deleteOne(filter) {
    for (const [id, doc] of this.docs.entries()) {
      if (this.matches(doc, filter)) {
        this.docs.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  async countDocuments(query = {}) {
    let count = 0;
    for (const doc of this.docs.values()) {
      if (this.matches(doc, query)) count++;
    }
    return count;
  }

  async createIndex() {
    return 'mock_index';
  }

  matches(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [key, val] of Object.entries(query)) {
      if (key === '_id') {
        const docId = doc._id ? doc._id.toString() : '';
        const queryId = val instanceof ObjectId ? val.toString() : String(val);
        if (docId !== queryId) return false;
      } else if (typeof val === 'object' && val !== null && '$ne' in val) {
        if (doc[key] === val.$ne) return false;
      } else if (doc[key] !== val) {
        return false;
      }
    }
    return true;
  }
}

class MockDb {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }
}

const mockDbInstance = new MockDb();

export async function connectToDatabase(forceMock = false) {
  if (forceMock || (config.allowMockDb && config.environment === 'test')) {
    console.log('[MongoDB] Running in Mock In-Memory Database Mode.');
    isMock = true;
    isConnected = true;
    db = mockDbInstance;
    await seedDefaultAccounts();
    return db;
  }

  try {
    console.log(`[MongoDB] Connecting to database '${config.mongodbDatabase}'...`);
    client = new MongoClient(config.mongodbUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    db = client.db(config.mongodbDatabase);
    isConnected = true;
    isMock = false;
    console.log(`[MongoDB] Connected successfully to live MongoDB: '${config.mongodbDatabase}'.`);
    await createDbIndexes();
    await seedDefaultAccounts();
    return db;
  } catch (err) {
    console.warn(`[MongoDB] Live connection failed: ${err.message}.`);
    if (config.allowMockDb || config.environment !== 'production') {
      console.warn('[MongoDB] Falling back to in-memory mock database store (ALLOW_MOCK_DB=true).');
      isMock = true;
      isConnected = true;
      db = mockDbInstance;
      await seedDefaultAccounts();
      return db;
    }
    throw err;
  }
}

export function getDb() {
  if (!db) {
    if (config.allowMockDb) {
      isMock = true;
      isConnected = true;
      db = mockDbInstance;
      return db;
    }
    throw new Error('Database is not initialized. Call connectToDatabase() first.');
  }
  return db;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export async function createDbIndexes() {
  if (!db) return;
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('interviews').createIndex({ user_id: 1, status: 1 });
    await db.collection('interviews').createIndex({ created_at: -1 });
    await db.collection('questions').createIndex({ interview_id: 1, order: 1 });
    await db.collection('answers').createIndex({ interview_id: 1, question_id: 1 });
    await db.collection('evaluations').createIndex({ interview_id: 1, question_id: 1 });
    await db.collection('achievements').createIndex({ user_id: 1, achievement_key: 1 });
    await db.collection('practice_activity').createIndex({ user_id: 1, date: 1 });
  } catch (err) {
    console.warn('[MongoDB] Index creation note:', err.message);
  }
}

export async function seedDefaultAccounts() {
  if (!db) return;
  const usersColl = db.collection('users');
  const demoEmail = 'arjun.patel@example.com';
  const existing = await usersColl.findOne({ email: demoEmail });
  if (!existing) {
    const pwdHash = await hashPassword('ValidPassword123!');
    const now = new Date();
    await usersColl.insertOne({
      name: 'Arjun Patel',
      email: demoEmail,
      password_hash: pwdHash,
      profile: {
        target_role: 'Senior Backend Engineer (Java & Distributed Systems)',
        target_level: 'L5/Senior IC',
        experience_years: 4,
        primary_language: 'Java',
      },
      preferences: {
        theme: 'light',
        timed_mode_default: true,
        sound_enabled: true,
      },
      created_at: now,
      updated_at: now,
    });
    console.log('[MongoDB] Seeded default test account: arjun.patel@example.com');
  }
}

export function isRealDbConnected() {
  return isConnected && !isMock;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    isConnected = false;
  }
}

