const { getDb } = require('../config/firebase');

const COLLECTION_NAME = 'users';

class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const db = await getDb();
    const snapshot = await db.collection(COLLECTION_NAME).where('email', '==', email.toLowerCase().trim()).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { userId: doc.id, ...doc.data() };
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const db = await getDb();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return { userId: doc.id, ...doc.data() };
  }

  /**
   * Create a new user
   */
  static async create(data) {
    const db = await getDb();
    const userId = data.userId || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const now = new Date().toISOString();

    const userData = {
      userId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      role: data.role || 'student',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };

    await db.collection(COLLECTION_NAME).doc(userId).set(userData);
    return userData;
  }

  /**
   * Get all users (sanitized, excluding passwords)
   */
  static async findAll() {
    const db = await getDb();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const { password, ...sanitized } = data;
      return { userId: doc.id, ...sanitized };
    });
  }

  /**
   * Update user details
   */
  static async update(id, updateData) {
    const db = await getDb();
    const userRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await userRef.get();
    if (!doc.exists) return null;

    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await userRef.update(dataToUpdate);
    const updatedDoc = await userRef.get();
    return { userId: updatedDoc.id, ...updatedDoc.data() };
  }

  /**
   * Delete user by ID
   */
  static async delete(id) {
    const db = await getDb();
    const userRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await userRef.get();
    if (!doc.exists) return false;

    await userRef.delete();
    return true;
  }
}

module.exports = UserModel;
