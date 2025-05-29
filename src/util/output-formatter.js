/**
 * MCP Output Formatting System
 * 
 * This module provides sophisticated output formatting for different MCP clients,
 * handling escape characters, markdown rendering, JSON formatting, and 
 * client-specific requirements to ensure optimal display across:
 * - Claude Desktop
 * - Cursor
 * - VS Code with MCP extension
 * - Claude CLI
 * - Web-based clients
 * - Terminal-based clients
 */

import { createLogger } from './mcp-logging.js';

const logger = createLogger('output-formatter');

// Client type detection and configuration
export const ClientType = {
  CLAUDE_DESKTOP: 'claude-desktop',
  CLAUDE_CLI: 'claude-cli',
  CURSOR: 'cursor',
  VSCODE: 'vscode',
  WEB_CLIENT: 'web',
  TERMINAL: 'terminal',
  UNKNOWN: 'unknown'
};

// Client capability matrix
const CLIENT_CAPABILITIES = {
  [ClientType.CLAUDE_DESKTOP]: {
    supportsMarkdown: true,
    supportsCodeBlocks: true,
    supportsUnicode: true,
    supportsEmojis: true,
    maxResponseLength: 50000,
    preferredCodeBlockStyle: 'fenced',
    escapeSequences: {
      backtick: '\\`',
      backslash: '\\\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 2,
      maxDepth: 10,
      arrayItemLimit: 100
    }
  },
  [ClientType.CLAUDE_CLI]: {
    supportsMarkdown: false,
    supportsCodeBlocks: false,
    supportsUnicode: true,
    supportsEmojis: false,
    maxResponseLength: 8000,
    preferredCodeBlockStyle: 'none',
    escapeSequences: {
      backtick: '`',
      backslash: '\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 0,
      maxDepth: 5,
      arrayItemLimit: 50
    }
  },
  [ClientType.CURSOR]: {
    supportsMarkdown: true,
    supportsCodeBlocks: true,
    supportsUnicode: true,
    supportsEmojis: true,
    maxResponseLength: 100000,
    preferredCodeBlockStyle: 'fenced',
    escapeSequences: {
      backtick: '\\`',
      backslash: '\\\\',
      newline: '\n',
      tab: '    '
    },
    jsonFormatting: {
      indent: 2,
      maxDepth: 15,
      arrayItemLimit: 200
    }
  },
  [ClientType.VSCODE]: {
    supportsMarkdown: true,
    supportsCodeBlocks: true,
    supportsUnicode: true,
    supportsEmojis: true,
    maxResponseLength: 75000,
    preferredCodeBlockStyle: 'fenced',
    escapeSequences: {
      backtick: '\\`',
      backslash: '\\\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 2,
      maxDepth: 12,
      arrayItemLimit: 150
    }
  },
  [ClientType.WEB_CLIENT]: {
    supportsMarkdown: true,
    supportsCodeBlocks: true,
    supportsUnicode: true,
    supportsEmojis: true,
    maxResponseLength: 200000,
    preferredCodeBlockStyle: 'fenced',
    escapeSequences: {
      backtick: '\\`',
      backslash: '\\\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 2,
      maxDepth: 20,
      arrayItemLimit: 500
    }
  },
  [ClientType.TERMINAL]: {
    supportsMarkdown: false,
    supportsCodeBlocks: false,
    supportsUnicode: false,
    supportsEmojis: false,
    maxResponseLength: 4000,
    preferredCodeBlockStyle: 'none',
    escapeSequences: {
      backtick: '`',
      backslash: '\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 0,
      maxDepth: 3,
      arrayItemLimit: 25
    }
  },
  [ClientType.UNKNOWN]: {
    supportsMarkdown: false,
    supportsCodeBlocks: false,
    supportsUnicode: false,
    supportsEmojis: false,
    maxResponseLength: 2000,
    preferredCodeBlockStyle: 'none',
    escapeSequences: {
      backtick: '`',
      backslash: '\\',
      newline: '\n',
      tab: '  '
    },
    jsonFormatting: {
      indent: 0,
      maxDepth: 2,
      arrayItemLimit: 10
    }
  }
};

// Content type definitions
export const ContentType = {
  TEXT: 'text',
  JSON: 'json',
  CODE: 'code',
  MARKDOWN: 'markdown',
  TABLE: 'table',
  LIST: 'list',
  ERROR: 'error'
};

