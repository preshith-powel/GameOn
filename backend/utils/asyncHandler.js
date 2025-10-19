//this function wraps your route logic and automatically handles the try...catch to send the error to Express.

// backend/utils/asyncHandler.js

// This function takes an async function (your route logic) and returns a new function.
// It automatically catches errors and passes them to Express's next() function,
// which will then be caught by your centralized error handler.

const asyncHandler = (fn) => (req, res, next) => {
    // Promise.resolve(fn(req, res, next)) runs your route logic.
    // .catch(next) ensures any error is passed to the error middleware.
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;