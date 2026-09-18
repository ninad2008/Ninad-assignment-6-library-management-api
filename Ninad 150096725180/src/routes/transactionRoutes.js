const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

/**
 * @route   GET /api/transactions/my
 * @desc    Get logged-in user's transaction history
 * @access  Private (Authenticated users)
 */
router.get(
  '/my',
  authenticate,
  transactionController.getMyTransactions
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions across the library
 * @access  Private (Librarian only)
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('librarian'),
  transactionController.getAllTransactions
);

module.exports = router;