/**
 * Detect client type from MCP context
 * @param {Object} extra - MCP extra context
 * @returns {string} Detected client type
 */
export function detectClientType(extra = {}) {
  try {
    // Check for explicit client identification
    if (extra.clientInfo?.name) {
      const clientName = extra.clientInfo.name.toLowerCase();
      
      if (clientName.includes('claude') && clientName.includes('desktop')) {
        return ClientType.CLAUDE_DESKTOP;
      }
      if (clientName.includes('claude') && clientName.includes('cli')) {
        return ClientType.CLAUDE_CLI;
      }
      if (clientName.includes('cursor')) {
        return ClientType.CURSOR;
      }
      if (clientName.includes('vscode') || clientName.includes('vs code')) {
        return ClientType.VSCODE;
      }
      if (clientName.includes('web') || clientName.includes('browser')) {
        return ClientType.WEB_CLIENT;
      }
      if (clientName.includes('terminal') || clientName.includes('console')) {
        return ClientType.TERMINAL;
      }
    }

    // Check user agent patterns
    const userAgent = extra.userAgent || extra.clientInfo?.userAgent || '';
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('claude')) return ClientType.CLAUDE_DESKTOP;
      if (ua.includes('cursor')) return ClientType.CURSOR;
      if (ua.includes('vscode')) return ClientType.VSCODE;
      if (ua.includes('electron')) return ClientType.CLAUDE_DESKTOP;
    }

    // Fallback detection based on capabilities
    if (extra.capabilities) {
      const caps = extra.capabilities;
      if (caps.markdown && caps.codeBlocks && caps.unicode) {
        return ClientType.WEB_CLIENT; // Assume web for full capabilities
      }
      if (!caps.markdown && !caps.codeBlocks) {
        return ClientType.TERMINAL;
      }
    }

    logger.debug('Could not detect client type, using unknown', { extra });
    return ClientType.UNKNOWN;
  } catch (error) {
    logger.warning('Error detecting client type', { error: error.message, extra });
    return ClientType.UNKNOWN;
  }
}

/**
 * Get client capabilities for a given client type
 * @param {string} clientType - Client type
 * @returns {Object} Client capabilities
 */
export function getClientCapabilities(clientType) {
  return CLIENT_CAPABILITIES[clientType] || CLIENT_CAPABILITIES[ClientType.UNKNOWN];
}

/**
 * Escape special characters for a specific client
 * @param {string} text - Text to escape
 * @param {string} clientType - Target client type
 * @returns {string} Escaped text
 */
export function escapeForClient(text, clientType) {
  if (!text || typeof text !== 'string') return text;
  
  const capabilities = getClientCapabilities(clientType);
  const escapes = capabilities.escapeSequences;
  
  let escaped = text;
  
  // Apply client-specific escaping
  if (capabilities.supportsMarkdown) {
    // Escape markdown special characters
    escaped = escaped
      .replace(/\\/g, escapes.backslash)
      .replace(/`/g, escapes.backtick)
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  } else {
    // Minimal escaping for non-markdown clients
    escaped = escaped
      .replace(/\\/g, escapes.backslash)
      .replace(/`/g, escapes.backtick);
  }
  
  // Handle unicode for clients that don't support it
  if (!capabilities.supportsUnicode) {
    escaped = escaped.replace(/[^\x00-\x7F]/g, '?');
  }
  
  // Remove emojis for clients that don't support them
  if (!capabilities.supportsEmojis) {
    escaped = escaped.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }
  
  return escaped;
}

/**
 * Format JSON for a specific client
 * @param {any} data - Data to format as JSON
 * @param {string} clientType - Target client type
 * @returns {string} Formatted JSON
 */
export function formatJsonForClient(data, clientType) {
  const capabilities = getClientCapabilities(clientType);
  const jsonConfig = capabilities.jsonFormatting;
  
  try {
    // Truncate large objects/arrays based on client limits
    const truncated = truncateData(data, jsonConfig.maxDepth, jsonConfig.arrayItemLimit);
    
    // Format with appropriate indentation
    const formatted = JSON.stringify(truncated, null, jsonConfig.indent);
    
    // Escape the JSON string for the client
    return escapeForClient(formatted, clientType);
  } catch (error) {
    logger.error('Failed to format JSON', { error: error.message, clientType });
    return escapeForClient(String(data), clientType);
  }
}

