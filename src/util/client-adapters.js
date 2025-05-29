/**
 * MCP Client Formatting Adapters
 * 
 * This module provides specialized formatting adapters for different MCP clients,
 * each optimized for the specific rendering capabilities and limitations of the client.
 */

import { 
  detectClientType, 
  getClientCapabilities, 
  escapeForClient, 
  formatJsonForClient, 
  formatCodeBlockForClient, 
  formatTableForClient,
  truncateToClientLimit,
  ClientType,
  ContentType 
} from './output-formatter.js';
import { 
  sanitizeText, 
  sanitizeJson, 
  sanitizeCode, 
  sanitizeTable, 
  sanitizeMcpResponse 
} from './output-sanitizer.js';
import { createLogger } from './mcp-logging.js';

const logger = createLogger('client-adapters');

/**
 * Base adapter class for all MCP clients
 */
class BaseClientAdapter {
  constructor(clientType, extra = {}) {
    this.clientType = clientType;
    this.capabilities = getClientCapabilities(clientType);
    this.extra = extra;
  }

  /**
   * Format content based on type and client capabilities
   * @param {any} content - Content to format
   * @param {string} contentType - Type of content
   * @param {Object} options - Formatting options
   * @returns {string} Formatted content
   */
  format(content, contentType = ContentType.TEXT, options = {}) {
    try {
      const sanitized = this.sanitize(content, contentType, options);
      const formatted = this.formatByType(sanitized, contentType, options);
      return this.applyClientLimits(formatted);
    } catch (error) {
      logger.error('Error formatting content', { 
        error: error.message, 
        clientType: this.clientType, 
        contentType 
      });
      return this.formatError('Content formatting failed');
    }
  }

  /**
   * Sanitize content for this client
   * @param {any} content - Content to sanitize
   * @param {string} contentType - Content type
   * @param {Object} options - Sanitization options
   * @returns {any} Sanitized content
   */
  sanitize(content, contentType, options = {}) {
    switch (contentType) {
      case ContentType.TEXT:
        return sanitizeText(content, this.clientType, options);
      case ContentType.JSON:
        return sanitizeJson(content, this.clientType, options);
      case ContentType.CODE:
        return sanitizeCode(content, options.language, this.clientType);
      case ContentType.TABLE:
        return sanitizeTable(content.headers, content.rows, this.clientType);
      default:
        return sanitizeText(String(content), this.clientType, options);
    }
  }

  /**
   * Format content by type
   * @param {any} content - Sanitized content
   * @param {string} contentType - Content type
   * @param {Object} options - Formatting options
   * @returns {string} Formatted content
   */
  formatByType(content, contentType, options = {}) {
    switch (contentType) {
      case ContentType.TEXT:
        return this.formatText(content, options);
      case ContentType.JSON:
        return this.formatJson(content, options);
      case ContentType.CODE:
        return this.formatCode(content, options);
      case ContentType.TABLE:
        return this.formatTable(content, options);
      case ContentType.MARKDOWN:
        return this.formatMarkdown(content, options);
      case ContentType.LIST:
        return this.formatList(content, options);
      case ContentType.ERROR:
        return this.formatError(content, options);
      default:
        return this.formatText(String(content), options);
    }
  }

  formatText(text, options = {}) {
    return escapeForClient(text, this.clientType);
  }

  formatJson(data, options = {}) {
    return formatJsonForClient(data, this.clientType);
  }

  formatCode(code, options = {}) {
    return formatCodeBlockForClient(code, options.language, this.clientType);
  }

  formatTable(tableData, options = {}) {
    return formatTableForClient(tableData.headers, tableData.rows, this.clientType);
  }

  formatMarkdown(markdown, options = {}) {
    return this.capabilities.supportsMarkdown ? 
      escapeForClient(markdown, this.clientType) : 
      this.stripMarkdown(markdown);
  }

  formatList(items, options = {}) {
    const formatted = items.map((item, index) => {
      const prefix = options.ordered ? `${index + 1}. ` : '• ';
      return `${prefix}${escapeForClient(String(item), this.clientType)}`;
    }).join('\n');
    
    return formatted;
  }

  formatError(error, options = {}) {
    const errorText = typeof error === 'object' ? 
      (error.message || JSON.stringify(error)) : 
      String(error);
    
    const prefix = this.capabilities.supportsEmojis ? '❌ Error: ' : 'Error: ';
    return `${prefix}${escapeForClient(errorText, this.clientType)}`;
  }

