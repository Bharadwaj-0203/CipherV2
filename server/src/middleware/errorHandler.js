// server/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  };
  
  module.exports = errorHandler;
  