/**
 * MCP Structured Logging
 * 
 * This module provides structured logging capabilities
 * following the MCP logging protocol.
 */

// Log levels following MCP protocol
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  NOTICE: 'notice',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  ALERT: 'alert',
  EMERGENCY: 'emergency'
};

// MCP server instance (will be set during initialization)
let mcpServer = null;

/**
 * Initialize the MCP logger with server instance
 * @param {Object} server - MCP server instance
 */
export function initializeMcpLogger(server) {
  mcpServer = server;
}

/**
 * Send a log message via MCP protocol
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional structured data
 */
export function sendLogMessage(level, message, data = {}) {
  // Fallback to console if MCP server not initialized
  if (!mcpServer) {
    console.error(`[${level.toUpperCase()}] ${message}`, data);
    return;
  }

  try {
    // Send via MCP logging protocol
    mcpServer.sendLoggingMessage({
      level,
      logger: 'midaz-mcp-server',
      message,
      data: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  } catch (error) {
    // Fallback to console on error
    console.error(`[${level.toUpperCase()}] ${message}`, data);
    console.error('Failed to send MCP log:', error);
  }
}

/**
 * Logger class for structured logging
 */
export class McpLogger {
  constructor(component) {
    this.component = component;
  }

  debug(message, data = {}) {
    sendLogMessage(LogLevel.DEBUG, message, { component: this.component, ...data });
  }

  info(message, data = {}) {
    sendLogMessage(LogLevel.INFO, message, { component: this.component, ...data });
  }

  notice(message, data = {}) {
    sendLogMessage(LogLevel.NOTICE, message, { component: this.component, ...data });
  }

  warning(message, data = {}) {
    sendLogMessage(LogLevel.WARNING, message, { component: this.component, ...data });
  }

  error(message, data = {}) {
    sendLogMessage(LogLevel.ERROR, message, { component: this.component, ...data });
  }

  critical(message, data = {}) {
    sendLogMessage(LogLevel.CRITICAL, message, { component: this.component, ...data });
  }

  alert(message, data = {}) {
    sendLogMessage(LogLevel.ALERT, message, { component: this.component, ...data });
  }

  emergency(message, data = {}) {
    sendLogMessage(LogLevel.EMERGENCY, message, { component: this.component, ...data });
  }
}

/**
 * Create a logger for a specific component
 * @param {string} component - Component name
 * @returns {McpLogger} Logger instance
 */
export function createLogger(component) {
  return new McpLogger(component);
}

/**
 * Log tool invocation
 * @param {string} toolName - Name of the tool
 * @param {Object} args - Tool arguments
 * @param {Object} extra - Extra context
 * @param {number} startTime - Start timestamp
 * @param {boolean} success - Whether the invocation succeeded
 * @param {Error} error - Error if failed
 */
export function logToolInvocation(toolName, args, extra, startTime, success = true, error = null) {
  const duration = Date.now() - startTime;
  const data = {
    tool: toolName,
    duration_ms: duration,
    success,
    args_count: Object.keys(args).length,
    request_id: extra?.requestId
  };

  if (error) {
    data.error = {
      message: error.message,
      code: error.code,
      stack: error.stack
    };
  }

  sendLogMessage(
    success ? LogLevel.INFO : LogLevel.ERROR,
    `Tool ${toolName} ${success ? 'completed' : 'failed'}`,
    data
  );
}

/**
 * Log API call
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {number} startTime - Start timestamp
 * @param {number} statusCode - Response status code
 * @param {Error} error - Error if failed
 */
export function logApiCall(endpoint, method, startTime, statusCode = null, error = null) {
  const duration = Date.now() - startTime;
  const success = statusCode && statusCode >= 200 && statusCode < 300;
  
  const data = {
    endpoint,
    method,
    duration_ms: duration,
    status_code: statusCode,
    success
  };

  if (error) {
    data.error = {
      message: error.message,
      code: error.code
    };
  }

  sendLogMessage(
    success ? LogLevel.INFO : LogLevel.WARNING,
    `API ${method} ${endpoint} ${statusCode || 'failed'}`,
    data
  );
}

/**
 * Log configuration event
 * @param {string} event - Configuration event type
 * @param {Object} details - Event details
 */
export function logConfigEvent(event, details = {}) {
  sendLogMessage(LogLevel.INFO, `Configuration ${event}`, {
    event,
    ...details
  });
}

/**
 * Log server lifecycle event
 * @param {string} event - Lifecycle event type
 * @param {Object} details - Event details
 */
export function logLifecycleEvent(event, details = {}) {
  sendLogMessage(LogLevel.NOTICE, `Server ${event}`, {
    lifecycle_event: event,
    ...details
  });
}