  stripMarkdown(markdown) {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '[Code block]') // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1]') // Images
      .replace(/^\s*[\*\-\+]\s+/gm, '• ') // Unordered lists
      .replace(/^\s*\d+\.\s+/gm, '• '); // Ordered lists
  }

  applyClientLimits(content) {
    return truncateToClientLimit(content, this.clientType);
  }
}

/**
 * Claude Desktop adapter
 */
class ClaudeDesktopAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.CLAUDE_DESKTOP, extra);
  }

  formatJson(data, options = {}) {
    const json = formatJsonForClient(data, this.clientType);
    return this.capabilities.supportsCodeBlocks ? 
      `\`\`\`json\n${json}\n\`\`\`` : 
      json;
  }

  formatTable(tableData, options = {}) {
    const table = formatTableForClient(tableData.headers, tableData.rows, this.clientType);
    
    // Add some spacing for better readability in Claude Desktop
    return `\n${table}\n`;
  }

  formatError(error, options = {}) {
    const errorText = super.formatError(error, options);
    
    // Claude Desktop can handle rich error formatting
    if (typeof error === 'object' && error.code) {
      return `🚨 **Error ${error.code}**\n\n${errorText}`;
    }
    
    return errorText;
  }
}

/**
 * Claude CLI adapter
 */
class ClaudeCliAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.CLAUDE_CLI, extra);
  }

  formatJson(data, options = {}) {
    // CLI prefers compact JSON
    return JSON.stringify(data, null, 0);
  }

  formatTable(tableData, options = {}) {
    // Use simple ASCII table for CLI
    return formatTableForClient(tableData.headers, tableData.rows, this.clientType);
  }

  formatList(items, options = {}) {
    // Simple list format for CLI
    return items.map((item, index) => {
      const prefix = options.ordered ? `${index + 1}. ` : '- ';
      return `${prefix}${String(item)}`;
    }).join('\n');
  }

  formatError(error, options = {}) {
    // Simple error format for CLI
    const errorText = typeof error === 'object' ? 
      (error.message || JSON.stringify(error, null, 0)) : 
      String(error);
    
    return `ERROR: ${errorText}`;
  }
}

/**
 * Cursor adapter
 */
class CursorAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.CURSOR, extra);
  }

  formatCode(code, options = {}) {
    const formatted = formatCodeBlockForClient(code, options.language, this.clientType);
    
    // Cursor benefits from explicit language tags
    if (options.language && !formatted.includes(options.language)) {
      return `\`\`\`${options.language}\n${code}\n\`\`\``;
    }
    
    return formatted;
  }

  formatJson(data, options = {}) {
    // Cursor can handle detailed JSON with syntax highlighting
    const json = formatJsonForClient(data, this.clientType);
    return `\`\`\`json\n${json}\n\`\`\``;
  }

  formatTable(tableData, options = {}) {
    const table = formatTableForClient(tableData.headers, tableData.rows, this.clientType);
    
    // Add title if provided
    if (options.title) {
      return `### ${options.title}\n\n${table}`;
    }
    
    return table;
  }
}

/**
 * VS Code adapter
 */
class VsCodeAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.VSCODE, extra);
  }

  formatCode(code, options = {}) {
    const formatted = formatCodeBlockForClient(code, options.language, this.clientType);
    
    // VS Code MCP extension may benefit from file context
    if (options.filename) {
      return `**${options.filename}**\n${formatted}`;
    }
    
    return formatted;
  }

  formatTable(tableData, options = {}) {
    const table = formatTableForClient(tableData.headers, tableData.rows, this.clientType);
    
    // VS Code benefits from collapsible sections for large tables
    if (tableData.rows.length > 10) {
      return `<details>\n<summary>Table (${tableData.rows.length} rows)</summary>\n\n${table}\n\n</details>`;
    }
    
    return table;
  }
}

/**
 * Web client adapter
 */
class WebClientAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.WEB_CLIENT, extra);
  }

  formatJson(data, options = {}) {
    const json = formatJsonForClient(data, this.clientType);
    
    // Web clients can handle collapsible JSON
    return `<details>\n<summary>JSON Data</summary>\n\n\`\`\`json\n${json}\n\`\`\`\n\n</details>`;
  }

  formatTable(tableData, options = {}) {
    const table = formatTableForClient(tableData.headers, tableData.rows, this.clientType);
    
    // Web clients can handle enhanced tables
    if (options.sortable) {
      return `<!-- sortable table -->\n${table}`;
    }
    
    return table;
  }
}

