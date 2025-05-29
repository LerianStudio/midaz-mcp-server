/**
 * MCP Client Adaptation Middleware
 * Adapts server behavior, tool exposure, and responses based on detected client capabilities
 */

import { createLogger } from './mcp-logging.js';
import { createToolResponse, createErrorResponse, createPaginatedResponse } from './mcp-protocol.js';

const logger = createLogger('client-adaptation');

/**
 * Tool complexity levels for filtering
 */
export const ToolComplexity = {
  LOW: 'low',       // Simple tools with minimal parameters
  MEDIUM: 'medium', // Standard tools with moderate complexity
  HIGH: 'high'      // Complex tools with many parameters or advanced features
};

/**
 * Response formatting strategies
 */
export const ResponseFormats = {
  MINIMAL: 'minimal',     // Bare minimum output
  CONCISE: 'concise',     // Brief but complete
  STRUCTURED: 'structured', // Well-formatted with sections
  DEVELOPER: 'developer'   // Technical details and debugging info
};

/**
 * Client Adaptation Manager
 */
export class ClientAdaptationManager {
  constructor() {
    this.clientContext = null;
    this.toolRegistry = new Map();
    this.adaptationRules = new Map();
    this.behaviorTracker = new Map();
  }

  /**
   * Set the current client context
   */
  setClientContext(clientContext) {
    this.clientContext = clientContext;
    logger.info('Client context set', { 
      client: clientContext.client.name,
      sessionId: clientContext.sessionId
    });
  }

  /**
   * Register a tool with complexity metadata
   */
  registerTool(toolName, toolDefinition, complexity = ToolComplexity.MEDIUM) {
    this.toolRegistry.set(toolName, {
      definition: toolDefinition,
      complexity,
      usage: { calls: 0, errors: 0, avgDuration: 0 }
    });
  }

  /**
   * Get filtered tools based on client capabilities
   */
  getFilteredTools() {
    if (!this.clientContext) {
      return Array.from(this.toolRegistry.values()).map(t => t.definition);
    }

    const filteredTools = [];
    const maxTools = this.clientContext.getCapability('maxToolsPerCall', 10);

    for (const [toolName, toolInfo] of this.toolRegistry) {
      // Filter by complexity
      if (!this.clientContext.supportsToolComplexity(toolInfo.complexity)) {
        logger.debug('Tool filtered by complexity', { 
          tool: toolName, 
          complexity: toolInfo.complexity,
          clientComplexity: this.clientContext.capabilities.toolComplexity
        });
        continue;
      }

      // Filter tools that require binary content
      if (toolInfo.definition.requiresBinaryContent && 
          !this.clientContext.supports('supportsBinaryContent')) {
        logger.debug('Tool filtered by binary content requirement', { tool: toolName });
        continue;
      }

      // Filter tools that require image support
      if (toolInfo.definition.requiresImages && 
          !this.clientContext.supports('supportsImages')) {
        logger.debug('Tool filtered by image requirement', { tool: toolName });
        continue;
      }

      filteredTools.push(toolInfo.definition);

      // Respect max tools limit
      if (filteredTools.length >= maxTools) {
        logger.debug('Reached max tools limit', { 
          limit: maxTools,
          client: this.clientContext.client.id
        });
        break;
      }
    }

    logger.info('Tools filtered for client', {
      client: this.clientContext.client.id,
      totalTools: this.toolRegistry.size,
      filteredTools: filteredTools.length
    });

    return filteredTools;
  }

  /**
   * Adapt tool parameters based on client limitations
   */
  adaptToolParameters(toolName, parameters) {
    if (!this.clientContext) return parameters;

    const toolInfo = this.toolRegistry.get(toolName);
    if (!toolInfo) return parameters;

    let adaptedParams = { ...parameters };

    // Limit pagination size
    if (adaptedParams.limit) {
      const maxLimit = this.getMaxPaginationLimit();
      if (adaptedParams.limit > maxLimit) {
        adaptedParams.limit = maxLimit;
        logger.debug('Pagination limit adapted', { 
          tool: toolName,
          original: parameters.limit,
          adapted: maxLimit
        });
      }
    }

    // Simplify complex parameters for low-capability clients
    if (this.clientContext.capabilities.toolComplexity === ToolComplexity.LOW) {
      adaptedParams = this.simplifyParameters(adaptedParams);
    }

    return adaptedParams;
  }

