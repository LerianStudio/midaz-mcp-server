/**
 * Configuration security utilities
 * Provides secure handling of configuration files
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { readSecureConfig } from './security.js';

// Default secure configuration template
const secureConfigTemplate = {
  backend: {
    onboarding: "http://localhost:3000",
    transaction: "http://localhost:3001"
  },
  useStubs: true,
  security: {
    allowedHosts: ["localhost", "127.0.0.1", "::1"],
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100
    },
    auditLog: {
      enabled: true,
      retentionDays: 30
    }
  }
};

/**
 * Get secure configuration paths
 */
export function getSecureConfigPaths() {
  return [
    path.join(homedir(), '.midaz', 'mcp-config.json'),
    path.join(process.cwd(), 'midaz-mcp-config.json')
  ];
}

/**
 * Create secure configuration file with proper permissions
 */
export function createSecureConfig(configPath, config = secureConfigTemplate) {
  const dir = path.dirname(configPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  
  // Write config file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), {
    mode: 0o600 // Read/write for owner only
  });
  
  console.log(`Created secure config at: ${configPath}`);
  console.log('File permissions set to 600 (owner read/write only)');
}

/**
 * Load configuration with security checks
 */
export function loadSecureConfiguration() {
  const configPaths = getSecureConfigPaths();
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        return readSecureConfig(configPath);
      } catch (error) {
        console.error(`Failed to load config from ${configPath}:`, error.message);
      }
    }
  }
  
  // Return default secure config if no file found
  return secureConfigTemplate;
}

/**
 * Validate and sanitize configuration
 */
export function sanitizeConfig(config) {
  const sanitized = { ...config };
  
  // Ensure backend URLs are localhost only
  if (sanitized.backend) {
    for (const [service, url] of Object.entries(sanitized.backend)) {
      if (typeof url === 'string') {
        const urlObj = new URL(url);
        if (!['localhost', '127.0.0.1', '[::1]'].includes(urlObj.hostname)) {
          console.warn(`Warning: Non-localhost backend URL detected for ${service}. Forcing localhost.`);
          urlObj.hostname = 'localhost';
          sanitized.backend[service] = urlObj.toString();
        }
      }
    }
  }
  
  // Ensure security settings
  if (!sanitized.security) {
    sanitized.security = secureConfigTemplate.security;
  }
  
  return sanitized;
}