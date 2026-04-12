const AuditLog = require('../models/AuditLog');

/**
 * Log privacy-sensitive operations for compliance and security auditing
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User performing the action
 * @param {string} params.action - Action performed (e.g., 'DATA_EXPORT', 'ACCOUNT_DELETE')
 * @param {string} params.resource - Resource affected (e.g., 'USER_DATA', 'SESSION')
 * @param {string} params.ipAddress - IP address of the request
 * @param {Object} params.metadata - Additional metadata
 */
const logAudit = async ({ userId, action, resource, ipAddress, metadata = {} }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      ipAddress,
      metadata,
      timestamp: new Date()
    });
  } catch (err) {
    // Don't throw - audit logging should never break the main flow
    console.error('Audit logging failed:', err.message);
  }
};

/**
 * Express middleware to automatically log sensitive operations
 */
const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send to log after successful response
    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit({
          userId: req.user?._id?.toString(),
          action,
          resource,
          ipAddress: req.ip || req.connection.remoteAddress,
          metadata: {
            method: req.method,
            path: req.path,
            userAgent: req.get('user-agent')
          }
        });
      }
      
      // Call original send
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { logAudit, auditMiddleware };
