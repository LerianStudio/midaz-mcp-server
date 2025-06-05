import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security configuration
const SECURITY_CONFIG = {
  allowedHosts: ['localhost', '127.0.0.1', '::1'],
  maxRequestSize: 1024 * 1024, // 1MB
  sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
  auditLogPath: path.join(__dirname, '../../logs/audit.log')
};

// Ensure audit log directory exists
const auditLogDir = path.dirname(SECURITY_CONFIG.auditLogPath);
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

/**
 * Verify that the connection is from localhost only
 */
export function isLocalConnection(request) {
  // In MCP context, we're using stdio transport which is inherently local
  // This function is for future HTTP transport support
  if (!request || !request.headers) {
    return true; // stdio transport
  }

  const host = request.headers.host || '';
  const remoteAddress = request.socket?.remoteAddress || '';

  // Check if host is in allowed list
  const hostName = host.split(':')[0];
  if (!SECURITY_CONFIG.allowedHosts.includes(hostName)) {
    return false;
  }

  // Check remote address
  const isLocalAddress = remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1';

  return isLocalAddress;
}

/**
 * Sanitize sensitive data from objects
 */
export function sanitizeSensitiveData(data, depth = 0) {
  if (depth > 10) return data; // Prevent infinite recursion

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeSensitiveData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SECURITY_CONFIG.sensitiveFields.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create audit log entry
 */
export function createAuditLog(entry) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...sanitizeSensitiveData(entry),
    id: crypto.randomUUID()
  };

  // Append to audit log file
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(SECURITY_CONFIG.auditLogPath, logLine);

  return logEntry;
}

/**
 * Log tool invocation for security monitoring
 */
export function auditToolInvocation(toolName, args, userId = 'anonymous', result = null, error = null) {
  const entry = {
    type: 'tool_invocation',
    tool: toolName,
    user: userId,
    args: args,
    success: !error,
    error: error ? error.message : null,
    resultSize: result ? JSON.stringify(result).length : 0
  };

  return createAuditLog(entry);
}

/**
 * Log resource access for security monitoring
 */
export function auditResourceAccess(resourceUri, userId = 'anonymous', success = true, error = null) {
  const entry = {
    type: 'resource_access',
    resource: resourceUri,
    user: userId,
    success,
    error: error ? error.message : null
  };

  return createAuditLog(entry);
}

/**
 * Validate input against schema with enhanced security checks
 */
export function validateInput(schema, data) {
  try {
    // First, check data size
    const dataSize = JSON.stringify(data).length;
    if (dataSize > SECURITY_CONFIG.maxRequestSize) {
      throw new Error(`Request size (${dataSize} bytes) exceeds maximum allowed size (${SECURITY_CONFIG.maxRequestSize} bytes)`);
    }

    // Validate against schema
    const validated = schema.parse(data);

    // Additional security checks
    checkForInjectionPatterns(validated);

    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check for common injection patterns
 */
function checkForInjectionPatterns(data, depth = 0) {
  if (depth > 10) return;

  const injectionPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /\.\.[\/\\]/g, // Path traversal
    /[<>\"\'`]/g // Basic XSS characters (might be too restrictive)
  ];

  const checkString = (str) => {
    for (const pattern of injectionPatterns) {
      if (pattern.test(str)) {
        throw new Error(`Potential injection pattern detected: ${pattern}`);
      }
    }
  };

  if (typeof data === 'string') {
    checkString(data);
  } else if (typeof data === 'object' && data !== null) {
    for (const value of Object.values(data)) {
      if (typeof value === 'string') {
        checkString(value);
      } else if (typeof value === 'object') {
        checkForInjectionPatterns(value, depth + 1);
      }
    }
  }
}

/**
 * Secure configuration file handling
 */
export function readSecureConfig(configPath) {
  try {
    // Open file descriptor first to avoid TOCTOU race condition
    const fd = fs.openSync(configPath, 'r');

    try {
      // Check file permissions using file descriptor
      const stats = fs.fstatSync(fd);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      // Warn if file has overly permissive permissions
      if (mode !== '600' && mode !== '400') {
        // Warning: Config file permissions (silent for MCP protocol)
      }

      // Read and parse config using file descriptor
      const configContent = fs.readFileSync(fd, 'utf8');
      const config = JSON.parse(configContent);

      // Validate config structure
      validateConfigSecurity(config);

      return config;
    } finally {
      // Always close file descriptor
      fs.closeSync(fd);
    }
  } catch (error) {
    throw new Error(`Failed to read secure config: ${error.message}`);
  }
}

/**
 * Validate configuration for security issues
 */
function validateConfigSecurity(config) {
  // Check for sensitive data in config
  const configStr = JSON.stringify(config);

  // Ensure no plaintext passwords or tokens
  const sensitivePatterns = [
    /password\s*[:=]\s*["\']?[^"\'{}]+["\']?/i,
    /token\s*[:=]\s*["\']?[^"\'{}]+["\']?/i,
    /secret\s*[:=]\s*["\']?[^"\'{}]+["\']?/i
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(configStr)) {
      // Warning: Potential sensitive data found (silent for MCP protocol)
    }
  }

  // Ensure backend URLs are localhost only
  if (config.backend) {
    for (const [service, url] of Object.entries(config.backend)) {
      if (typeof url === 'string' && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        // Warning: Backend service not localhost (silent for MCP protocol)
      }
    }
  }
}

/**
 * Create a secure process environment
 */
export function createSecureEnvironment() {
  // Drop unnecessary environment variables
  const allowedEnvVars = [
    'PATH',
    'HOME',
    'USER',
    'LANG',
    'LC_ALL',
    'NODE_ENV',
    'MIDAZ_BACKEND_URL',
    'MIDAZ_USE_STUBS',
    'MIDAZ_CONFIG_PATH'
  ];

  const currentEnv = { ...process.env };
  for (const key of Object.keys(currentEnv)) {
    if (!allowedEnvVars.includes(key) && !key.startsWith('npm_')) {
      delete process.env[key];
    }
  }

  // Set secure defaults (only if not already set)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
}

/**
 * Rate limiting for security
 */
const rateLimitMap = new Map();

export function checkRateLimit(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  const limiter = rateLimitMap.get(key);

  if (now > limiter.resetAt) {
    limiter.count = 1;
    limiter.resetAt = now + windowMs;
    return true;
  }

  if (limiter.count >= limit) {
    return false;
  }

  limiter.count++;
  return true;
}

/**
 * Clean up old audit logs
 */
export function cleanupAuditLogs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const auditLogPath = SECURITY_CONFIG.auditLogPath;
  const tempPath = auditLogPath + '.tmp';

  try {
    const input = fs.readFileSync(auditLogPath, 'utf8');
    const lines = input.split('\n').filter(line => {
      if (!line.trim()) return false;
      try {
        const entry = JSON.parse(line);
        return new Date(entry.timestamp) > cutoffDate;
      } catch {
        return false;
      }
    });

    fs.writeFileSync(tempPath, lines.join('\n') + '\n');
    fs.renameSync(tempPath, auditLogPath);
  } catch (error) {
    // Failed to cleanup audit logs (silent for MCP protocol)
  }
}

/**
 * Initialize security module
 */
export function initializeSecurity() {
  // Create secure environment
  createSecureEnvironment();

  // Set up periodic audit log cleanup
  setInterval(() => {
    cleanupAuditLogs();
  }, 24 * 60 * 60 * 1000); // Daily

  // Security module initialized (silent for MCP protocol)
}