const crypto = require('crypto');

// In-memory store for CSRF tokens (use Redis in production for distributed systems)
const tokenStore = new Map();

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate CSRF token for a session
 */
const generateToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(token, {
    sessionId,
    createdAt: Date.now()
  });
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
};

/**
 * Validate CSRF token
 */
const validateToken = (token, sessionId) => {
  const stored = tokenStore.get(token);
  
  if (!stored) return false;
  if (stored.sessionId !== sessionId) return false;
  if (Date.now() - stored.createdAt > TOKEN_EXPIRY) {
    tokenStore.delete(token);
    return false;
  }
  
  return true;
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(token);
    }
  }
};

/**
 * Middleware to generate and attach CSRF token to response
 */
const csrfToken = (req, res, next) => {
  // Generate session ID if not exists (use user ID or session ID)
  const sessionId = req.user?._id?.toString() || req.sessionID || 'anonymous';
  
  // Generate token
  const token = generateToken(sessionId);
  
  // Attach to response
  res.locals.csrfToken = token;
  
  // Set cookie for client-side access
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Allow JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY
  });
  
  next();
};

/**
 * Middleware to validate CSRF token on state-changing requests
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from header or body
  const token = req.headers['x-csrf-token'] || 
                req.headers['x-xsrf-token'] || 
                req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  
  // Get session ID
  const sessionId = req.user?._id?.toString() || req.sessionID || 'anonymous';
  
  // Validate token
  if (!validateToken(token, sessionId)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  next();
};

/**
 * Middleware to apply CSRF protection conditionally
 * Use this for routes that need CSRF protection
 */
const conditionalCsrf = (req, res, next) => {
  // Skip for API calls with Bearer token (already authenticated)
  if (req.headers.authorization?.startsWith('Bearer')) {
    return next();
  }
  
  return csrfProtection(req, res, next);
};

module.exports = {
  csrfToken,
  csrfProtection,
  conditionalCsrf,
  generateToken,
  validateToken
};
