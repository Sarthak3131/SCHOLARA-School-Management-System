import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/**
 * Protect routes: Authenticates user via Bearer token or HTTP-only cookie.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 2. Check Cookie
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('The user associated with this token no longer exists.', 401));
    }

    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return next(new AppError('Your session has been revoked. Please log in again.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact administration.', 403));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid or corrupted authentication token.', 401));
  }
};

/**
 * Role-Based Access Control (RBAC) middleware:
 * Grants access only if user role matches one of the specified allowed roles.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before verifying role permissions.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' lacks required permissions.`,
        requiredRoles: roles,
      });
    }

    next();
  };
};
