/**
 * Client Detection Integration Layer
 * Integrates client detection, adaptation, and configuration into the MCP server
 */

import { createLogger } from './mcp-logging.js';
import { detectClient, extractConnectionInfo } from './client-detection.js';
import { adaptationManager, adaptTool } from './client-adaptation.js';
import { configManager } from './client-config.js';
import { toolRegistry } from './tool-registry.js';
import { ResponseFormatter } from './response-formatter.js';

const logger = createLogger('client-integration');

/**
 * Client Integration Manager
 * Orchestrates all client-specific functionality
 */
export class ClientIntegrationManager {
  constructor() {
    this.currentClient = null;
    this.responseFormatter = null;
    this.behaviorTracker = new Map();
    this.connectionStats = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the integration manager with server instance
   */
  async initialize(server, transport = null) {
    try {
      logger.info('Initializing client integration manager');
      
      // Extract connection information
      const connectionInfo = extractConnectionInfo(server, transport);
      
      // Detect client
      this.currentClient = detectClient(connectionInfo);
      
      // Get client configuration
      const clientConfig = configManager.getConfig(this.currentClient.client.id);
      
      // Update client context with configuration
      this.currentClient.capabilities = {
        ...this.currentClient.capabilities,
        ...clientConfig
      };
      
      // Set up adaptation manager
      adaptationManager.setClientContext(this.currentClient);
      
      // Initialize response formatter
      this.responseFormatter = new ResponseFormatter(this.currentClient);
      
      // Initialize behavior tracking
      this.initializeBehaviorTracking();
      
      // Set up server hooks
      this.setupServerHooks(server);
      
      this.isInitialized = true;
      
      logger.info('Client integration initialized', {
        client: this.currentClient.client.name,
        detectionMethod: this.currentClient.detectionMethod,
        sessionId: this.currentClient.sessionId
      });
      
      return this.currentClient;
    } catch (error) {
      logger.error('Failed to initialize client integration', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up server hooks for request/response interception
   */
  setupServerHooks(server) {
    // Intercept tool list requests
    const originalListTools = server.listTools?.bind(server);
    if (originalListTools) {
      server.listTools = async (...args) => {
        try {
          const tools = await originalListTools(...args);
          return this.filterToolsForClient(tools);
        } catch (error) {
          return this.handleError(error, 'listTools');
        }
      };
    }

    // Intercept tool execution
    this.setupToolExecutionHooks(server);
    
    // Intercept resource requests
    this.setupResourceHooks(server);
    
    logger.debug('Server hooks configured');
  }

  /**
   * Set up tool execution hooks
   */
  setupToolExecutionHooks(server) {
    const originalCallTool = server.callTool?.bind(server);
    if (originalCallTool) {
      server.callTool = async (request, ...args) => {
        const startTime = Date.now();
        const toolName = request.params?.name;
        
        try {
          // Track tool call
          this.trackToolCall(toolName, 'start');
          
          // Adapt parameters
          const adaptedRequest = this.adaptToolRequest(request);
          
          // Execute tool
          const result = await originalCallTool(adaptedRequest, ...args);
          
          // Format response
          const formattedResult = this.formatToolResponse(result, toolName);
          
          // Track success
          const duration = Date.now() - startTime;
          this.trackToolCall(toolName, 'success', { duration });
          
          return formattedResult;
        } catch (error) {
          // Track error
          const duration = Date.now() - startTime;
          this.trackToolCall(toolName, 'error', { duration, error: error.message });
          
          return this.handleError(error, toolName);
        }
      };
    }
  }

  /**
   * Set up resource request hooks
   */
  setupResourceHooks(server) {
    const originalListResources = server.listResources?.bind(server);
    if (originalListResources) {
      server.listResources = async (...args) => {
        try {
          const resources = await originalListResources(...args);
          return this.filterResourcesForClient(resources);
        } catch (error) {
          return this.handleError(error, 'listResources');
        }
      };
    }

    const originalReadResource = server.readResource?.bind(server);
    if (originalReadResource) {
      server.readResource = async (request, ...args) => {
        try {
          const resource = await originalReadResource(request, ...args);
          return this.formatResourceResponse(resource);
        } catch (error) {
          return this.handleError(error, 'readResource');
        }
      };
    }
  }

  /**
   * Filter tools based on client capabilities
   */
  filterToolsForClient(tools) {
    if (!this.currentClient) return tools;
    
    const filteredTools = toolRegistry.getFilteredTools(this.currentClient);
    
    logger.debug('Tools filtered', {
      original: tools.length,
      filtered: filteredTools.length,
      client: this.currentClient.client.id
    });
    
    return filteredTools;
  }

  /**
   * Filter resources based on client capabilities
   */
  filterResourcesForClient(resources) {
    if (!this.currentClient) return resources;
    
    const complexity = this.currentClient.capabilities.toolComplexity;
    const supportsBinary = this.currentClient.capabilities.supportsBinaryContent;
    const supportsImages = this.currentClient.capabilities.supportsImages;
    
    return resources.filter(resource => {
      // Filter by complexity
      if (resource.complexity && !this.currentClient.supportsToolComplexity(resource.complexity)) {
        return false;
      }
      
      // Filter binary content
      if (resource.mimeType && resource.mimeType.startsWith('application/') && !supportsBinary) {
        return false;
      }
      
      // Filter images
      if (resource.mimeType && resource.mimeType.startsWith('image/') && !supportsImages) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Adapt tool request based on client limitations
   */
  adaptToolRequest(request) {
    if (!this.currentClient) return request;
    
    const toolName = request.params?.name;
    const params = request.params?.arguments || {};
    
    // Adapt parameters through adaptation manager
    const adaptedParams = adaptationManager.adaptToolParameters(toolName, params);
    
    return {
      ...request,
      params: {
        ...request.params,
        arguments: adaptedParams
      }
    };
  }

  /**
   * Format tool response for client
   */
  formatToolResponse(response, toolName) {
    if (!this.responseFormatter) return response;
    
    // Use response formatter
    return this.responseFormatter.format(response, {
      toolName,
      includeMetadata: this.currentClient.capabilities.outputFormat === 'developer'
    });
  }

  /**
   * Format resource response for client
   */
  formatResourceResponse(response) {
    if (!this.responseFormatter) return response;
    
    return this.responseFormatter.format(response, {
      type: 'json', // Resources are typically JSON
      preserveStructure: true
    });
  }

  /**
   * Handle errors with client-appropriate formatting
   */
  handleError(error, context) {
    if (!this.responseFormatter) {
      throw error; // Re-throw if no formatter available
    }
    
    logger.error('Handling client error', {
      error: error.message,
      context,
      client: this.currentClient?.client?.id
    });
    
    return this.responseFormatter.formatError(error, { context });
  }

  /**
   * Track tool call behavior
   */
  trackToolCall(toolName, event, data = {}) {
    if (!toolName) return;
    
    const clientId = this.currentClient?.client?.id || 'unknown';
    const key = `${clientId}:${toolName}`;
    
    if (!this.behaviorTracker.has(key)) {
      this.behaviorTracker.set(key, {
        calls: 0,
        successes: 0,
        errors: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastCall: null,
        errorRate: 0
      });
    }
    
    const stats = this.behaviorTracker.get(key);
    
    switch (event) {
      case 'start':
        stats.calls++;
        stats.lastCall = new Date().toISOString();
        break;
        
      case 'success':
        stats.successes++;
        if (data.duration) {
          stats.totalDuration += data.duration;
          stats.avgDuration = stats.totalDuration / stats.successes;
        }
        break;
        
      case 'error':
        stats.errors++;
        if (data.duration) {
          stats.totalDuration += data.duration;
          stats.avgDuration = stats.totalDuration / (stats.successes + stats.errors);
        }
        break;
    }
    
    // Update error rate
    const totalAttempts = stats.successes + stats.errors;
    stats.errorRate = totalAttempts > 0 ? stats.errors / totalAttempts : 0;
    
    // Trigger adaptive updates if error rate is high
    if (stats.errorRate > 0.2 && totalAttempts >= 5) {
      this.triggerAdaptiveUpdate(clientId, stats);
    }
  }

  /**
   * Trigger adaptive configuration updates
   */
  triggerAdaptiveUpdate(clientId, behaviorData) {
    try {
      // Calculate adaptive settings
      const adaptiveData = {
        errorRate: behaviorData.errorRate,
        avgResponseTime: behaviorData.avgDuration,
        avgResponseSize: this.responseFormatter?.getSizeStats()?.[clientId]?.avg || 0
      };
      
      // Update configuration
      configManager.updateAdaptiveSettings(clientId, adaptiveData);
      
      // Refresh client capabilities
      const newConfig = configManager.getConfig(clientId);
      this.currentClient.capabilities = {
        ...this.currentClient.capabilities,
        ...newConfig
      };
      
      logger.info('Adaptive configuration updated', {
        client: clientId,
        errorRate: behaviorData.errorRate,
        changes: Object.keys(adaptiveData)
      });
    } catch (error) {
      logger.error('Failed to apply adaptive update', { error: error.message });
    }
  }

  /**
   * Initialize behavior tracking
   */
  initializeBehaviorTracking() {
    // Set up periodic behavior analysis
    setInterval(() => {
      this.analyzeBehaviorPatterns();
    }, 60000); // Every minute
    
    logger.debug('Behavior tracking initialized');
  }

  /**
   * Analyze behavior patterns for insights
   */
  analyzeBehaviorPatterns() {
    if (this.behaviorTracker.size === 0) return;
    
    const patterns = {
      highErrorTools: [],
      slowTools: [],
      frequentTools: [],
      unusedTools: []
    };
    
    for (const [key, stats] of this.behaviorTracker.entries()) {
      const [clientId, toolName] = key.split(':');
      
      if (stats.errorRate > 0.3) {
        patterns.highErrorTools.push({ clientId, toolName, errorRate: stats.errorRate });
      }
      
      if (stats.avgDuration > 10000) {
        patterns.slowTools.push({ clientId, toolName, avgDuration: stats.avgDuration });
      }
      
      if (stats.calls > 10) {
        patterns.frequentTools.push({ clientId, toolName, calls: stats.calls });
      }
      
      if (stats.calls === 0) {
        patterns.unusedTools.push({ clientId, toolName });
      }
    }
    
    if (patterns.highErrorTools.length > 0 || patterns.slowTools.length > 0) {
      logger.warn('Behavior analysis found issues', {
        highErrorTools: patterns.highErrorTools.length,
        slowTools: patterns.slowTools.length
      });
    }
  }

  /**
   * Get current client information
   */
  getCurrentClient() {
    return this.currentClient;
  }

  /**
   * Get integration statistics
   */
  getStats() {
    return {
      currentClient: this.currentClient ? {
        id: this.currentClient.client.id,
        name: this.currentClient.client.name,
        sessionId: this.currentClient.sessionId,
        detectionMethod: this.currentClient.detectionMethod
      } : null,
      isInitialized: this.isInitialized,
      behaviorStats: this.getBehaviorStats(),
      responseStats: this.responseFormatter?.getSizeStats() || {},
      configStats: configManager.getStats()
    };
  }

  /**
   * Get behavior statistics
   */
  getBehaviorStats() {
    const stats = {
      totalTrackedTools: this.behaviorTracker.size,
      avgErrorRate: 0,
      avgDuration: 0,
      mostUsedTools: [],
      problemTools: []
    };
    
    let totalErrorRate = 0;
    let totalDuration = 0;
    let toolCount = 0;
    
    for (const [key, data] of this.behaviorTracker.entries()) {
      const [, toolName] = key.split(':');
      
      totalErrorRate += data.errorRate;
      totalDuration += data.avgDuration;
      toolCount++;
      
      if (data.calls > 5) {
        stats.mostUsedTools.push({ tool: toolName, calls: data.calls });
      }
      
      if (data.errorRate > 0.3) {
        stats.problemTools.push({ tool: toolName, errorRate: data.errorRate });
      }
    }
    
    if (toolCount > 0) {
      stats.avgErrorRate = totalErrorRate / toolCount;
      stats.avgDuration = totalDuration / toolCount;
    }
    
    stats.mostUsedTools.sort((a, b) => b.calls - a.calls).slice(0, 10);
    stats.problemTools.sort((a, b) => b.errorRate - a.errorRate);
    
    return stats;
  }

  /**
   * Reset tracking data
   */
  reset() {
    this.behaviorTracker.clear();
    this.connectionStats.clear();
    this.currentClient = null;
    this.responseFormatter = null;
    this.isInitialized = false;
    
    logger.info('Client integration manager reset');
  }
}

// Global integration manager instance
export const clientIntegration = new ClientIntegrationManager();

/**
 * Initialize client detection for MCP server
 */
export async function initializeClientDetection(server, transport = null) {
  return await clientIntegration.initialize(server, transport);
}

/**
 * Get current client context
 */
export function getCurrentClientContext() {
  return clientIntegration.getCurrentClient();
}

/**
 * Create client-aware tool wrapper
 */
export function createClientAwareTool(toolName, handler, complexity = 'medium') {
  return adaptTool(toolName, async (params) => {
    // Register tool with registry if not already registered
    if (!toolRegistry.tools.has(toolName)) {
      const metadata = {
        name: toolName,
        complexity,
        category: 'financial' // Default category
      };
      toolRegistry.register(toolName, { name: toolName }, handler, metadata);
    }
    
    // Execute through registry for proper tracking
    return await toolRegistry.executeTool(toolName, params, clientIntegration.getCurrentClient());
  }, complexity);
}

export default {
  ClientIntegrationManager,
  clientIntegration,
  initializeClientDetection,
  getCurrentClientContext,
  createClientAwareTool
};