/**
 * Configuration Schema Validator
 * 
 * This module provides schema-based validation for configuration files
 * using Zod for type safety and comprehensive error reporting.
 */

import { z } from 'zod';

// Backend configuration schema
const backendSchema = z.object({
  baseUrl: z.string().url().describe('Base URL for the backend service'),
  apiKey: z.string().nullable().optional().describe('API key for authentication')
});

// Configuration schema
export const configSchema = z.object({
  backend: z.object({
    onboarding: backendSchema.describe('Onboarding service configuration'),
    transaction: backendSchema.describe('Transaction service configuration'),
    timeout: z.number().min(1000).max(60000).default(10000).describe('Request timeout in milliseconds'),
    retries: z.number().min(0).max(10).default(3).describe('Number of retry attempts')
  }).describe('Backend service configurations'),
  
  server: z.object({
    name: z.string().default('lerian-mcp-server').describe('Server name'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/).default('0.1.0').describe('Server version')
  }).describe('Server metadata'),
  
  useStubs: z.boolean().default(true).describe('Use stub data when backends are unavailable'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info').describe('Logging level'),
  autoDetect: z.boolean().default(true).describe('Auto-detect local services'),
  localOnly: z.boolean().default(true).describe('Only accept local connections'),
  docsUrl: z.string().url().default('https://docs.lerian.studio').describe('Base URL for online documentation'),
  
  // Advanced options
  cache: z.object({
    enabled: z.boolean().default(true).describe('Enable response caching'),
    ttl: z.number().min(0).max(3600000).default(60000).describe('Cache TTL in milliseconds'),
    maxSize: z.number().min(0).default(100).describe('Maximum cache entries')
  }).optional().describe('Cache configuration'),
  
  monitoring: z.object({
    enabled: z.boolean().default(true).describe('Enable monitoring and metrics'),
    interval: z.number().min(1000).default(60000).describe('Metrics collection interval')
  }).optional().describe('Monitoring configuration')
});

// Environment variable mapping
const envMapping = {
  'MIDAZ_BACKEND_ONBOARDING_URL': 'backend.onboarding.baseUrl',
  'MIDAZ_BACKEND_TRANSACTION_URL': 'backend.transaction.baseUrl',
  'MIDAZ_ONBOARDING_URL': 'backend.onboarding.baseUrl',
  'MIDAZ_TRANSACTION_URL': 'backend.transaction.baseUrl',
  'MIDAZ_API_KEY': ['backend.onboarding.apiKey', 'backend.transaction.apiKey'],
  'MIDAZ_BACKEND_TIMEOUT': 'backend.timeout',
  'MIDAZ_BACKEND_RETRIES': 'backend.retries',
  'MIDAZ_USE_STUBS': 'useStubs',
  'MIDAZ_LOG_LEVEL': 'logLevel',
  'MIDAZ_AUTO_DETECT': 'autoDetect',
  'MIDAZ_LOCAL_ONLY': 'localOnly',
  'MIDAZ_DOCS_URL': 'docsUrl'
};

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with data or errors
 */
export function validateConfig(config) {
  try {
    const validated = configSchema.parse(config);
    return {
      success: true,
      data: validated,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: formatZodErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Format Zod errors for display
 * @param {z.ZodError} error - Zod error object
 * @returns {Array} Formatted error messages
 */
function formatZodErrors(error) {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
    expected: err.expected,
    received: err.received
  }));
}

/**
 * Build configuration from environment variables
 * @returns {Object} Configuration object
 */
export function buildConfigFromEnv() {
  const config = {};
  
  for (const [envVar, configPath] of Object.entries(envMapping)) {
    const value = process.env[envVar];
    if (value === undefined) continue;
    
    // Handle multiple paths (e.g., API key for both services)
    const paths = Array.isArray(configPath) ? configPath : [configPath];
    
    for (const path of paths) {
      setNestedValue(config, path, parseEnvValue(value));
    }
  }
  
  return config;
}

/**
 * Parse environment variable value
 * @param {string} value - Environment variable value
 * @returns {any} Parsed value
 */
function parseEnvValue(value) {
  // Boolean values
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Numeric values
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // String values
  return value;
}

/**
 * Set nested object value by path
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot-separated path
 * @param {any} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    // Prevent prototype pollution
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      throw new Error(`Invalid configuration key: ${part}`);
    }
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  // Prevent prototype pollution on final key
  if (lastPart === '__proto__' || lastPart === 'constructor' || lastPart === 'prototype') {
    throw new Error(`Invalid configuration key: ${lastPart}`);
  }
  current[lastPart] = value;
}

/**
 * Merge configurations with priority
 * @param {...Object} configs - Configuration objects in priority order (lowest to highest)
 * @returns {Object} Merged configuration
 */
export function mergeConfigs(...configs) {
  const merged = {};
  
  for (const config of configs) {
    if (!config) continue;
    deepMerge(merged, config);
  }
  
  return merged;
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] === null || source[key] === undefined) {
      continue;
    }
    
    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

/**
 * Generate configuration documentation
 * @returns {string} Markdown documentation
 */
export function generateConfigDocs() {
  const docs = ['# Configuration Options\n'];
  
  docs.push('## Schema\n');
  docs.push('```typescript');
  docs.push(generateSchemaTypes(configSchema));
  docs.push('```\n');
  
  docs.push('## Environment Variables\n');
  for (const [envVar, path] of Object.entries(envMapping)) {
    docs.push(`- \`${envVar}\`: ${Array.isArray(path) ? path.join(', ') : path}`);
  }
  
  return docs.join('\n');
}

/**
 * Generate TypeScript types from schema
 * @param {z.ZodSchema} schema - Zod schema
 * @param {number} indent - Indentation level
 * @returns {string} TypeScript type definition
 */
function generateSchemaTypes(schema, indent = 0) {
  const spaces = '  '.repeat(indent);
  
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const lines = ['{'];
    
    for (const [key, value] of Object.entries(shape)) {
      const description = value.description ? ` // ${value.description}` : '';
      const optional = value.isOptional() ? '?' : '';
      lines.push(`${spaces}  ${key}${optional}: ${getTypeString(value)};${description}`);
    }
    
    lines.push(`${spaces}}`);
    return lines.join('\n');
  }
  
  return getTypeString(schema);
}

/**
 * Get TypeScript type string for schema
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {string} Type string
 */
function getTypeString(schema) {
  if (schema instanceof z.ZodString) return 'string';
  if (schema instanceof z.ZodNumber) return 'number';
  if (schema instanceof z.ZodBoolean) return 'boolean';
  if (schema instanceof z.ZodEnum) return schema.options.map(opt => `'${opt}'`).join(' | ');
  if (schema instanceof z.ZodNullable) return `${getTypeString(schema.unwrap())} | null`;
  if (schema instanceof z.ZodOptional) return getTypeString(schema.unwrap());
  if (schema instanceof z.ZodObject) return 'object';
  return 'any';
}