const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validator');
const {
  createBookValidation,
  updateBookValidation
} = require('../utils/validation');

/**
 * @route   GET /api/books
 * @desc    Get all books (supports query params: category, status, author)
 * @access  Public
 */
router.get('/', bookController.getAllBooks);

/**
 * @route   GET /api/books/search
 * @desc    Search books by title or author
 * @access  Public
 */
router.get('/search', bookController.searchBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get single book details
 * @access  Public
 */
router.get('/:id', bookController.getBookById);

/**
 * @route   POST /api/books
 * @desc    Add new book (Librarian only)
 * @access  Private (Librarian)
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('librarian'),
  createBookValidation,
  validate,
  bookController.createBook
);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book details (Librarian only)
 * @access  Private (Librarian)
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('librarian'),
  updateBookValidation,
  validate,
  bookController.updateBook
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book (Librarian only)
 * @access  Private (Librarian)
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('librarian'),
  bookController.deleteBook
);

/**
 * @route   POST /api/books/:id/borrow
 * @desc    Borrow a book (Student only)
 * @access  Private (Student)
 */
router.post(
  '/:id/borrow',
  authenticate,
  authorizeRoles('student'),
  bookController.borrowBook
);

/**
 * @route   POST /api/books/:id/return
 * @desc    Return a book (Student only)
 * @access  Private (Student)
 */
router.post(
  '/:id/return',
  authenticate,
  authorizeRoles('student'),
  bookController.returnBook
);

module.exports = router;
