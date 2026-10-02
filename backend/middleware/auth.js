const jwt = require('jsonwebtoken');
const Guest = require('../models/Guest');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      'You are not logged in. Please provide a Bearer token to access this route.',
      401
    );
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Token missing from Authorization header.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw err;
  }

  const currentUser = await Guest.findById(decoded.id);
  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