  /**
   * Format response based on client preferences
   */
  formatResponse(data, toolName = null, isError = false) {
    if (!this.clientContext) {
      return createToolResponse(data);
    }

    const format = this.clientContext.getCapability('outputFormat', ResponseFormats.STRUCTURED);
    const maxSize = this.clientContext.getCapability('maxResponseSize', 50000);
    const escapeHandling = this.clientContext.getCapability('escapeHandling', 'standard');

    try {
      let formattedData = this.applyOutputFormat(data, format, toolName);
      formattedData = this.applyEscapeHandling(formattedData, escapeHandling);
      formattedData = this.limitResponseSize(formattedData, maxSize);

      if (isError) {
        return createErrorResponse(formattedData);
      }

      return createToolResponse(formattedData);
    } catch (error) {
      logger.error('Response formatting failed', { 
        error: error.message,
        toolName,
        format 
      });
      return createToolResponse(data); // Fallback to original
    }
  }

  /**
   * Apply output format transformation
   */
  applyOutputFormat(data, format, toolName) {
    switch (format) {
      case ResponseFormats.MINIMAL:
        return this.formatMinimal(data);
      
      case ResponseFormats.CONCISE:
        return this.formatConcise(data);
      
      case ResponseFormats.DEVELOPER:
        return this.formatDeveloper(data, toolName);
      
      case ResponseFormats.STRUCTURED:
      default:
        return this.formatStructured(data);
    }
  }

  /**
   * Minimal formatting - essential data only
   */
  formatMinimal(data) {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map(item => this.extractEssential(item));
    if (typeof data === 'object' && data !== null) {
      return this.extractEssential(data);
    }
    return data;
  }

