/**
 * MCP Client Detection and Capability Management
 * Detects which MCP client is connecting and adapts server behavior accordingly
 */

import { createLogger } from './mcp-logging.js';

const logger = createLogger('client-detection');

// Client detection patterns based on user-agent, capabilities, and connection metadata
export const ClientPatterns = {
  CLAUDE_DESKTOP: {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    patterns: [
      /Claude Desktop/i,
      /anthropic.*desktop/i,
      /claude.*app/i
    ],
    capabilities: {
      maxToolsPerCall: 10,
      supportsBinaryContent: true,
      supportsImages: true,
      supportsStreaming: false,
      maxResponseSize: 100000,
      escapeHandling: 'json',
      outputFormat: 'structured',
      rateLimit: { requests: 60, window: 60000 },
      toolComplexity: 'high',
      concurrentTools: 3
    }
  },
  
  CURSOR: {
    id: 'cursor',
    name: 'Cursor',
    patterns: [
      /Cursor/i,
      /cursor.*editor/i,
      /anysphere/i
    ],
    capabilities: {
      maxToolsPerCall: 5,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: true,
      maxResponseSize: 50000,
      escapeHandling: 'minimal',
      outputFormat: 'concise',
      rateLimit: { requests: 30, window: 60000 },
      toolComplexity: 'medium',
      concurrentTools: 2
    }
  },

  VSCODE: {
    id: 'vscode',
    name: 'VS Code',
    patterns: [
      /Visual Studio Code/i,
      /vscode/i,
      /code.*oss/i,
      /monaco.*editor/i
    ],
    capabilities: {
      maxToolsPerCall: 8,
      supportsBinaryContent: true,
      supportsImages: false,
      supportsStreaming: true,
      maxResponseSize: 75000,
      escapeHandling: 'standard',
      outputFormat: 'developer',
      rateLimit: { requests: 45, window: 60000 },
      toolComplexity: 'high',
      concurrentTools: 2
    }
  },

  WINDSURF: {
    id: 'windsurf',
    name: 'Windsurf',
    patterns: [
      /Windsurf/i,
      /codeium.*windsurf/i
    ],
    capabilities: {
      maxToolsPerCall: 6,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: true,
      maxResponseSize: 60000,
      escapeHandling: 'standard',
      outputFormat: 'concise',
      rateLimit: { requests: 40, window: 60000 },
      toolComplexity: 'medium',
      concurrentTools: 2
    }
  },

  CONTINUE: {
    id: 'continue',
    name: 'Continue',
    patterns: [
      /Continue/i,
      /continue.*dev/i
    ],
    capabilities: {
      maxToolsPerCall: 4,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: true,
      maxResponseSize: 40000,
      escapeHandling: 'minimal',
      outputFormat: 'minimal',
      rateLimit: { requests: 25, window: 60000 },
      toolComplexity: 'low',
      concurrentTools: 1
    }
  },

  CODEIUM: {
    id: 'codeium',
    name: 'Codeium',
    patterns: [
      /Codeium/i,
      /codeium.*chat/i
    ],
    capabilities: {
      maxToolsPerCall: 5,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: true,
      maxResponseSize: 45000,
      escapeHandling: 'standard',
      outputFormat: 'concise',
      rateLimit: { requests: 35, window: 60000 },
      toolComplexity: 'medium',
      concurrentTools: 2
    }
  },

  ZEROCODE: {
    id: 'zerocode',
    name: 'ZeroCode',
    patterns: [
      /ZeroCode/i,
      /zero.*code/i
    ],
    capabilities: {
      maxToolsPerCall: 3,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: false,
      maxResponseSize: 30000,
      escapeHandling: 'minimal',
      outputFormat: 'minimal',
      rateLimit: { requests: 20, window: 60000 },
      toolComplexity: 'low',
      concurrentTools: 1
    }
  },

  GENERIC: {
    id: 'generic',
    name: 'Generic MCP Client',
    patterns: [
      /mcp/i,
      /model.*context.*protocol/i
    ],
    capabilities: {
      maxToolsPerCall: 5,
      supportsBinaryContent: false,
      supportsImages: false,
      supportsStreaming: false,
      maxResponseSize: 50000,
      escapeHandling: 'standard',
      outputFormat: 'structured',
      rateLimit: { requests: 30, window: 60000 },
      toolComplexity: 'medium',
      concurrentTools: 1
    }
  }
};

// Default fallback client when detection fails
export const DEFAULT_CLIENT = ClientPatterns.GENERIC;

/**
 * Client detection context
 */
