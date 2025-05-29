/**
 * Client-Specific Response Formatter
 * Handles different output formats, escape characters, and response structures per client
 */

import { createLogger } from './mcp-logging.js';
import { createToolResponse, createErrorResponse } from './mcp-protocol.js';

const logger = createLogger('response-formatter');

/**
 * Format types for different response structures
 */
export const FormatTypes = {
  JSON: 'json',
  TEXT: 'text',
  MARKDOWN: 'markdown',
  TABLE: 'table',
  LIST: 'list',
  TREE: 'tree'
};

/**
 * Escape handling strategies
 */
export const EscapeStrategies = {
  NONE: 'none',
  MINIMAL: 'minimal',
  STANDARD: 'standard',
  JSON: 'json',
  MARKDOWN: 'markdown'
};

/**
 * Response Formatter with client-specific handling
 */
export class ResponseFormatter {
  constructor(clientContext = null) {
    this.clientContext = clientContext;
    this.formatHandlers = new Map();
    this.escapeHandlers = new Map();
    this.sizeTracking = new Map();
    
    this.initializeHandlers();
  }

  /**
   * Initialize format and escape handlers
   */
  initializeHandlers() {
    // Format handlers
    this.formatHandlers.set(FormatTypes.JSON, this.formatAsJson.bind(this));
    this.formatHandlers.set(FormatTypes.TEXT, this.formatAsText.bind(this));
    this.formatHandlers.set(FormatTypes.MARKDOWN, this.formatAsMarkdown.bind(this));
    this.formatHandlers.set(FormatTypes.TABLE, this.formatAsTable.bind(this));
    this.formatHandlers.set(FormatTypes.LIST, this.formatAsList.bind(this));
    this.formatHandlers.set(FormatTypes.TREE, this.formatAsTree.bind(this));

    // Escape handlers
    this.escapeHandlers.set(EscapeStrategies.NONE, text => text);
    this.escapeHandlers.set(EscapeStrategies.MINIMAL, this.escapeMinimal.bind(this));
    this.escapeHandlers.set(EscapeStrategies.STANDARD, this.escapeStandard.bind(this));
    this.escapeHandlers.set(EscapeStrategies.JSON, this.escapeJson.bind(this));
    this.escapeHandlers.set(EscapeStrategies.MARKDOWN, this.escapeMarkdown.bind(this));
  }

  /**
   * Main format method with client adaptation
   */
  format(data, options = {}) {
    try {
      const {
        type = this.getDefaultFormatType(),
        escapeStrategy = this.getDefaultEscapeStrategy(),
        maxSize = this.getMaxResponseSize(),
        includeMetadata = this.shouldIncludeMetadata(),
        preserveStructure = this.shouldPreserveStructure()
      } = options;

      // Pre-process data
      let processedData = this.preprocessData(data, preserveStructure);
      
      // Apply format
      const formatHandler = this.formatHandlers.get(type);
      if (!formatHandler) {
        logger.warn('Unknown format type, using text', { type });
        processedData = this.formatAsText(processedData);
      } else {
        processedData = formatHandler(processedData);
      }

      // Apply escape handling
      const escapeHandler = this.escapeHandlers.get(escapeStrategy);
      if (escapeHandler) {
        processedData = escapeHandler(processedData);
      }

      // Apply size limits
      processedData = this.applySizeLimit(processedData, maxSize);

      // Add metadata if requested
      if (includeMetadata) {
        processedData = this.addMetadata(processedData, data, options);
      }

      // Track response size
      this.trackResponseSize(processedData);

      return createToolResponse(processedData);
    } catch (error) {
      logger.error('Response formatting failed', { error: error.message });
      return createErrorResponse(error);
    }
  }

  /**
   * Format error responses with client adaptation
   */
  formatError(error, options = {}) {
    const clientErrorFormat = this.getClientErrorFormat();
    
    let formattedError;
    switch (clientErrorFormat) {
      case 'minimal':
        formattedError = { error: error.message };
        break;
      case 'detailed':
        formattedError = {
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString(),
          stack: error.stack?.split('\n').slice(0, 10) // Limit stack trace
        };
        break;
      case 'developer':
        formattedError = {
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString(),
          stack: error.stack,
          context: error.context || {},
          client: this.clientContext?.client?.name
        };
        break;
      default:
        formattedError = {
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        };
    }

    return this.format(formattedError, { ...options, type: FormatTypes.JSON });
  }

  /**
   * Format financial data with appropriate precision
   */
  formatFinancialData(data, options = {}) {
    const { currency = 'USD', precision = 2 } = options;
    
    const formatCurrency = (amount) => {
      if (typeof amount !== 'number') return amount;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(amount);
    };

    const processFinancialObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const processed = { ...obj };
      const monetaryFields = ['amount', 'balance', 'value', 'total', 'sum', 'price'];
      
      for (const field of monetaryFields) {
        if (processed[field] !== undefined) {
          processed[field] = formatCurrency(processed[field]);
        }
      }
      
      return processed;
    };

