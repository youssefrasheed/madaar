const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'social-media-hub-super-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Failed to authenticate token'
    });
  }
}

authenticateToken.authenticateToken = authenticateToken;
authenticateToken.JWT_SECRET = JWT_SECRET;

module.exports = authenticateToken;
