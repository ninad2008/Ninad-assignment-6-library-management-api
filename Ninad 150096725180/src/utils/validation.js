const { body, param, query } = require('express-validator');

// Auth validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['student', 'librarian'])
    .withMessage('Role must be either student or librarian')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Book validation rules
const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required'),
  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer of at least 1')
];

const updateBookValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('author')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Author cannot be empty'),
  body('isbn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('ISBN cannot be empty'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be an integer of at least 0'),
  body('status')
    .optional()
    .isIn(['available', 'borrowed'])
    .withMessage('Status must be available or borrowed')
];

// User management validation rules
const updateRoleValidation = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['student', 'librarian'])
    .withMessage('Role must be either student or librarian')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  createBookValidation,
  updateBookValidation,
  updateRoleValidation
};