    if (Array.isArray(data)) {
      data = data.map(processFinancialObject);
    } else if (typeof data === 'object' && data !== null) {
      data = processFinancialObject(data);
    }

    return this.format(data, options);
  }

  /**
   * Preprocess data based on client requirements
   */
  preprocessData(data, preserveStructure) {
    if (!this.clientContext) return data;

    const complexity = this.clientContext.capabilities.toolComplexity;
    
    if (complexity === 'low' && !preserveStructure) {
      return this.simplifyData(data);
    }
    
    if (complexity === 'high') {
      return this.enrichData(data);
    }
    
    return data;
  }

  /**
   * Simplify data for low-complexity clients
   */
  simplifyData(data) {
    if (Array.isArray(data)) {
      return data.slice(0, 10).map(item => this.extractEssentialFields(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.extractEssentialFields(data);
    }
    
    return data;
  }

  /**
   * Enrich data for high-complexity clients
   */
  enrichData(data) {
    if (Array.isArray(data)) {
      return {
        items: data,
        count: data.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          client: this.clientContext.client.name
        }
      };
    }
    
    if (typeof data === 'object' && data !== null) {
      return {
        ...data,
        _metadata: {
          generatedAt: new Date().toISOString(),
          client: this.clientContext.client.name,
          responseType: 'enriched'
        }
      };
    }
    
    return data;
  }

  /**
   * Extract essential fields for simplified output
   */
  extractEssentialFields(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const essential = {};
    const essentialFields = [
      'id', 'name', 'title', 'type', 'status', 'amount', 'balance',
      'currency', 'description', 'createdAt', 'updatedAt'
    ];
    
    for (const field of essentialFields) {
      if (obj[field] !== undefined) {
        essential[field] = obj[field];
      }
    }
    
    return Object.keys(essential).length > 0 ? essential : obj;
  }

  // Format handlers
  formatAsJson(data) {
    return JSON.stringify(data, null, this.getJsonIndentation());
  }

  formatAsText(data) {
    if (typeof data === 'string') return data;
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    return String(data);
  }

  formatAsMarkdown(data) {
    if (typeof data === 'string') return data;
    
    if (Array.isArray(data)) {
      return this.arrayToMarkdown(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.objectToMarkdown(data);
    }
    
    return `\`\`\`\n${String(data)}\n\`\`\``;
  }

  formatAsTable(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return this.formatAsText(data);
    }

    const headers = Object.keys(data[0] || {});
    if (headers.length === 0) return this.formatAsText(data);

    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    for (const row of data.slice(0, 50)) { // Limit rows
      const values = headers.map(h => String(row[h] || '').replace(/\|/g, '\\|'));
      table += '| ' + values.join(' | ') + ' |\n';
    }
    
    return table;
  }

  formatAsList(data) {
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        const summary = this.summarizeItem(item);
        return `${index + 1}. ${summary}`;
      }).join('\n');
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => {
        return `• ${key}: ${this.summarizeValue(value)}`;
      }).join('\n');
    }
    
    return String(data);
  }

  formatAsTree(data) {
    return this.buildTree(data, 0);
  }

  // Escape handlers
  escapeMinimal(text) {
    return text.replace(/["\\]/g, '\\$&');
  }

  escapeStandard(text) {
    return text.replace(/["\\\n\r\t]/g, match => {
      const escapes = { '"': '\\"', '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
      return escapes[match] || match;
    });
  }

  escapeJson(text) {
    return JSON.stringify(text);
  }

  escapeMarkdown(text) {
    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
  }

  // Helper methods
  arrayToMarkdown(arr) {
    if (arr.length === 0) return '*No items*';
    
    let md = `## Results (${arr.length} items)\n\n`;
    
    arr.slice(0, 20).forEach((item, index) => {
      md += `### ${index + 1}. ${this.getItemTitle(item)}\n\n`;
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          md += `- **${key}**: ${this.summarizeValue(value)}\n`;
        });
      } else {
        md += `${String(item)}\n`;
      }
      md += '\n';
    });
    
    if (arr.length > 20) {
      md += `*... and ${arr.length - 20} more items*\n`;
    }
    
    return md;
  }

  objectToMarkdown(obj) {
    let md = '## Object Details\n\n';
    
    Object.entries(obj).forEach(([key, value]) => {
      md += `### ${key}\n\n`;
      if (Array.isArray(value)) {
        md += `*Array with ${value.length} items*\n\n`;
        value.slice(0, 5).forEach((item, index) => {
          md += `${index + 1}. ${this.summarizeValue(item)}\n`;
        });
        if (value.length > 5) md += `... and ${value.length - 5} more\n`;
      } else if (typeof value === 'object' && value !== null) {
        md += '```json\n' + JSON.stringify(value, null, 2) + '\n```\n';
      } else {
        md += `${String(value)}\n`;
      }
      md += '\n';
    });
    
    return md;
  }

  buildTree(data, depth = 0) {
    const indent = '  '.repeat(depth);
    
    if (Array.isArray(data)) {
      let tree = `${indent}[\n`;
      data.slice(0, 10).forEach((item, index) => {
        tree += `${indent}  ${index}: `;
        if (typeof item === 'object') {
          tree += '\n' + this.buildTree(item, depth + 2);
        } else {
          tree += `${this.summarizeValue(item)}\n`;
        }
      });
      if (data.length > 10) {
        tree += `${indent}  ... (${data.length - 10} more items)\n`;
      }
      tree += `${indent}]\n`;
      return tree;
    }
    
    if (typeof data === 'object' && data !== null) {
      let tree = `${indent}{\n`;
      Object.entries(data).forEach(([key, value]) => {
        tree += `${indent}  ${key}: `;
        if (typeof value === 'object') {
          tree += '\n' + this.buildTree(value, depth + 2);
        } else {
          tree += `${this.summarizeValue(value)}\n`;
        }
      });
      tree += `${indent}}\n`;
      return tree;
    }
    
    return `${indent}${String(data)}\n`;
  }

  getItemTitle(item) {
    if (typeof item !== 'object' || item === null) return String(item);
    return item.name || item.title || item.id || 'Item';
  }

  summarizeItem(item) {
    if (typeof item !== 'object' || item === null) return String(item);
    
    const id = item.id || item.name || item.title;
    const type = item.type || '';
    const status = item.status || '';
    
    return `${id || 'Item'}${type ? ` (${type})` : ''}${status ? ` - ${status}` : ''}`;
  }

  summarizeValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value.length > 50 ? value.substring(0, 47) + '...' : value;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object(${Object.keys(value).length} keys)`;
    return String(value);
  }

  applySizeLimit(text, maxSize) {
    if (typeof text !== 'string' || text.length <= maxSize) return text;
    
    const truncated = text.substring(0, maxSize - 100);
    const lastNewline = truncated.lastIndexOf('\n');
    const cutoff = lastNewline > maxSize * 0.8 ? lastNewline : truncated.length;
    
    return truncated.substring(0, cutoff) + '\n\n[Response truncated due to size limits]';
  }

  addMetadata(data, originalData, options) {
    if (typeof data !== 'string') return data;
    
    const metadata = {
      client: this.clientContext?.client?.name || 'unknown',
      format: options.type || 'text',
      size: data.length,
      generatedAt: new Date().toISOString()
    };
    
    return data + '\n\n---\n' + JSON.stringify(metadata, null, 2);
  }

  trackResponseSize(data) {
    if (!this.clientContext) return;
    
    const size = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    const clientId = this.clientContext.client.id;
    
    if (!this.sizeTracking.has(clientId)) {
      this.sizeTracking.set(clientId, { total: 0, count: 0, max: 0, avg: 0 });
    }
    
    const stats = this.sizeTracking.get(clientId);
    stats.total += size;
    stats.count++;
    stats.max = Math.max(stats.max, size);
    stats.avg = stats.total / stats.count;
    
    logger.debug('Response size tracked', { 
      client: clientId, 
      size, 
      avgSize: Math.round(stats.avg) 
    });
  }

  // Client-specific getters
  getDefaultFormatType() {
    if (!this.clientContext) return FormatTypes.JSON;
    
    const outputFormat = this.clientContext.capabilities.outputFormat;
    switch (outputFormat) {
      case 'minimal': return FormatTypes.TEXT;
      case 'concise': return FormatTypes.LIST;
      case 'developer': return FormatTypes.JSON;
      default: return FormatTypes.JSON;
    }
  }

  getDefaultEscapeStrategy() {
    if (!this.clientContext) return EscapeStrategies.STANDARD;
    return this.clientContext.capabilities.escapeHandling || EscapeStrategies.STANDARD;
  }

  getMaxResponseSize() {
    return this.clientContext?.capabilities.maxResponseSize || 50000;
  }

  shouldIncludeMetadata() {
    return this.clientContext?.capabilities.outputFormat === 'developer';
  }

  shouldPreserveStructure() {
    return this.clientContext?.capabilities.toolComplexity === 'high';
  }

  getJsonIndentation() {
    if (!this.clientContext) return 2;
    
    const complexity = this.clientContext.capabilities.toolComplexity;
    switch (complexity) {
      case 'low': return 0;
      case 'medium': return 2;
      case 'high': return 2;
      default: return 2;
    }
  }

  getClientErrorFormat() {
    if (!this.clientContext) return 'standard';
    
    const format = this.clientContext.capabilities.outputFormat;
    switch (format) {
      case 'minimal': return 'minimal';
      case 'developer': return 'developer';
      default: return 'detailed';
    }
  }

  /**
   * Get size tracking statistics
   */
  getSizeStats() {
    return Object.fromEntries(this.sizeTracking.entries());
  }
}

export default {
  ResponseFormatter,
  FormatTypes,
  EscapeStrategies
};