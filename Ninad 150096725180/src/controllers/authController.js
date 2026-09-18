const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user (Student or Librarian)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firestore
    const userRole = role === 'librarian' ? 'librarian' : 'student';
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.userId,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user & get JWT token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const { password, ...profile } = user;
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      // Check if new email is already taken by someone else
      const existing = await UserModel.findByEmail(email);
      if (existing && existing.userId !== req.user.userId) {
        return res.status(409).json({
          success: false,
          message: 'Email address is already in use by another account.'
        });
      }
      updates.email = email.toLowerCase().trim();
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await UserModel.update(req.user.userId, updates);
    const { password: _, ...sanitized } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitized
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
