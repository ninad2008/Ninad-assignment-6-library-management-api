const { getDb } = require('../config/firebase');

const COLLECTION_NAME = 'transactions';

class TransactionModel {
  /**
   * Create a new transaction (borrow)
   */
  static async create(data) {
    const db = await getDb();
    const transactionId = data.transactionId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const now = new Date();
    // Default due date: 14 days from borrow date
    const defaultDueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const transactionData = {
      transactionId,
      userId: data.userId,
      bookId: data.bookId,
      type: data.type || 'borrow',
      borrowDate: data.borrowDate || now.toISOString(),
      returnDate: data.returnDate || null,
      dueDate: data.dueDate || defaultDueDate.toISOString(),
      status: data.status || 'active'
    };

    await db.collection(COLLECTION_NAME).doc(transactionId).set(transactionData);
    return transactionData;
  }

  /**
   * Find transaction by ID
   */
  static async findById(id) {
    const db = await getDb();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return { transactionId: doc.id, ...doc.data() };
  }

  /**
   * Find active borrow transaction for a specific user and book
   */
  static async findActiveBorrow(userId, bookId) {
    const db = await getDb();
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .where('bookId', '==', bookId)
      .where('status', '==', 'active')
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { transactionId: doc.id, ...doc.data() };
  }

  /**
   * Get all transactions for a specific user
   */
  static async findByUserId(userId) {
    const db = await getDb();
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map(doc => ({ transactionId: doc.id, ...doc.data() }));
  }

  /**
   * Get all transactions in system (Librarian)
   */
  static async findAll() {
    const db = await getDb();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    return snapshot.docs.map(doc => ({ transactionId: doc.id, ...doc.data() }));
  }

  /**
   * Mark transaction as returned
   */
  static async markReturned(transactionId) {
    const db = await getDb();
    const txRef = db.collection(COLLECTION_NAME).doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists) return null;

    const returnDate = new Date().toISOString();
    await txRef.update({
      type: 'return',
      returnDate,
      status: 'returned'
    });

    const updatedDoc = await txRef.get();
    return { transactionId: updatedDoc.id, ...updatedDoc.data() };
  }
}

module.exports = TransactionModel;
