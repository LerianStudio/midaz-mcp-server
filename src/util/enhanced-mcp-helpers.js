/**
 * Enhanced MCP Protocol Helper Functions
 * 
 * This module extends the base MCP helpers with advanced output formatting
 * capabilities, providing automatic client detection and appropriate formatting
 * for optimal display across different MCP clients.
 */

import { 
  createToolResponse as baseCreateToolResponse,
  createErrorResponse,
  createPaginatedResponse,
  wrapToolHandler,
  validateArgs,
  logToolInvocation,
  ErrorCodes
} from './mcp-helpers.js';
import { 
  createClientAdapter,
  formatMcpResponse 
} from './client-adapters.js';
import { ContentType } from './output-formatter.js';
import { createLogger } from './mcp-logging.js';

const logger = createLogger('enhanced-mcp-helpers');

/**
 * Enhanced tool response creator with automatic formatting
 * @param {any} data - The data to return
 * @param {Object} extra - MCP extra context (contains client info)
 * @param {Object} options - Formatting options
 * @returns {Object} Enhanced MCP-compliant response
 */
export function createEnhancedToolResponse(data, extra = {}, options = {}) {
  try {
    // Use base function for simple cases when no formatting is needed
    if (options.skipFormatting || !data || typeof data === 'string' && data.length < 100) {
      return baseCreateToolResponse(data, options.mimeType);
    }

    // Use enhanced formatting for complex data
    return formatMcpResponse(data, extra, {
      contentType: options.contentType,
      mimeType: options.mimeType || 'text/plain',
      metadata: options.metadata,
      ...options
    });
  } catch (error) {
    logger.error('Error creating enhanced tool response', { 
      error: error.message, 
      extra,
      options 
    });
    
    // Fallback to base response
    return baseCreateToolResponse(data, options.mimeType);
  }
}

/**
 * Enhanced wrapper for tool handlers with automatic formatting
 * @param {Function} handler - The async handler function
 * @param {Object} options - Wrapper options
 * @returns {Function} Enhanced wrapped handler
 */
