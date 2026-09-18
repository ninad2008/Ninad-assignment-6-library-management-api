const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { getHashedSeedUsers, initialBooks } = require('../utils/seed');

let db;
let isMockDb = false;

/**
 * In-Memory Firestore mock adapter that replicates Firebase Firestore collection/doc APIs
 */
class InMemoryFirestore {
  constructor() {
    this.collections = new Map();
  }

  _getCollectionMap(collectionName) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this.collections.get(collectionName);
  }

  collection(collectionName) {
    const colMap = this._getCollectionMap(collectionName);
    return new MockCollectionReference(collectionName, colMap);
  }
}

class MockDocumentReference {
  constructor(collectionName, colMap, id) {
    this.collectionName = collectionName;
    this.colMap = colMap;
    this.id = id;
  }

  async get() {
    const exists = this.colMap.has(this.id);
    const data = exists ? JSON.parse(JSON.stringify(this.colMap.get(this.id))) : undefined;
    return {
      id: this.id,
      exists,
      data: () => data
    };
  }

  async set(data, options = {}) {
    let finalData = { ...data };
    if (options.merge && this.colMap.has(this.id)) {
      finalData = { ...this.colMap.get(this.id), ...data };
    }
    this.colMap.set(this.id, finalData);
    return { writeTime: new Date().toISOString() };
  }

  async update(data) {
    if (!this.colMap.has(this.id)) {
      throw new Error(`No document to update: ${this.id}`);
    }
    const current = this.colMap.get(this.id);
    const updated = { ...current, ...data };
    this.colMap.set(this.id, updated);
    return { writeTime: new Date().toISOString() };
  }

  async delete() {
    this.colMap.delete(this.id);
    return { writeTime: new Date().toISOString() };
  }
}

class MockQuery {
  constructor(collectionName, colMap, filters = [], limitCount = null, orderConfig = null) {
    this.collectionName = collectionName;
    this.colMap = colMap;
    this.filters = filters;
    this.limitCount = limitCount;
    this.orderConfig = orderConfig;
  }

  where(field, op, value) {
    return new MockQuery(
      this.collectionName,
      this.colMap,
      [...this.filters, { field, op, value }],
      this.limitCount,
      this.orderConfig
    );
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(
      this.collectionName,
      this.colMap,
      this.filters,
      this.limitCount,
      { field, direction }
    );
  }

  limit(count) {
    return new MockQuery(
      this.collectionName,
      this.colMap,
      this.filters,
      count,
      this.orderConfig
    );
  }

  async get() {
    let items = Array.from(this.colMap.entries()).map(([id, doc]) => ({
      id,
      doc: JSON.parse(JSON.stringify(doc))
    }));

    // Apply filters
    for (const filter of this.filters) {
      items = items.filter(({ doc }) => {
        const val = doc[filter.field];
        switch (filter.op) {
          case '==':
            return val === filter.value;
          case '!=':
            return val !== filter.value;
          case '>':
            return val > filter.value;
          case '>=':
            return val >= filter.value;
          case '<':
            return val < filter.value;
          case '<=':
            return val <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(val);
          case 'array-contains':
            return Array.isArray(val) && val.includes(filter.value);
          default:
            return true;
        }
      });
    }

    // Apply order
    if (this.orderConfig) {
      const { field, direction } = this.orderConfig;
      items.sort((a, b) => {
        const aVal = a.doc[field] || '';
        const bVal = b.doc[field] || '';
        if (direction === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      items = items.slice(0, this.limitCount);
    }

    const docs = items.map(item => ({
      id: item.id,
      exists: true,
      data: () => item.doc
    }));

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs
    };
  }
}

class MockCollectionReference extends MockQuery {
  doc(id) {
    const docId = id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new MockDocumentReference(this.collectionName, this.colMap, docId);
  }

  async add(data) {
    const newId = `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = this.doc(newId);
    await docRef.set(data);
    return docRef;
  }
}

// Initialize Firestore
const initFirebase = async () => {
  const forceInMemory = process.env.USE_IN_MEMORY_DB === 'true';
  const customServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const configKeyPath = path.join(__dirname, 'serviceAccountKey.json');
  const rootKeyPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  let serviceAccountFile = null;
  if (customServiceAccountPath && fs.existsSync(path.resolve(customServiceAccountPath))) {
    serviceAccountFile = path.resolve(customServiceAccountPath);
  } else if (fs.existsSync(configKeyPath)) {
    serviceAccountFile = configKeyPath;
  } else if (fs.existsSync(rootKeyPath)) {
    serviceAccountFile = rootKeyPath;
  }

  const hasEnvCredentials = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

  let initializedRealFirebase = false;

  if (!forceInMemory) {
    try {
      if (serviceAccountFile) {
        const serviceAccount = require(serviceAccountFile);
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        }
        db = admin.firestore();
        initializedRealFirebase = true;
        console.log(`✅ Firebase initialized using serviceAccountKey.json (${serviceAccount.project_id})`);
      } else if (hasEnvCredentials) {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
          });
        }
        db = admin.firestore();
        initializedRealFirebase = true;
        console.log('✅ Firebase initialized using environment variables');
      }
    } catch (err) {
      console.warn('⚠️  Could not initialize real Firebase:', err.message);
    }
  }

  if (!initializedRealFirebase) {
    isMockDb = true;
    db = new InMemoryFirestore();
    console.log('📦 Using In-Memory Firestore Adapter (Zero-Config Test/Dev Mode)');
  }

  // Seed default data if collections are empty
  await seedInitialData(db);

  return db;
};

const seedInitialData = async (database) => {
  try {
    // Seed users
    const usersSnapshot = await database.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      const hashedUsers = await getHashedSeedUsers();
      for (const u of hashedUsers) {
        await database.collection('users').doc(u.userId).set(u);
      }
      console.log('🌱 Seeded default users (admin@library.com & student@library.com)');
    }

    // Seed books
    const booksSnapshot = await database.collection('books').limit(1).get();
    if (booksSnapshot.empty) {
      for (const b of initialBooks) {
        await database.collection('books').doc(b.bookId).set(b);
      }
      console.log(`🌱 Seeded ${initialBooks.length} sample books`);
    }
  } catch (seedErr) {
    console.warn('⚠️ Seed error:', seedErr.message);
  }
};

// Immediate initialization
const dbPromise = initFirebase();

module.exports = {
  getDb: async () => {
    return await dbPromise;
  },
  getIsMock: () => isMockDb,
  admin
};
