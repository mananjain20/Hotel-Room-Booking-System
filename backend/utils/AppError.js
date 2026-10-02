/**
 * utils/AppError.js
 * A lightweight custom error class that carries an HTTP status code.
 *
 * Usage (inside a controller or middleware):
 *   throw new AppError('Room not found', 404);
 *
 * The centralized errorHandler in middleware/errorHandler.js reads
 * err.statusCode automatically.
 */

class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message sent to the client.
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404).
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';

    // Capture stack trace (V8 only) for cleaner error reporting
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
