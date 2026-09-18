const TransactionModel = require('../models/transactionModel');
const BookModel = require('../models/bookModel');
const UserModel = require('../models/userModel');

/**
 * Get all transactions (Librarian only)
 * Optionally enriches with book and user details
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await TransactionModel.findAll();

    // Enrich with book and user title/name for better API consumer experience
    const enriched = await Promise.all(
      transactions.map(async tx => {
        const book = await BookModel.findById(tx.bookId);
        const user = await UserModel.findById(tx.userId);
        return {
          ...tx,
          bookTitle: book ? book.title : 'Unknown Book',
          userName: user ? user.name : 'Unknown User',
          userEmail: user ? user.email : 'Unknown Email'
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in user's transaction history
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const transactions = await TransactionModel.findByUserId(userId);

    const enriched = await Promise.all(
      transactions.map(async tx => {
        const book = await BookModel.findById(tx.bookId);
        return {
          ...tx,
          bookTitle: book ? book.title : 'Unknown Book',
          bookAuthor: book ? book.author : 'Unknown Author'
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getMyTransactions
};
