/**
 * Security utilities for the Lerian MCP Server
 * Provides secure operations and validation functions
 * 
 * @since 3.0.0
 */

import crypto from 'crypto';

/**
 * Mask sensitive data for logging
 * @param {string} value - The sensitive value to mask
 * @param {number} visibleChars - Number of characters to show at the end (default: 4)
 * @returns {string} - Masked value
 */
export function maskSensitiveData(value, visibleChars = 4) {
    if (!value || typeof value !== 'string') {
        return 'none';
    }

    if (value.length <= visibleChars) {
        return '*'.repeat(value.length);
    }

    return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the string to generate
 * @returns {string} - Random hex string
 */
export function generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate that a string is a valid UUID
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID
 */
export function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
        return String(input);
    }

    const {
        maxLength = 1000,
        allowedChars = /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=[\]{}|;:'"<>\/\\`~]*$/,
        removeHtml = true
    } = options;

    let sanitized = input.slice(0, maxLength);

    if (removeHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    if (!allowedChars.test(sanitized)) {
        sanitized = sanitized.replace(/[^\w\s\-_.]/g, '');
    }

    return sanitized.trim();
}

/**
 * Check if an environment variable contains sensitive data patterns
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 * @returns {boolean} - True if potentially sensitive
 */
export function isSensitiveEnvVar(key, value) {
    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /key/i,
        /credential/i,
        /auth/i,
        /api[_-]?key/i
    ];

    return sensitivePatterns.some(pattern =>
        pattern.test(key) || (value && pattern.test(value))
    );
}

/**
 * Secure comparison of strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
export function secureCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    isAllowed(identifier) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }

        const userRequests = this.requests.get(identifier);

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => time > windowStart);
        this.requests.set(identifier, validRequests);

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        return true;
    }

    cleanup() {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        for (const [identifier, requests] of this.requests.entries()) {
            const validRequests = requests.filter(time => time > windowStart);
            if (validRequests.length === 0) {
                this.requests.delete(identifier);
            } else {
                this.requests.set(identifier, validRequests);
            }
        }
    }
}

export default {
    maskSensitiveData,
    generateSecureKey,
    isValidUUID,
    sanitizeInput,
    isSensitiveEnvVar,
    secureCompare,
    RateLimiter
}; 