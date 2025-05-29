/**
 * Output Sanitization for MCP Clients
 * 
 * This module provides comprehensive sanitization functions to ensure
 * safe output across different MCP clients, preventing injection attacks,
 * handling malformed data, and ensuring content security.
 */

import { createLogger } from './mcp-logging.js';
import { getClientCapabilities } from './output-formatter.js';

const logger = createLogger('output-sanitizer');

// Security patterns for different types of content
const SECURITY_PATTERNS = {
  // Potential script injection patterns
  SCRIPT_INJECTION: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi
  ],
  
  // HTML/XML injection patterns
  HTML_INJECTION: [
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /<input\b[^>]*>/gi
  ],
  
  // URL schemes that could be dangerous
  DANGEROUS_PROTOCOLS: [
    /^javascript:/i,
    /^vbscript:/i,
    /^data:text\/html/i,
    /^data:application\/x-javascript/i
  ],
  
  // Control characters and zero-width characters
  CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
  ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
  
  // Markdown injection attempts
  MARKDOWN_INJECTION: [
    /!\[.*?\]\(javascript:/gi,
    /\[.*?\]\(javascript:/gi,
    /!\[.*?\]\(data:/gi,
    /\[.*?\]\(data:/gi
  ]
};

// Maximum lengths for different content types to prevent DoS
const CONTENT_LIMITS = {
  TEXT: 500000,
  JSON_STRING: 1000000,
  CODE_BLOCK: 100000,
  TABLE_CELL: 10000,
  URL: 2048,
  FILENAME: 255
};

/**
 * Sanitize text content for safe display
 * @param {string} text - Text to sanitize
 * @param {string} clientType - Target client type
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, clientType, options = {}) {
  if (!text || typeof text !== 'string') return '';
  
  try {
    let sanitized = text;
    const capabilities = getClientCapabilities(clientType);
    
    // Remove control characters
    sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
    sanitized = sanitized.replace(SECURITY_PATTERNS.ZERO_WIDTH, '');
    
    // Limit length to prevent DoS
    const maxLength = options.maxLength || CONTENT_LIMITS.TEXT;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength - 50) + '... [content truncated for safety]';
      logger.warning('Content truncated due to length limit', { 
        originalLength: text.length, 
        maxLength,
        clientType 
      });
    }
    
    // For clients that support markdown, check for injection attempts
    if (capabilities.supportsMarkdown) {
      sanitized = sanitizeMarkdownContent(sanitized);
    }
    
    // For clients that support HTML, be more aggressive
    if (options.allowHtml && capabilities.supportsMarkdown) {
      sanitized = sanitizeHtmlContent(sanitized);
    } else {
      // Strip all HTML-like content for safety
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    return sanitized;
  } catch (error) {
    logger.error('Error sanitizing text', { error: error.message, clientType });
    return '[Error: content could not be sanitized safely]';
  }
}

/**
 * Sanitize JSON content
 * @param {any} data - Data to sanitize
 * @param {string} clientType - Target client type
 * @param {Object} options - Sanitization options
 * @returns {any} Sanitized data
 */
export function sanitizeJson(data, clientType, options = {}) {
  try {
    return sanitizeDataRecursive(data, clientType, {
      maxDepth: options.maxDepth || 20,
      maxStringLength: options.maxStringLength || CONTENT_LIMITS.JSON_STRING,
      currentDepth: 0
    });
  } catch (error) {
    logger.error('Error sanitizing JSON', { error: error.message, clientType });
    return { error: 'Data could not be sanitized safely' };
  }
}

/**
 * Recursively sanitize data structures
 * @param {any} data - Data to sanitize
 * @param {string} clientType - Target client type
 * @param {Object} context - Sanitization context
 * @returns {any} Sanitized data
 */
function sanitizeDataRecursive(data, clientType, context) {
  if (context.currentDepth > context.maxDepth) {
    return '[Max depth exceeded]';
  }
  
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    if (data.length > context.maxStringLength) {
      return data.slice(0, context.maxStringLength - 50) + '... [truncated]';
    }
    return sanitizeText(data, clientType, { maxLength: context.maxStringLength });
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => 
      sanitizeDataRecursive(item, clientType, {
        ...context,
        currentDepth: context.currentDepth + 1
      })
    );
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = sanitizeText(String(key), clientType, { maxLength: 100 });
      sanitized[sanitizedKey] = sanitizeDataRecursive(value, clientType, {
        ...context,
        currentDepth: context.currentDepth + 1
      });
    }
    return sanitized;
  }
  
  return String(data);
}

/**
 * Sanitize markdown content
 * @param {string} markdown - Markdown content to sanitize
 * @returns {string} Sanitized markdown
 */
