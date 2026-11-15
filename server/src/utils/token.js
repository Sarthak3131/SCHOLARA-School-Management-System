import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
};

export const assertJwtSecret = () => {
  getJwtSecret();
};

/**
 * Generate a signed JWT for an authenticated user.
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Verify a given JWT token.
 */
export const verifyToken = (token) => {
  return jwt.verify(
    token,
    getJwtSecret()
  );
};

/**
 * Send standardized token response with optional secure HTTP-only cookie.
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Authenticated successfully') => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
};
