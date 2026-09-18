const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authRateLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation
} = require('../utils/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Student/Librarian)
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get JWT token
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user profile
 * @access  Private (Authenticated users)
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private (Authenticated users)
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validate,
  authController.updateProfile
);

module.exports = router;
