const BookModel = require('../models/bookModel');
const TransactionModel = require('../models/transactionModel');

/**
 * Get all books with optional filters
 * Query params: category, status, author
 */
const getAllBooks = async (req, res, next) => {
  try {
    const { category, status, author } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (author) filters.author = author;

    const books = await BookModel.findAll(filters);
    return res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search books by title or author
 * Query param: q
 */
const searchBooks = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query || '';
    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter (q) is required'
      });
    }

    const books = await BookModel.search(query);
    return res.status(200).json({
      success: true,
      query,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book by ID
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await BookModel.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add new book (Librarian only)
 */
const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;
    const newBook = await BookModel.create({
      title,
      author,
      isbn,
      category,
      quantity: quantity !== undefined ? parseInt(quantity, 10) : 1
    });

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update book details (Librarian only)
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await BookModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found`
      });
    }

    const updatedBook = await BookModel.update(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete book (Librarian only)
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await BookModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Book ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Borrow a book (Student only)
 */
const borrowBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await BookModel.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found`
      });
    }

    // Check if book is available
    if (book.quantity <= 0 || book.status === 'borrowed') {
      return res.status(400).json({
        success: false,
        message: 'This book is currently out of stock or borrowed.'
      });
    }

    // Check if the student already has an active borrow for this book
    const existingBorrow = await TransactionModel.findActiveBorrow(userId, id);
    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book and have not returned it yet.'
      });
    }

    // Decrement quantity and adjust status
    const newQuantity = book.quantity - 1;
    const newStatus = newQuantity > 0 ? 'available' : 'borrowed';
    await BookModel.update(id, {
      quantity: newQuantity,
      status: newStatus
    });

    // Create transaction
    const transaction = await TransactionModel.create({
      userId,
      bookId: id,
      type: 'borrow',
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      message: `Book '${book.title}' borrowed successfully. Please return by due date.`,
      data: {
        transaction,
        remainingQuantity: newQuantity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return a book (Student only)
 */
const returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await BookModel.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found`
      });
    }

    // Find active transaction
    const activeTransaction = await TransactionModel.findActiveBorrow(userId, id);
    if (!activeTransaction) {
      return res.status(400).json({
        success: false,
        message: 'No active borrow transaction found for this book and user.'
      });
    }

    // Mark transaction as returned
    const updatedTransaction = await TransactionModel.markReturned(activeTransaction.transactionId);

    // Increment book quantity and ensure status is available
    const newQuantity = (book.quantity || 0) + 1;
    await BookModel.update(id, {
      quantity: newQuantity,
      status: 'available'
    });

    return res.status(200).json({
      success: true,
      message: `Book '${book.title}' returned successfully. Thank you!`,
      data: {
        transaction: updatedTransaction,
        availableQuantity: newQuantity
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook
};
