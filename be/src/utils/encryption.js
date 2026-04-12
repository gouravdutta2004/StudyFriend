const crypto = require('crypto');

// Use environment variable or generate a key (should be in .env in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

/**
 * Encrypt sensitive text data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV prepended
 */
const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption error:', err.message);
    return text; // Fallback to unencrypted if encryption fails
  }
};

/**
 * Decrypt encrypted text data
 * @param {string} text - Encrypted text with IV prepended
 * @returns {string} - Decrypted plain text
 */
const decrypt = (text) => {
  if (!text || !text.includes(':')) return text;
  
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return text; // Fallback to returning as-is if decryption fails
  }
};

module.exports = { encrypt, decrypt };
