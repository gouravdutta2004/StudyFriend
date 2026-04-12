const rateLimit = require('express-rate-limit');

// Auth endpoints - strict rate limiting to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window (raised from 5 — prevents dev lockout)
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Google OAuth — higher threshold because failures can be external (popup closed, network)
const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many Google sign-in attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password reset - prevent abuse
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset requests, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search endpoints - prevent scraping
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: 'Too many search requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Report/moderation - prevent spam
const moderationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: 'Too many reports submitted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints - general protection
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  googleAuthLimiter,
  passwordResetLimiter,
  searchLimiter,
  moderationLimiter,
  apiLimiter,
};
