const { verifyToken } = require('../utils/jwt');
const { getDb } = require('../config/firebase');

/**
 * Authentication Middleware
 * Validates JWT in Authorization header and populates req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format (Bearer token required).'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token missing.'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token authentication failed.'
      });
    }

    // Optionally check if user still exists in database
    const db = await getDb();
    const userDoc = await db.collection('users').doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    const userData = userDoc.data();
    // Attach fresh user info to req.user
    req.user = {
      userId: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred',
      error: error.message
    });
  }
};

module.exports = { authenticate };
