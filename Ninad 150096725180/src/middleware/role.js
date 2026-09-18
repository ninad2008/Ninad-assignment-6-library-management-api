/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - e.g. 'librarian', 'student'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