export class ClientContext {
  constructor(clientInfo, capabilities, detectionMethod = 'unknown') {
    this.client = clientInfo;
    this.capabilities = capabilities;
    this.detectionMethod = detectionMethod;
    this.detectedAt = new Date().toISOString();
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `${this.client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if client supports a specific capability
   */
  supports(capability) {
    return this.capabilities[capability] !== undefined ? this.capabilities[capability] : false;
  }

  /**
   * Get capability value with fallback
   */
  getCapability(capability, fallback = null) {
    return this.capabilities[capability] !== undefined ? this.capabilities[capability] : fallback;
  }

  /**
   * Check if tool complexity is supported
   */
  supportsToolComplexity(complexity) {
    const levels = { low: 1, medium: 2, high: 3 };
    const clientLevel = levels[this.capabilities.toolComplexity] || 1;
    const requiredLevel = levels[complexity] || 1;
    return clientLevel >= requiredLevel;
  }
}

/**
 * Detect MCP client from connection metadata
 */
export function detectClient(connectionInfo = {}) {
  const { 
    userAgent = '', 
    clientName = '', 
    headers = {}, 
    capabilities = {},
    transport = {},
    environment = {} 
  } = connectionInfo;

  logger.debug('Detecting client', { 
    userAgent: userAgent.substring(0, 100), 
    clientName, 
    hasHeaders: Object.keys(headers).length > 0,
    hasCapabilities: Object.keys(capabilities).length > 0
  });

  // Detection sources in priority order
  const detectionSources = [
    { source: userAgent, method: 'user-agent' },
    { source: clientName, method: 'client-name' },
    { source: headers['user-agent'] || '', method: 'header-user-agent' },
    { source: headers['x-client-name'] || '', method: 'header-client-name' },
    { source: environment.TERM_PROGRAM || '', method: 'term-program' },
    { source: environment.EDITOR || '', method: 'editor-env' }
  ];

  // Try each client pattern against each detection source
  for (const { source, method } of detectionSources) {
    if (!source) continue;

    for (const [, clientPattern] of Object.entries(ClientPatterns)) {
      for (const pattern of clientPattern.patterns) {
        if (pattern.test(source)) {
          logger.info('Client detected', { 
            client: clientPattern.name, 
            method, 
            source: source.substring(0, 50) 
          });
          
          return new ClientContext(
            clientPattern, 
            { ...clientPattern.capabilities, ...capabilities },
            method
          );
        }
      }
    }
  }

  // Capability-based detection fallback
  const detectedByCapabilities = detectByCapabilities(capabilities);
  if (detectedByCapabilities) {
    logger.info('Client detected by capabilities', { 
      client: detectedByCapabilities.name 
    });
    
    return new ClientContext(
      detectedByCapabilities,
      { ...detectedByCapabilities.capabilities, ...capabilities },
      'capabilities'
    );
  }

  // Default fallback
  logger.warning('Client detection failed, using generic client', { 
    userAgent: userAgent.substring(0, 50),
    clientName 
  });
  
  return new ClientContext(
    DEFAULT_CLIENT,
    { ...DEFAULT_CLIENT.capabilities, ...capabilities },
    'fallback'
  );
}

/**
 * Detect client based on declared capabilities
 */
function detectByCapabilities(capabilities) {
  // Capability signatures for different clients
  const signatures = {
    [ClientPatterns.CLAUDE_DESKTOP.id]: {
      supportsBinaryContent: true,
      supportsImages: true,
      supportsStreaming: false
    },
    [ClientPatterns.CURSOR.id]: {
      maxResponseSize: { min: 40000, max: 60000 },
      supportsStreaming: true,
      supportsBinaryContent: false
    },
    [ClientPatterns.VSCODE.id]: {
      supportsBinaryContent: true,
      supportsStreaming: true,
      maxToolsPerCall: { min: 6, max: 10 }
    }
  };

  for (const [clientId, signature] of Object.entries(signatures)) {
    let matches = 0;
    let checks = 0;

    for (const [key, expected] of Object.entries(signature)) {
      const actual = capabilities[key];
      if (actual === undefined) continue;

      checks++;
      
      if (typeof expected === 'boolean' && actual === expected) {
        matches++;
      } else if (typeof expected === 'object' && expected.min !== undefined) {
        if (actual >= expected.min && actual <= expected.max) {
          matches++;
        }
      } else if (actual === expected) {
        matches++;
      }
    }

    // Require 80% match and at least 2 checks
    if (checks >= 2 && matches / checks >= 0.8) {
      return Object.values(ClientPatterns).find(p => p.id === clientId);
    }
  }

  return null;
}

/**
 * Extract connection metadata from MCP server context
 */
export function extractConnectionInfo(server, transport) {
  const info = {};

  try {
    // Extract from transport if available
    if (transport && transport.socket) {
      info.remoteAddress = transport.socket.remoteAddress;
      info.remotePort = transport.socket.remotePort;
    }

    // Extract from process environment
    info.environment = {
      TERM_PROGRAM: process.env.TERM_PROGRAM,
      EDITOR: process.env.EDITOR,
      VSCODE_PID: process.env.VSCODE_PID,
      CURSOR_PID: process.env.CURSOR_PID
    };

    // Extract from server capabilities if available
    if (server && server.capabilities) {
      info.serverCapabilities = server.capabilities;
    }

    logger.debug('Connection info extracted', { 
      hasSocket: !!transport?.socket,
      envVars: Object.keys(info.environment).filter(k => info.environment[k])
    });

  } catch (error) {
    logger.warning('Failed to extract connection info', { error: error.message });
  }

  return info;
}

/**
 * Update client capabilities based on runtime behavior
 */
export function updateClientCapabilities(clientContext, behaviorData) {
  const { 
    avgResponseTime, 
    errorRate, 
    toolUsagePattern,
    responseSize 
  } = behaviorData;

  // Adjust rate limits based on error rate
  if (errorRate > 0.1) {
    clientContext.capabilities.rateLimit.requests *= 0.8;
    logger.info('Reduced rate limit due to high error rate', { 
      client: clientContext.client.id,
      errorRate,
      newLimit: clientContext.capabilities.rateLimit.requests
    });
  }

  // Adjust max response size based on actual usage
  if (responseSize && responseSize > clientContext.capabilities.maxResponseSize) {
    clientContext.capabilities.maxResponseSize = Math.min(
      responseSize * 1.2,
      clientContext.capabilities.maxResponseSize * 2
    );
    logger.info('Increased max response size', { 
      client: clientContext.client.id,
      newSize: clientContext.capabilities.maxResponseSize
    });
  }

  return clientContext;
}

export default {
  ClientPatterns,
  ClientContext,
  detectClient,
  extractConnectionInfo,
  updateClientCapabilities,
  DEFAULT_CLIENT
};