/**
 * Format code block for a specific client
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @param {string} clientType - Target client type
 * @returns {string} Formatted code block
 */
export function formatCodeBlockForClient(code, language, clientType) {
  const capabilities = getClientCapabilities(clientType);
  
  if (!capabilities.supportsCodeBlocks) {
    // For clients without code block support, just indent
    const indented = code.split('\n')
      .map(line => capabilities.escapeSequences.tab + line)
      .join('\n');
    return escapeForClient(indented, clientType);
  }
  
  // Use fenced code blocks for supporting clients
  const fence = '```';
  const languageTag = language || '';
  
  return `${fence}${languageTag}\n${code}\n${fence}`;
}

/**
 * Format table for a specific client
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @param {string} clientType - Target client type
 * @returns {string} Formatted table
 */
export function formatTableForClient(headers, rows, clientType) {
  const capabilities = getClientCapabilities(clientType);
  
  if (!capabilities.supportsMarkdown) {
    // ASCII table format for non-markdown clients
    return formatAsciiTable(headers, rows, clientType);
  }
  
  // Markdown table format
  let table = '';
  
  // Headers
  table += '| ' + headers.map(h => escapeForClient(String(h), clientType)).join(' | ') + ' |\n';
  
  // Separator
  table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // Rows
  for (const row of rows) {
    table += '| ' + row.map(cell => escapeForClient(String(cell), clientType)).join(' | ') + ' |\n';
  }
  
  return table;
}

/**
 * Format ASCII table for non-markdown clients
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @param {string} clientType - Target client type
 * @returns {string} ASCII table
 */
function formatAsciiTable(headers, rows, clientType) {
  const capabilities = getClientCapabilities(clientType);
  const tab = capabilities.escapeSequences.tab;
  
  // Calculate column widths
  const allData = [headers, ...rows];
  const colWidths = headers.map((_, i) => 
    Math.max(...allData.map(row => String(row[i] || '').length))
  );
  
  let table = '';
  
  // Headers
  table += headers.map((header, i) => 
    String(header).padEnd(colWidths[i])
  ).join(tab) + '\n';
  
  // Separator
  table += colWidths.map(width => '-'.repeat(width)).join(tab) + '\n';
  
  // Rows
  for (const row of rows) {
    table += row.map((cell, i) => 
      String(cell || '').padEnd(colWidths[i])
    ).join(tab) + '\n';
  }
  
  return escapeForClient(table, clientType);
}

/**
 * Truncate data based on depth and array limits
 * @param {any} data - Data to truncate
 * @param {number} maxDepth - Maximum object depth
 * @param {number} arrayLimit - Maximum array items
 * @param {number} currentDepth - Current recursion depth
 * @returns {any} Truncated data
 */
function truncateData(data, maxDepth, arrayLimit, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return '[Object too deep]';
  }
  
  if (Array.isArray(data)) {
    const truncated = data.slice(0, arrayLimit);
    if (data.length > arrayLimit) {
      truncated.push(`[... ${data.length - arrayLimit} more items]`);
    }
    return truncated.map(item => truncateData(item, maxDepth, arrayLimit, currentDepth + 1));
  }
  
  if (data && typeof data === 'object') {
    const truncated = {};
    let count = 0;
    const maxKeys = arrayLimit;
    
    for (const [key, value] of Object.entries(data)) {
      if (count >= maxKeys) {
        truncated['[...]'] = `${Object.keys(data).length - maxKeys} more properties`;
        break;
      }
      truncated[key] = truncateData(value, maxDepth, arrayLimit, currentDepth + 1);
      count++;
    }
    
    return truncated;
  }
  
  return data;
}

/**
 * Truncate text to client length limits
 * @param {string} text - Text to truncate
 * @param {string} clientType - Target client type
 * @returns {string} Truncated text
 */
export function truncateToClientLimit(text, clientType) {
  const capabilities = getClientCapabilities(clientType);
  const maxLength = capabilities.maxResponseLength;
  
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.slice(0, maxLength - 50); // Leave room for truncation message
  return truncated + '\n\n[Response truncated to fit client limits]';
}