/**
 * Terminal adapter
 */
class TerminalAdapter extends BaseClientAdapter {
  constructor(extra = {}) {
    super(ClientType.TERMINAL, extra);
  }

  formatJson(data, options = {}) {
    // Terminal prefers minimal, readable JSON
    return JSON.stringify(data, null, 0);
  }

  formatCode(code, options = {}) {
    // Terminal doesn't support code blocks, so just indent
    return code.split('\n').map(line => `    ${line}`).join('\n');
  }

  formatList(items, options = {}) {
    // Simple terminal-friendly list
    return items.map((item, index) => {
      const prefix = options.ordered ? `${index + 1}. ` : '* ';
      return `${prefix}${String(item)}`;
    }).join('\n');
  }

  formatError(error, options = {}) {
    // Terminal-friendly error format
    const errorText = typeof error === 'object' ? 
      (error.message || JSON.stringify(error, null, 0)) : 
      String(error);
    
    return `ERROR: ${errorText}`;
  }
}

/**
 * Factory function to create appropriate adapter
 * @param {string|Object} clientTypeOrExtra - Client type string or MCP extra object
 * @returns {BaseClientAdapter} Client adapter instance
 */
export function createClientAdapter(clientTypeOrExtra) {
  let clientType;
  let extra = {};

  if (typeof clientTypeOrExtra === 'string') {
    clientType = clientTypeOrExtra;
  } else {
    extra = clientTypeOrExtra || {};
    clientType = detectClientType(extra);
  }

  switch (clientType) {
    case ClientType.CLAUDE_DESKTOP:
      return new ClaudeDesktopAdapter(extra);
    case ClientType.CLAUDE_CLI:
      return new ClaudeCliAdapter(extra);
    case ClientType.CURSOR:
      return new CursorAdapter(extra);
    case ClientType.VSCODE:
      return new VsCodeAdapter(extra);
    case ClientType.WEB_CLIENT:
      return new WebClientAdapter(extra);
    case ClientType.TERMINAL:
      return new TerminalAdapter(extra);
    default:
      logger.warning('Unknown client type, using base adapter', { clientType });
      return new BaseClientAdapter(ClientType.UNKNOWN, extra);
  }
}

/**
 * Enhanced MCP response formatter
 * @param {any} data - Response data
 * @param {string|Object} clientTypeOrExtra - Client type or MCP extra
 * @param {Object} options - Formatting options
 * @returns {Object} MCP-compliant response
 */
export function formatMcpResponse(data, clientTypeOrExtra, options = {}) {
  try {
    const adapter = createClientAdapter(clientTypeOrExtra);
    
    // Determine content type if not specified
    const contentType = options.contentType || inferContentType(data);
    
    // Format the content
    const formattedContent = adapter.format(data, contentType, options);
    
    // Create MCP response structure
    const response = {
      content: [{
        type: "text",
        text: formattedContent,
        mimeType: options.mimeType || 'text/plain'
      }],
      isError: false
    };

    // Add metadata if available
    if (options.metadata) {
      response.metadata = sanitizeMcpResponse(options.metadata, adapter.clientType);
    }

    return response;
  } catch (error) {
    logger.error('Error formatting MCP response', { 
      error: error.message, 
      options 
    });
    
    return {
      content: [{
        type: "text",
        text: "Error: Could not format response properly",
        mimeType: 'text/plain'
      }],
      isError: true
    };
  }
}

/**
 * Infer content type from data
 * @param {any} data - Data to analyze
 * @returns {string} Inferred content type
 */
function inferContentType(data) {
  if (typeof data === 'string') {
    if (data.startsWith('```') || data.includes('\n```')) {
      return ContentType.CODE;
    }
    if (data.startsWith('#') || data.includes('**') || data.includes('*')) {
      return ContentType.MARKDOWN;
    }
    if (data.includes('ERROR:') || data.includes('Error:')) {
      return ContentType.ERROR;
    }
    return ContentType.TEXT;
  }
  
  if (Array.isArray(data)) {
    return ContentType.LIST;
  }
  
  if (data && typeof data === 'object') {
    if (data.headers && data.rows) {
      return ContentType.TABLE;
    }
    return ContentType.JSON;
  }
  
  return ContentType.TEXT;
}

// Export adapter classes for direct use if needed
export {
  BaseClientAdapter,
  ClaudeDesktopAdapter,
  ClaudeCliAdapter,
  CursorAdapter,
  VsCodeAdapter,
  WebClientAdapter,
  TerminalAdapter
};