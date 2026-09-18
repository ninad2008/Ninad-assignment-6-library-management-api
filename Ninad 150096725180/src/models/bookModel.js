const { getDb } = require('../config/firebase');

const COLLECTION_NAME = 'books';

class BookModel {
  /**
   * Find all books with optional filters
   * @param {Object} filters - { category, status, author }
   */
  static async findAll(filters = {}) {
    const db = await getDb();
    let query = db.collection(COLLECTION_NAME);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.author) {
      query = query.where('author', '==', filters.author);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ bookId: doc.id, ...doc.data() }));
  }

  /**
   * Find book by ID
   */
  static async findById(id) {
    const db = await getDb();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return { bookId: doc.id, ...doc.data() };
  }

  /**
   * Search books by title or author keyword
   */
  static async search(searchTerm) {
    const db = await getDb();
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const term = (searchTerm || '').toLowerCase().trim();

    return snapshot.docs
      .map(doc => ({ bookId: doc.id, ...doc.data() }))
      .filter(book => {
        const titleMatch = book.title && book.title.toLowerCase().includes(term);
        const authorMatch = book.author && book.author.toLowerCase().includes(term);
        const categoryMatch = book.category && book.category.toLowerCase().includes(term);
        const isbnMatch = book.isbn && book.isbn.toLowerCase().includes(term);
        return titleMatch || authorMatch || categoryMatch || isbnMatch;
      });
  }

  /**
   * Create a new book
   */
  static async create(data) {
    const db = await getDb();
    const bookId = data.bookId || `bk_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const now = new Date().toISOString();
    const quantity = parseInt(data.quantity, 10) || 1;

    const bookData = {
      bookId,
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      category: data.category,
      quantity,
      status: quantity > 0 ? (data.status || 'available') : 'borrowed',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    await db.collection(COLLECTION_NAME).doc(bookId).set(bookData);
    return bookData;
  }

  /**
   * Update book by ID
   */
  static async update(id, updateData) {
    const db = await getDb();
    const bookRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await bookRef.get();
    if (!doc.exists) return null;

    const existingData = doc.data();
    const quantity = updateData.quantity !== undefined
      ? parseInt(updateData.quantity, 10)
      : existingData.quantity;

    // Automatically recalculate status if quantity changed and status wasn't explicitly supplied
    let status = updateData.status || existingData.status;
    if (updateData.quantity !== undefined && !updateData.status) {
      status = quantity > 0 ? 'available' : 'borrowed';
    }

    const dataToUpdate = {
      ...updateData,
      ...(updateData.quantity !== undefined && { quantity }),
      status,
      updatedAt: new Date().toISOString()
    };

    await bookRef.update(dataToUpdate);
    const updatedDoc = await bookRef.get();
    return { bookId: updatedDoc.id, ...updatedDoc.data() };
  }

  /**
   * Delete book by ID
   */
  static async delete(id) {
    const db = await getDb();
    const bookRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await bookRef.get();
    if (!doc.exists) return false;

    await bookRef.delete();
    return true;
  }
}

module.exports = BookModel;
