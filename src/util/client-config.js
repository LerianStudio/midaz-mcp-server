/**
 * Client Configuration Schema and Management
 * Handles client-specific configuration, overrides, and adaptive settings
 */

import { createLogger } from './mcp-logging.js';
import { ClientPatterns, DEFAULT_CLIENT } from './client-detection.js';
import { ToolComplexity } from './client-adaptation.js';

const logger = createLogger('client-config');

/**
 * Configuration schema for client capabilities
 */
export const ClientConfigSchema = {
  // Core identification
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  version: { type: 'string', default: '1.0.0' },
  
  // Tool capabilities
  maxToolsPerCall: { type: 'number', min: 1, max: 50, default: 10 },
  maxConcurrentTools: { type: 'number', min: 1, max: 10, default: 2 },
  toolComplexity: { type: 'string', enum: Object.values(ToolComplexity), default: 'medium' },
  
  // Content support
  supportsBinaryContent: { type: 'boolean', default: false },
  supportsImages: { type: 'boolean', default: false },
  supportsStreaming: { type: 'boolean', default: false },
  supportsMarkdown: { type: 'boolean', default: true },
  
  // Response handling
  maxResponseSize: { type: 'number', min: 1000, max: 1000000, default: 50000 },
  outputFormat: { type: 'string', enum: ['minimal', 'concise', 'structured', 'developer'], default: 'structured' },
  escapeHandling: { type: 'string', enum: ['none', 'minimal', 'standard', 'json', 'markdown'], default: 'standard' },
  
  // Rate limiting
  rateLimit: {
    type: 'object',
    properties: {
      requests: { type: 'number', min: 1, max: 1000, default: 60 },
      window: { type: 'number', min: 1000, max: 3600000, default: 60000 }, // 1 minute
      burstLimit: { type: 'number', min: 1, max: 100, default: 10 }
    }
  },
  
  // Error handling
  errorVerbosity: { type: 'string', enum: ['minimal', 'standard', 'detailed', 'debug'], default: 'standard' },
  includeStackTrace: { type: 'boolean', default: false },
  
  // Performance preferences
  timeoutMs: { type: 'number', min: 1000, max: 300000, default: 30000 },
  retryAttempts: { type: 'number', min: 0, max: 5, default: 2 },
  cacheResponses: { type: 'boolean', default: true },
  
  // Feature flags
  features: {
    type: 'object',
    properties: {
      pagination: { type: 'boolean', default: true },
      subscriptions: { type: 'boolean', default: false },
      templates: { type: 'boolean', default: false },
      analytics: { type: 'boolean', default: false }
    }
  },
  
  // UI preferences
  ui: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['light', 'dark', 'auto'], default: 'auto' },
      dateFormat: { type: 'string', default: 'ISO' },
      numberFormat: { type: 'string', default: 'en-US' },
      timezone: { type: 'string', default: 'UTC' }
    }
  }
};

/**
 * Client configuration validator
 */
