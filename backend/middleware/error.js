// backend/middleware/error.js - FINAL CORRECTED CODE (Robust Status Code Check)

// This handles errors that occur in your routes
const errorHandler = (err, req, res, next) => {
    // FIX: Check if a status code was explicitly set (e.g., 400 or 404). 
    // If not, and it wasn't a default 200, use 500 (Internal Server Error) as a safe fallback.
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    
    // Set the response status
    res.status(statusCode);

    // Send a JSON response with the error message
    res.json({
        message: err.message,
        // In development, you might want to show the stack trace for debugging
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };