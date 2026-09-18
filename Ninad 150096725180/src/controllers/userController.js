const UserModel = require('../models/userModel');

/**
 * Get all users (Librarian only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (Librarian only)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (Librarian only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }

    const updatedUser = await UserModel.update(id, { role });
    const { password, ...sanitized } = updatedUser;

    return res.status(200).json({
      success: true,
      message: `User role updated successfully to '${role}'`,
      data: sanitized
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Librarian only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent librarian from deleting their own account
    if (req.user && req.user.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own librarian account.'
      });
    }

    const deleted = await UserModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser
};