export function wrapEnhancedToolHandler(handler, options = {}) {
  return async (args, extra) => {
    const startTime = Date.now();
    const toolName = options.toolName || handler.name || 'unknown';
    
    try {
      logger.debug('Tool invocation started', { toolName, args: Object.keys(args) });
      
      const result = await handler(args, extra);
      
      // If handler returns an MCP response object, check if it needs enhancement
      if (result && result.content && Array.isArray(result.content)) {
        logger.info('Tool completed successfully', { 
          toolName, 
          duration: Date.now() - startTime 
        });
        return result;
      }
      
      // Apply enhanced formatting
      const enhancedResponse = createEnhancedToolResponse(result, extra, {
        contentType: options.contentType,
        metadata: options.metadata,
        ...options.formatting
      });
      
      logger.info('Tool completed with enhanced formatting', { 
        toolName, 
        duration: Date.now() - startTime,
        clientType: extra?.clientInfo?.name 
      });
      
      return enhancedResponse;
    } catch (error) {
      logger.error('Tool execution failed', { 
        toolName, 
        error: error.message,
        duration: Date.now() - startTime 
      });
      
      // Enhanced error formatting
      if (error.code && typeof error.code === 'number') {
        throw error; // Re-throw JSON-RPC errors as-is
      }
      
      const errorResponse = createEnhancedToolResponse({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, extra, {
        contentType: ContentType.ERROR
      });
      
      // Return error response instead of throwing for better client handling
      return {
        ...errorResponse,
        isError: true
      };
    }
  };
}

/**
 * Create a formatted JSON response
 * @param {any} data - JSON data
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted JSON response
 */
export function createJsonResponse(data, extra = {}, options = {}) {
  return createEnhancedToolResponse(data, extra, {
    contentType: ContentType.JSON,
    mimeType: 'application/json',
    ...options
  });
}

/**
 * Create a formatted code response
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted code response
 */
export function createCodeResponse(code, language, extra = {}, options = {}) {
  return createEnhancedToolResponse(code, extra, {
    contentType: ContentType.CODE,
    language,
    mimeType: `text/x-${language}`,
    ...options
  });
}

/**
 * Create a formatted table response
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted table response
 */
export function createTableResponse(headers, rows, extra = {}, options = {}) {
  return createEnhancedToolResponse({ headers, rows }, extra, {
    contentType: ContentType.TABLE,
    mimeType: 'text/plain',
    ...options
  });
}

/**
 * Create a formatted markdown response
 * @param {string} markdown - Markdown content
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted markdown response
 */
export function createMarkdownResponse(markdown, extra = {}, options = {}) {
  return createEnhancedToolResponse(markdown, extra, {
    contentType: ContentType.MARKDOWN,
    mimeType: 'text/markdown',
    ...options
  });
}

/**
 * Create a formatted list response
 * @param {Array} items - List items
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted list response
 */
export function createListResponse(items, extra = {}, options = {}) {
  return createEnhancedToolResponse(items, extra, {
    contentType: ContentType.LIST,
    ordered: options.ordered || false,
    mimeType: 'text/plain',
    ...options
  });
}

/**
 * Enhanced paginated response with client-aware formatting
 * @param {Array} items - Array of items
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Pagination and formatting options
 * @returns {Object} Enhanced paginated response
 */
export function createEnhancedPaginatedResponse(items, extra = {}, options = {}) {
  const { cursor, limit = 10 } = options;
  
  let startIndex = 0;
  if (cursor) {
    try {
      startIndex = parseInt(Buffer.from(cursor, 'base64').toString('utf8'), 10);
    } catch (e) {
      throw createErrorResponse(ErrorCodes.INVALID_PARAMS, 'Invalid cursor');
    }
  }
  
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  const hasMore = endIndex < items.length;
  
  const response = {
    items: paginatedItems,
    total: items.length,
    page: Math.floor(startIndex / limit) + 1,
    pageSize: limit,
    hasMore
  };
  
  if (hasMore) {
    response.nextCursor = Buffer.from(endIndex.toString()).toString('base64');
  }
  
  // Apply enhanced formatting to the paginated response
  return createEnhancedToolResponse(response, extra, {
    contentType: options.contentType || ContentType.JSON,
    metadata: {
      pagination: {
        page: response.page,
        total: response.total,
        hasMore: response.hasMore
      }
    },
    ...options
  });
}

/**
 * Create a client-aware error response
 * @param {number} code - Error code
 * @param {string} message - Error message
 * @param {Object} extra - MCP extra context
 * @param {any} data - Additional error data
 * @returns {Object} Enhanced error response
 */
export function createEnhancedErrorResponse(code, message, extra = {}, data = null) {
  const errorData = {
    code,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    errorData.details = data;
  }
  
  return createEnhancedToolResponse(errorData, extra, {
    contentType: ContentType.ERROR,
    mimeType: 'application/json'
  });
}

/**
 * Middleware to automatically enhance existing tool responses
 * @param {Function} toolFunction - Existing tool function
 * @param {Object} options - Enhancement options
 * @returns {Function} Enhanced tool function
 */
export function enhanceExistingTool(toolFunction, options = {}) {
  return wrapEnhancedToolHandler(toolFunction, {
    toolName: options.name || toolFunction.name,
    contentType: options.contentType,
    formatting: options.formatting || {}
  });
}

/**
 * Utility to detect if response needs enhancement
 * @param {any} response - Response to check
 * @param {Object} extra - MCP extra context
 * @returns {boolean} Whether enhancement is beneficial
 */
export function shouldEnhanceResponse(response, extra = {}) {
  // Skip enhancement for simple strings
  if (typeof response === 'string' && response.length < 100) {
    return false;
  }
  
  // Skip if client doesn't support advanced formatting
  const clientName = extra?.clientInfo?.name?.toLowerCase() || '';
  if (clientName.includes('terminal') || clientName.includes('basic')) {
    return false;
  }
  
  // Enhance for complex data types
  return (
    typeof response === 'object' ||
    Array.isArray(response) ||
    (typeof response === 'string' && (
      response.includes('\n') ||
      response.length > 100 ||
      response.includes('```') ||
      response.includes('|')
    ))
  );
}

/**
 * Batch format multiple responses for consistency
 * @param {Array} responses - Array of response data
 * @param {Object} extra - MCP extra context
 * @param {Object} options - Formatting options
 * @returns {Array} Array of formatted responses
 */
export function batchFormatResponses(responses, extra = {}, options = {}) {
  const adapter = createClientAdapter(extra);
  
  return responses.map((response, index) => {
    try {
      return createEnhancedToolResponse(response, extra, {
        ...options,
        metadata: {
          ...options.metadata,
          batchIndex: index,
          batchTotal: responses.length
        }
      });
    } catch (error) {
      logger.warning('Failed to format response in batch', { 
        index, 
        error: error.message 
      });
      return baseCreateToolResponse(response);
    }
  });
}

// Re-export base helpers for compatibility
export {
  createToolResponse,
  createErrorResponse,
  createPaginatedResponse,
  wrapToolHandler,
  validateArgs,
  logToolInvocation,
  ErrorCodes
} from './mcp-helpers.js';

// Re-export formatting utilities
export {
  detectClientType,
  getClientCapabilities,
  ClientType,
  ContentType
} from './output-formatter.js';

export {
  createClientAdapter
} from './client-adapters.js';