export class ClientConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate configuration against schema
   */
  validate(config, schema = ClientConfigSchema) {
    this.errors = [];
    this.warnings = [];
    
    const validated = this.validateObject(config, schema, 'root');
    
    return {
      valid: this.errors.length === 0,
      config: validated,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  validateObject(obj, schema, path) {
    const result = {};
    
    // Process each schema property
    for (const [key, schemaRule] of Object.entries(schema)) {
      const value = obj?.[key];
      const currentPath = `${path}.${key}`;
      
      // Check required fields
      if (schemaRule.required && (value === undefined || value === null)) {
        this.errors.push(`Required field missing: ${currentPath}`);
        continue;
      }
      
      // Use default if value is undefined
      if (value === undefined && schemaRule.default !== undefined) {
        result[key] = schemaRule.default;
        continue;
      }
      
      // Skip validation for undefined optional fields
      if (value === undefined) continue;
      
      // Validate by type
      const validatedValue = this.validateType(value, schemaRule, currentPath);
      if (validatedValue !== undefined) {
        result[key] = validatedValue;
      }
    }
    
    // Check for unknown properties
    if (obj) {
      for (const key of Object.keys(obj)) {
        if (!schema[key]) {
          this.warnings.push(`Unknown property: ${path}.${key}`);
        }
      }
    }
    
    return result;
  }

  validateType(value, rule, path) {
    switch (rule.type) {
      case 'string':
        return this.validateString(value, rule, path);
      case 'number':
        return this.validateNumber(value, rule, path);
      case 'boolean':
        return this.validateBoolean(value, rule, path);
      case 'object':
        return this.validateNestedObject(value, rule, path);
      default:
        this.warnings.push(`Unknown type in schema: ${rule.type} at ${path}`);
        return value;
    }
  }

  validateString(value, rule, path) {
    if (typeof value !== 'string') {
      this.errors.push(`Expected string at ${path}, got ${typeof value}`);
      return undefined;
    }
    
    if (rule.enum && !rule.enum.includes(value)) {
      this.errors.push(`Invalid enum value at ${path}: ${value}. Expected one of: ${rule.enum.join(', ')}`);
      return undefined;
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      this.errors.push(`String too short at ${path}: ${value.length} < ${rule.minLength}`);
      return undefined;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      this.errors.push(`String too long at ${path}: ${value.length} > ${rule.maxLength}`);
      return undefined;
    }
    
    return value;
  }

  validateNumber(value, rule, path) {
    const num = Number(value);
    if (isNaN(num)) {
      this.errors.push(`Expected number at ${path}, got ${typeof value}`);
      return undefined;
    }
    
    if (rule.min !== undefined && num < rule.min) {
      this.errors.push(`Number too small at ${path}: ${num} < ${rule.min}`);
      return undefined;
    }
    
    if (rule.max !== undefined && num > rule.max) {
      this.errors.push(`Number too large at ${path}: ${num} > ${rule.max}`);
      return undefined;
    }
    
    return num;
  }

  validateBoolean(value, rule, path) {
    if (typeof value !== 'boolean') {
      this.errors.push(`Expected boolean at ${path}, got ${typeof value}`);
      return undefined;
    }
    return value;
  }

  validateNestedObject(value, rule, path) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push(`Expected object at ${path}, got ${typeof value}`);
      return undefined;
    }
    
    if (rule.properties) {
      return this.validateObject(value, rule.properties, path);
    }
    
    return value;
  }
}

/**
 * Client configuration manager
 */