function sanitizeMarkdownContent(markdown) {
  let sanitized = markdown;
  
  // Check for markdown injection patterns
  for (const pattern of SECURITY_PATTERNS.MARKDOWN_INJECTION) {
    sanitized = sanitized.replace(pattern, '[Removed: unsafe link]');
  }
  
  // Sanitize URLs in markdown links
  sanitized = sanitized.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    const sanitizedUrl = sanitizeUrl(url);
    const sanitizedText = text.replace(/[<>]/g, ''); // Remove angle brackets from link text
    return `[${sanitizedText}](${sanitizedUrl})`;
  });
  
  // Sanitize image URLs
  sanitized = sanitized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const sanitizedUrl = sanitizeUrl(url);
    const sanitizedAlt = alt.replace(/[<>]/g, '');
    return `![${sanitizedAlt}](${sanitizedUrl})`;
  });
  
  return sanitized;
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHtmlContent(html) {
  let sanitized = html;
  
  // Remove dangerous script patterns
  for (const pattern of SECURITY_PATTERNS.SCRIPT_INJECTION) {
    sanitized = sanitized.replace(pattern, '[Removed: script content]');
  }
  
  // Remove dangerous HTML elements
  for (const pattern of SECURITY_PATTERNS.HTML_INJECTION) {
    sanitized = sanitized.replace(pattern, '[Removed: unsafe element]');
  }
  
  return sanitized;
}

/**
 * Sanitize URLs
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  let sanitized = url.trim();
  
  // Limit URL length
  if (sanitized.length > CONTENT_LIMITS.URL) {
    return '[URL too long]';
  }
  
  // Check for dangerous protocols
  for (const pattern of SECURITY_PATTERNS.DANGEROUS_PROTOCOLS) {
    if (pattern.test(sanitized)) {
      logger.warning('Dangerous URL protocol detected', { url: sanitized });
      return '[Removed: unsafe URL]';
    }
  }
  
  // Remove control characters
  sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
  
  return sanitized;
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return '';
  
  let sanitized = filename.trim();
  
  // Limit filename length
  if (sanitized.length > CONTENT_LIMITS.FILENAME) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    const name = sanitized.slice(0, CONTENT_LIMITS.FILENAME - ext.length - 10);
    sanitized = name + '...' + ext;
  }
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Prevent reserved Windows filenames
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reserved.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  
  return sanitized || 'unnamed';
}

/**
 * Sanitize code content
 * @param {string} code - Code content to sanitize
 * @param {string} language - Programming language
 * @param {string} clientType - Target client type
 * @returns {string} Sanitized code
 */
export function sanitizeCode(code, language, clientType) {
  if (!code || typeof code !== 'string') return '';
  
  let sanitized = code;
  
  // Limit code length
  if (sanitized.length > CONTENT_LIMITS.CODE_BLOCK) {
    sanitized = sanitized.slice(0, CONTENT_LIMITS.CODE_BLOCK - 50) + '\n// [Code truncated for safety]';
    logger.warning('Code content truncated due to length limit', { 
      originalLength: code.length,
      language,
      clientType 
    });
  }
  
  // Remove control characters but preserve necessary whitespace
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  
  // For languages that could contain dangerous content, add warnings
  const dangerousLanguages = ['html', 'javascript', 'js', 'vbscript', 'php'];
  if (dangerousLanguages.includes(language?.toLowerCase())) {
    logger.info('Code in potentially dangerous language sanitized', { language, clientType });
  }
  
  return sanitized;
}

/**
 * Sanitize table data
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @param {string} clientType - Target client type
 * @returns {Object} Sanitized table data
 */
export function sanitizeTable(headers, rows, clientType) {
  const sanitizedHeaders = headers.map(header => 
    sanitizeText(String(header), clientType, { maxLength: CONTENT_LIMITS.TABLE_CELL })
  );
  
  const sanitizedRows = rows.map(row => 
    row.map(cell => 
      sanitizeText(String(cell), clientType, { maxLength: CONTENT_LIMITS.TABLE_CELL })
    )
  );
  
  return {
    headers: sanitizedHeaders,
    rows: sanitizedRows
  };
}

/**
 * Validate and sanitize MCP response content
 * @param {any} content - Response content
 * @param {string} clientType - Target client type
 * @param {Object} options - Validation options
 * @returns {any} Sanitized content
 */
export function sanitizeMcpResponse(content, clientType, options = {}) {
  try {
    if (!content) return content;
    
    if (Array.isArray(content)) {
      return content.map(item => sanitizeMcpResponse(item, clientType, options));
    }
    
    if (content.type === 'text') {
      return {
        ...content,
        text: sanitizeText(content.text, clientType, options)
      };
    }
    
    if (content.type === 'resource') {
      return {
        ...content,
        text: content.text ? sanitizeText(content.text, clientType, options) : content.text,
        uri: content.uri ? sanitizeUrl(content.uri) : content.uri
      };
    }
    
    // For other content types, sanitize recursively
    return sanitizeJson(content, clientType, options);
  } catch (error) {
    logger.error('Error sanitizing MCP response', { error: error.message, clientType });
    return { error: 'Response could not be sanitized safely' };
  }
}

/**
 * Get sanitization statistics
 * @returns {Object} Sanitization statistics
 */
export function getSanitizationStats() {
  // This could be extended to track sanitization events
  return {
    timestamp: new Date().toISOString(),
    limitsConfigured: CONTENT_LIMITS,
    securityPatternsCount: {
      scriptInjection: SECURITY_PATTERNS.SCRIPT_INJECTION.length,
      htmlInjection: SECURITY_PATTERNS.HTML_INJECTION.length,
      dangerousProtocols: SECURITY_PATTERNS.DANGEROUS_PROTOCOLS.length,
      markdownInjection: SECURITY_PATTERNS.MARKDOWN_INJECTION.length
    }
  };
}