/**
 * utils/asyncHandler.js
 * Wraps an async route handler so that any rejected promise or thrown error
 * is automatically forwarded to Express's next(err) — no try/catch boilerplate
 * needed inside controllers.
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.get('/rooms', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