  /**
   * Concise formatting - brief but complete
   */
  formatConcise(data) {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.length > 10 ? 
        `${data.slice(0, 10).map(item => this.summarizeItem(item)).join('\n')}\n... (${data.length - 10} more)` :
        data.map(item => this.summarizeItem(item)).join('\n');
    }
    return this.summarizeItem(data);
  }

  /**
   * Developer formatting - technical details
   */
  formatDeveloper(data, toolName) {
    const timestamp = new Date().toISOString();
    const clientInfo = this.clientContext?.client?.name || 'Unknown';
    
    let output = `=== ${toolName || 'Response'} ===\n`;
    output += `Client: ${clientInfo} | Time: ${timestamp}\n\n`;
    
    if (typeof data === 'object') {
      output += JSON.stringify(data, null, 2);
    } else {
      output += String(data);
    }
    
    return output;
  }

  /**
   * Structured formatting - well-organized output
   */
  formatStructured(data) {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return {
        type: 'list',
        count: data.length,
        items: data
      };
    }
    if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        data
      };
    }
    return data;
  }

  /**
   * Apply escape character handling
   */
  applyEscapeHandling(data, escapeType) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    
    switch (escapeType) {
      case 'minimal':
        return text.replace(/["\\]/g, '\\$&'); // Only escape quotes and backslashes
      
      case 'json':
        return JSON.stringify(text); // Full JSON escaping
      
      case 'standard':
      default:
        return text.replace(/["\\\n\r\t]/g, match => {
          const escapes = { '"': '\\"', '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
          return escapes[match] || match;
        });
    }
  }

  /**
   * Limit response size with truncation
   */
  limitResponseSize(data, maxSize) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (text.length <= maxSize) return data;

    const truncated = text.substring(0, maxSize - 100);
    const lastNewline = truncated.lastIndexOf('\n');
    const cutoff = lastNewline > maxSize * 0.8 ? lastNewline : truncated.length;
    
    return truncated.substring(0, cutoff) + '\n\n[Response truncated - see full data with higher limits]';
  }

  /**
   * Get maximum pagination limit for client
   */
  getMaxPaginationLimit() {
    if (!this.clientContext) return 50;
    
    const complexity = this.clientContext.capabilities.toolComplexity;
    switch (complexity) {
      case ToolComplexity.LOW: return 10;
      case ToolComplexity.MEDIUM: return 25;
      case ToolComplexity.HIGH: return 100;
      default: return 50;
    }
  }

  /**
   * Simplify parameters for low-capability clients
   */
  simplifyParameters(params) {
    const simplified = {};
    
    // Keep only essential parameters
    const essentialParams = ['id', 'name', 'type', 'limit', 'offset'];
    for (const key of essentialParams) {
      if (params[key] !== undefined) {
        simplified[key] = params[key];
      }
    }
    
    return simplified;
  }

  /**
   * Extract essential data for minimal formatting
   */
  extractEssential(item) {
    if (typeof item !== 'object' || item === null) return item;
    
    const essential = {};
    const essentialFields = ['id', 'name', 'title', 'status', 'type', 'amount', 'balance'];
    
    for (const field of essentialFields) {
      if (item[field] !== undefined) {
        essential[field] = item[field];
      }
    }
    
    return Object.keys(essential).length > 0 ? essential : item;
  }

  /**
   * Summarize item for concise formatting
   */
  summarizeItem(item) {
    if (typeof item !== 'object' || item === null) return String(item);
    
    const id = item.id || item.name || item.title || 'unknown';
    const type = item.type || '';
    const status = item.status || '';
    
    return `${id}${type ? ` (${type})` : ''}${status ? ` - ${status}` : ''}`;
  }

  /**
   * Track tool usage for adaptive behavior
   */
  trackToolUsage(toolName, success, duration) {
    const toolInfo = this.toolRegistry.get(toolName);
    if (!toolInfo) return;

    toolInfo.usage.calls++;
    if (!success) toolInfo.usage.errors++;
    
    // Update average duration
    const currentAvg = toolInfo.usage.avgDuration;
    const callCount = toolInfo.usage.calls;
    toolInfo.usage.avgDuration = ((currentAvg * (callCount - 1)) + duration) / callCount;
  }

  /**
   * Get adaptation statistics
   */
  getAdaptationStats() {
    if (!this.clientContext) return null;

    const stats = {
      client: this.clientContext.client.name,
      sessionId: this.clientContext.sessionId,
      detectionMethod: this.clientContext.detectionMethod,
      capabilities: this.clientContext.capabilities,
      tools: {
        total: this.toolRegistry.size,
        filtered: this.getFilteredTools().length,
        usage: {}
      }
    };

    for (const [toolName, toolInfo] of this.toolRegistry) {
      stats.tools.usage[toolName] = toolInfo.usage;
    }

    return stats;
  }
}

// Global adaptation manager instance
export const adaptationManager = new ClientAdaptationManager();

/**
 * Middleware wrapper for tools with client adaptation
 */
export function adaptTool(toolName, toolHandler, complexity = ToolComplexity.MEDIUM) {
  return async (params) => {
    const startTime = Date.now();
    let success = true;
    let result;

    try {
      // Adapt parameters
      const adaptedParams = adaptationManager.adaptToolParameters(toolName, params);
      
      // Execute tool
      result = await toolHandler(adaptedParams);
      
      // Format response
      result = adaptationManager.formatResponse(result, toolName, false);
      
    } catch (error) {
      success = false;
      result = adaptationManager.formatResponse(error, toolName, true);
      throw error;
    } finally {
      // Track usage
      const duration = Date.now() - startTime;
      adaptationManager.trackToolUsage(toolName, success, duration);
    }

    return result;
  };
}

/**
 * Register adaptation rule
 */
export function registerAdaptationRule(clientId, rule) {
  if (!adaptationManager.adaptationRules.has(clientId)) {
    adaptationManager.adaptationRules.set(clientId, []);
  }
  adaptationManager.adaptationRules.get(clientId).push(rule);
}

export default {
  ClientAdaptationManager,
  adaptationManager,
  adaptTool,
  ToolComplexity,
  ResponseFormats,
  registerAdaptationRule
};