export class ClientConfigManager {
  constructor() {
    this.configs = new Map();
    this.overrides = new Map();
    this.validator = new ClientConfigValidator();
    this.adaptiveSettings = new Map();
    
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default configurations for known clients
   */
  initializeDefaultConfigs() {
    for (const [, clientPattern] of Object.entries(ClientPatterns)) {
      const config = this.createConfigFromPattern(clientPattern);
      this.configs.set(clientPattern.id, config);
    }
    
    logger.info('Default client configurations initialized', { 
      count: this.configs.size 
    });
  }

  /**
   * Create configuration from client pattern
   */
  createConfigFromPattern(pattern) {
    return {
      id: pattern.id,
      name: pattern.name,
      version: '1.0.0',
      ...pattern.capabilities,
      features: {
        pagination: true,
        subscriptions: pattern.capabilities.supportsStreaming || false,
        templates: pattern.capabilities.toolComplexity === 'high',
        analytics: pattern.capabilities.toolComplexity !== 'low'
      },
      ui: {
        theme: 'auto',
        dateFormat: 'ISO',
        numberFormat: 'en-US',
        timezone: 'UTC'
      }
    };
  }

  /**
   * Get configuration for client
   */
  getConfig(clientId) {
    const baseConfig = this.configs.get(clientId) || this.configs.get(DEFAULT_CLIENT.id);
    const overrides = this.overrides.get(clientId) || {};
    const adaptive = this.adaptiveSettings.get(clientId) || {};
    
    // Merge configurations with priority: adaptive > overrides > base
    const merged = this.mergeConfigs(baseConfig, overrides, adaptive);
    
    // Validate merged configuration
    const validation = this.validator.validate(merged);
    if (!validation.valid) {
      logger.warn('Invalid client configuration', { 
        clientId, 
        errors: validation.errors 
      });
    }
    
    return validation.config;
  }

  /**
   * Set configuration override for client
   */
  setOverride(clientId, overrideConfig) {
    const validation = this.validator.validate(overrideConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration override: ${validation.errors.join(', ')}`);
    }
    
    this.overrides.set(clientId, validation.config);
    logger.info('Configuration override set', { clientId });
  }

  /**
   * Update adaptive settings based on client behavior
   */
  updateAdaptiveSettings(clientId, behaviorData) {
    const current = this.adaptiveSettings.get(clientId) || {};
    const updated = { ...current };
    
    // Adjust based on error rate
    if (behaviorData.errorRate > 0.1) {
      updated.maxToolsPerCall = Math.max(1, (current.maxToolsPerCall || 10) * 0.8);
      updated.timeoutMs = Math.min(60000, (current.timeoutMs || 30000) * 1.2);
    }
    
    // Adjust based on response time
    if (behaviorData.avgResponseTime > 5000) {
      updated.maxConcurrentTools = Math.max(1, (current.maxConcurrentTools || 2) - 1);
    }
    
    // Adjust based on response size
    if (behaviorData.avgResponseSize > (current.maxResponseSize || 50000) * 0.8) {
      updated.outputFormat = 'concise';
      updated.maxResponseSize = Math.min(100000, behaviorData.avgResponseSize * 1.2);
    }
    
    this.adaptiveSettings.set(clientId, updated);
    logger.info('Adaptive settings updated', { clientId, changes: Object.keys(updated) });
  }

  /**
   * Register custom client configuration
   */
  registerClient(clientConfig) {
    const validation = this.validator.validate(clientConfig);
    if (!validation.valid) {
      throw new Error(`Invalid client configuration: ${validation.errors.join(', ')}`);
    }
    
    this.configs.set(validation.config.id, validation.config);
    logger.info('Custom client registered', { 
      clientId: validation.config.id,
      name: validation.config.name 
    });
  }

  /**
   * Get configuration templates for different use cases
   */
  getTemplate(templateType) {
    const templates = {
      minimal: {
        maxToolsPerCall: 3,
        toolComplexity: 'low',
        maxResponseSize: 10000,
        outputFormat: 'minimal',
        errorVerbosity: 'minimal',
        features: { pagination: false, subscriptions: false }
      },
      
      standard: {
        maxToolsPerCall: 10,
        toolComplexity: 'medium',
        maxResponseSize: 50000,
        outputFormat: 'structured',
        errorVerbosity: 'standard',
        features: { pagination: true, subscriptions: false }
      },
      
      advanced: {
        maxToolsPerCall: 20,
        toolComplexity: 'high',
        maxResponseSize: 200000,
        outputFormat: 'developer',
        errorVerbosity: 'detailed',
        includeStackTrace: true,
        features: { pagination: true, subscriptions: true, templates: true, analytics: true }
      },
      
      mobile: {
        maxToolsPerCall: 5,
        toolComplexity: 'medium',
        maxResponseSize: 25000,
        outputFormat: 'concise',
        escapeHandling: 'minimal',
        rateLimit: { requests: 30, window: 60000 }
      },
      
      enterprise: {
        maxToolsPerCall: 30,
        toolComplexity: 'high',
        maxResponseSize: 500000,
        outputFormat: 'developer',
        errorVerbosity: 'debug',
        includeStackTrace: true,
        timeoutMs: 60000,
        retryAttempts: 5,
        features: { pagination: true, subscriptions: true, templates: true, analytics: true }
      }
    };
    
    return templates[templateType] || templates.standard;
  }

  /**
   * Export configuration for client
   */
  exportConfig(clientId) {
    const config = this.getConfig(clientId);
    return {
      exportedAt: new Date().toISOString(),
      clientId,
      config,
      overrides: this.overrides.get(clientId) || {},
      adaptiveSettings: this.adaptiveSettings.get(clientId) || {}
    };
  }

  /**
   * Import configuration from export
   */
  importConfig(exportData) {
    const { clientId, config, overrides, adaptiveSettings } = exportData;
    
    if (config) {
      this.registerClient(config);
    }
    
    if (overrides && Object.keys(overrides).length > 0) {
      this.setOverride(clientId, overrides);
    }
    
    if (adaptiveSettings && Object.keys(adaptiveSettings).length > 0) {
      this.adaptiveSettings.set(clientId, adaptiveSettings);
    }
    
    logger.info('Configuration imported', { clientId });
  }

  /**
   * Merge multiple configuration objects
   */
  mergeConfigs(...configs) {
    const result = {};
    
    for (const config of configs) {
      if (!config) continue;
      
      for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = this.mergeConfigs(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Get statistics about configurations
   */
  getStats() {
    return {
      totalConfigs: this.configs.size,
      totalOverrides: this.overrides.size,
      adaptiveClients: this.adaptiveSettings.size,
      configsByComplexity: this.getComplexityDistribution(),
      mostOverriddenSettings: this.getMostOverriddenSettings()
    };
  }

  getComplexityDistribution() {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    for (const config of this.configs.values()) {
      const complexity = config.toolComplexity || 'medium';
      distribution[complexity]++;
    }
    
    return distribution;
  }

  getMostOverriddenSettings() {
    const settingCounts = {};
    
    for (const override of this.overrides.values()) {
      for (const key of Object.keys(override)) {
        settingCounts[key] = (settingCounts[key] || 0) + 1;
      }
    }
    
    return Object.entries(settingCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }
}

// Global configuration manager instance
export const configManager = new ClientConfigManager();

export default {
  ClientConfigSchema,
  ClientConfigValidator,
  ClientConfigManager,
  configManager
};