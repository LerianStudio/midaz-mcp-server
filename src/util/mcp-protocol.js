/**
 * MCP Protocol compliance utilities
 * Implements proper content types, pagination, subscriptions, and capabilities
 */

import { EventEmitter } from 'events';

// Content type constants
export const ContentTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  RESOURCE: 'resource'
};

// MCP Error codes
export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000
};

// Resource subscription manager
class ResourceSubscriptionManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
  }

  subscribe(resourceUri, subscriberId) {
    if (!this.subscriptions.has(resourceUri)) {
      this.subscriptions.set(resourceUri, new Set());
    }
    this.subscriptions.get(resourceUri).add(subscriberId);
    return true;
  }

  unsubscribe(resourceUri, subscriberId) {
    if (this.subscriptions.has(resourceUri)) {
      this.subscriptions.get(resourceUri).delete(subscriberId);
      if (this.subscriptions.get(resourceUri).size === 0) {
        this.subscriptions.delete(resourceUri);
      }
      return true;
    }
    return false;
  }

  getSubscribers(resourceUri) {
    return Array.from(this.subscriptions.get(resourceUri) || []);
  }

  notifyChange(resourceUri, changeType = 'updated') {
    const subscribers = this.getSubscribers(resourceUri);
    if (subscribers.length > 0) {
      this.emit('resource-changed', {
        uri: resourceUri,
        changeType,
        subscribers
      });
    }
  }
}

export const subscriptionManager = new ResourceSubscriptionManager();

/**
 * Create MCP-compliant tool response
 */
export function createToolResponse(data, contentType = ContentTypes.TEXT) {
  if (data === null || data === undefined) {
    return {
      content: [{
        type: contentType,
        text: ''
      }],
      isError: false
    };
  }

  // If already in MCP format, return as-is
  if (data.content && Array.isArray(data.content)) {
    return data;
  }

  // Convert to MCP format
  let text;
  if (typeof data === 'string') {
    text = data;
  } else {
    text = JSON.stringify(data, null, 2);
  }

  return {
    content: [{
      type: contentType,
      text
    }],
    isError: false
  };
}

/**
 * Create MCP-compliant error response
 */
export function createErrorResponse(error, code = ErrorCodes.INTERNAL_ERROR) {
  return {
    error: {
      code,
      message: error.message || 'Unknown error',
      data: {
        stack: error.stack,
        details: error.details || {}
      }
    },
    isError: true
  };
}

/**
 * Create paginated response with cursor support
 */
export function createPaginatedResponse(items, cursor, limit, totalCount = null) {
  const hasMore = totalCount ? items.length + (cursor || 0) < totalCount : items.length === limit;
  const nextCursor = hasMore ? (cursor || 0) + items.length : null;

  return {
    content: [{
      type: ContentTypes.TEXT,
      text: JSON.stringify({
        items,
        pagination: {
          cursor: cursor || 0,
          nextCursor,
          hasMore,
          limit,
          totalCount
        }
      }, null, 2)
    }],
    isError: false
  };
}

/**
 * Parse cursor from string
 */
export function parseCursor(cursorStr) {
  if (!cursorStr) return { offset: 0 };
  
  try {
    // Base64 decode
    const decoded = Buffer.from(cursorStr, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    // Fallback to simple offset
    const offset = parseInt(cursorStr, 10);
    return { offset: isNaN(offset) ? 0 : offset };
  }
}

/**
 * Create cursor string
 */
export function createCursor(data) {
  if (typeof data === 'number') {
    data = { offset: data };
  }
  // Base64 encode
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Enhanced server capabilities declaration
 */
export function getServerCapabilities() {
  return {
    // Resource capabilities
    resources: {
      list: true,
      get: true,
      subscribe: true,
      templates: true
    },
    // Tool capabilities
    tools: {
      list: true,
      execute: true
    },
    // Protocol features
    features: {
      pagination: true,
      subscriptions: true,
      contentTypes: ['text', 'image', 'resource'],
      errorHandling: true,
      rateLimit: {
        enabled: true,
        defaultLimit: 100,
        window: 60000
      }
    },
    // Server info
    info: {
      name: 'lerian-mcp-server',
      version: '0.1.0',
      description: 'MCP server for Midaz financial ledger system'
    }
  };
}

/**
 * Register MCP protocol handlers
 */
export function registerProtocolHandlers(server) {
  // Capabilities endpoint
  server.setRequestHandler('capabilities', async () => {
    return createToolResponse(getServerCapabilities());
  });

  // Resource subscription handlers
  server.setRequestHandler('resources/subscribe', async (params) => {
    const { uri, subscriberId } = params;
    const success = subscriptionManager.subscribe(uri, subscriberId);
    return createToolResponse({ success, uri });
  });

  server.setRequestHandler('resources/unsubscribe', async (params) => {
    const { uri, subscriberId } = params;
    const success = subscriptionManager.unsubscribe(uri, subscriberId);
    return createToolResponse({ success, uri });
  });

  server.setRequestHandler('resources/list-subscriptions', async (params) => {
    const { subscriberId } = params;
    const subscriptions = [];
    
    subscriptionManager.subscriptions.forEach((subscribers, uri) => {
      if (subscribers.has(subscriberId)) {
        subscriptions.push(uri);
      }
    });
    
    return createToolResponse({ subscriptions });
  });

  // Listen for resource changes
  subscriptionManager.on('resource-changed', (event) => {
    // Notify subscribers through server
    server.notification('resources/changed', {
      uri: event.uri,
      changeType: event.changeType,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Template parameter support for resources
 */
export function parseResourceTemplate(template, params) {
  let result = template;
  
  // Replace {param} with actual values
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return result;
}

/**
 * Validate resource URI with template support
 */
export function validateResourceUri(uri, template) {
  // Extract template parameters
  const templateParams = template.match(/\{(\w+)\}/g)?.map(p => p.slice(1, -1)) || [];
  
  // Create regex from template with input validation
  // Escape special characters first to prevent ReDoS
  const escapedTemplate = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Then restore our parameter placeholders
  let regexStr = escapedTemplate.replace(/\\\{(\w+)\\\}/g, '([^/]+)');
  regexStr = `^${regexStr}$`;
  
  const regex = new RegExp(regexStr);
  const match = uri.match(regex);
  
  if (!match) {
    return { valid: false, params: {} };
  }
  
  // Extract parameter values
  const params = {};
  templateParams.forEach((param, index) => {
    params[param] = match[index + 1];
  });
  
  return { valid: true, params };
}