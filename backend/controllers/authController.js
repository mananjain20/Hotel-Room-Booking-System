const jwt = require('jsonwebtoken');
const Guest = require('../models/Guest');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sendTokenResponse = (res, statusCode, message, user) => {
  const token = signToken(user);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: user,
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are all required.', 400);
  }

  const existingGuest = await Guest.findOne({ email: email.toLowerCase() });
  if (existingGuest) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const newGuest = await Guest.create({
    name,
    email,
    password,
    role: 'guest',
  });

  sendTokenResponse(res, 201, 'Registration successful.', newGuest);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide both email and password.', 400);
  }

  const user = await Guest.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  sendTokenResponse(res, 200, 'Login successful.', user);
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = {
  register,
  login,
  getMe,
};
