import User from '../models/User.js';
import { sendTokenResponse } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact the administrator.', 403));
    }

    // Verify candidate password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Send JWT token in response & cookie
    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    }, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user & clear session cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (_req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    httpOnly: true,
  });

  sendSuccess(res, {}, 'Logged out successfully');
};

/**
 * @desc    Register a new user (Institutional / Admin / Testing use)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'guardian',
      phone: phone || '',
    });

    sendTokenResponse(user, 201, res, 'User account registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password for logged in user
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password does not match records.', 400));
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};
