const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { validate } = require('../middleware/validator');
const { updateRoleValidation } = require('../utils/validation');

// All user management routes require librarian privileges
router.use(authenticate);
router.use(authorizeRoles('librarian'));

/**
 * @route   GET /api/users
 * @desc    Get all users (Librarian only)
 * @access  Private (Librarian)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID (Librarian only)
 * @access  Private (Librarian)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (Librarian only)
 * @access  Private (Librarian)
 */
router.put('/:id/role', updateRoleValidation, validate, userController.updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Librarian only)
 * @access  Private (Librarian)
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;
