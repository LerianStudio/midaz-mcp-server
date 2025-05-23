/**
 * MCP Protocol Helper Functions
 * 
 * This module provides utilities for creating MCP-compliant responses
 * according to the Model Context Protocol specification.
 */

/**
 * Create a successful MCP tool response
 * @param {any} data - The data to return
 * @param {string} mimeType - Optional MIME type (defaults to 'application/json')
 * @returns {Object} MCP-compliant response
 */
export function createToolResponse(data, mimeType = 'application/json') {
  return {
    content: [{
      type: "text",
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      mimeType
    }],
    isError: false
  };
}

/**
 * Create an error response following JSON-RPC 2.0 error codes
 * @param {number} code - JSON-RPC error code
 * @param {string} message - Error message
 * @param {any} data - Additional error data
 * @returns {Object} JSON-RPC compliant error
 */
export function createErrorResponse(code, message, data = null) {
  const error = {
    code,
    message
  };
  
  if (data !== null) {
    error.data = data;
  }
  
  throw error;
}

/**
 * Standard JSON-RPC 2.0 error codes
 */
export const ErrorCodes = {
  // JSON-RPC 2.0 standard errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // MCP-specific errors (using implementation-defined range)
  RESOURCE_NOT_FOUND: -32002,
  RESOURCE_ACCESS_DENIED: -32003,
  RESOURCE_UNAVAILABLE: -32004,
  BACKEND_ERROR: -32005,
};

/**
 * Create a paginated response with cursor support
 * @param {Array} items - Array of items
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated response with cursor
 */
export function createPaginatedResponse(items, options = {}) {
  const { cursor, limit = 10 } = options;
  
  let startIndex = 0;
  if (cursor) {
    // Decode cursor (base64 encoded index)
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
    total: items.length
  };
  
  if (hasMore) {
    // Create cursor for next page (base64 encoded index)
    response.nextCursor = Buffer.from(endIndex.toString()).toString('base64');
  }
  
  return createToolResponse(response);
}

/**
 * Wrap an async tool handler with proper error handling
 * @param {Function} handler - The async handler function
 * @returns {Function} Wrapped handler with MCP-compliant error handling
 */
export function wrapToolHandler(handler) {
  return async (args, extra) => {
    try {
      const result = await handler(args, extra);
      
      // If handler returns an MCP response object, use it directly
      if (result && result.content && Array.isArray(result.content)) {
        return result;
      }
      
      // Otherwise, wrap in MCP response format
      return createToolResponse(result);
    } catch (error) {
      // If it's already a JSON-RPC error, re-throw it
      if (error.code && typeof error.code === 'number') {
        throw error;
      }
      
      // Handle specific error types
      if (error.message?.includes('not found')) {
        throw createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          error.message,
          { resource: args.id || args.name }
        );
      }
      
      if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
        throw createErrorResponse(
          ErrorCodes.RESOURCE_ACCESS_DENIED,
          'Access denied to resource'
        );
      }
      
      if (error.message?.includes('backend') || error.message?.includes('API')) {
        throw createErrorResponse(
          ErrorCodes.BACKEND_ERROR,
          'Backend service unavailable',
          { service: error.service || 'unknown', originalError: error.message }
        );
      }
      
      // Default to internal error
      throw createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An internal error occurred',
        { originalError: error.message }
      );
    }
  };
}

/**
 * Validate tool arguments against a schema
 * @param {Object} args - Arguments to validate
 * @param {Object} schema - Zod schema or similar
 * @returns {Object} Validated arguments
 * @throws {Object} JSON-RPC error if validation fails
 */
export function validateArgs(args, schema) {
  try {
    if (schema.parse) {
      // Zod schema
      return schema.parse(args);
    } else if (schema.validate) {
      // Generic validation method
      const result = schema.validate(args);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }
    return args;
  } catch (error) {
    throw createErrorResponse(
      ErrorCodes.INVALID_PARAMS,
      'Invalid parameters',
      { validation: error.errors || error.message }
    );
  }
}

/**
 * Log MCP tool invocation for monitoring
 * @param {string} toolName - Name of the tool
 * @param {Object} args - Tool arguments
 * @param {Object} extra - Extra context from MCP
 * @returns {number} Start timestamp for duration tracking
 */
export function logToolInvocation(toolName, args, extra) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    tool: toolName,
    args: Object.keys(args).length > 0 ? args : undefined,
    requestId: extra?.requestId
  };
  
  console.error(`[MCP Tool] ${JSON.stringify(logEntry)}`);
  return Date.now(); // Return start time for duration tracking
}