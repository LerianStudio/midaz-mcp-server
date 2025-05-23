/**
 * Resource Subscription Management
 * 
 * This module implements resource subscriptions and change notifications
 * following the MCP protocol specifications.
 */

import { watch } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Subscription manager
class SubscriptionManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
    this.watchers = new Map();
  }

  /**
   * Subscribe to resource changes
   * @param {string} uri - Resource URI
   * @param {string} subscriptionId - Unique subscription ID
   * @param {Function} callback - Callback for changes
   */
  subscribe(uri, subscriptionId, callback) {
    // Parse URI to get file path
    const resourcePath = this.uriToPath(uri);
    if (!resourcePath) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    // Store subscription
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Map());
    }
    this.subscriptions.get(uri).set(subscriptionId, callback);

    // Set up file watcher if not already watching
    if (!this.watchers.has(resourcePath)) {
      this.setupWatcher(resourcePath, uri);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from resource changes
   * @param {string} subscriptionId - Subscription to remove
   */
  unsubscribe(subscriptionId) {
    for (const [uri, subs] of this.subscriptions.entries()) {
      if (subs.has(subscriptionId)) {
        subs.delete(subscriptionId);
        
        // Remove watcher if no more subscriptions
        if (subs.size === 0) {
          this.subscriptions.delete(uri);
          const resourcePath = this.uriToPath(uri);
          if (resourcePath && this.watchers.has(resourcePath)) {
            this.watchers.get(resourcePath).close();
            this.watchers.delete(resourcePath);
          }
        }
        
        return true;
      }
    }
    return false;
  }

  /**
   * Set up file watcher for a resource
   * @param {string} filePath - File path to watch
   * @param {string} uri - Resource URI
   */
  setupWatcher(filePath, uri) {
    try {
      const watcher = watch(filePath, (eventType) => {
        if (eventType === 'change') {
          this.notifySubscribers(uri);
        }
      });

      this.watchers.set(filePath, watcher);
    } catch (error) {
      console.error(`Failed to watch resource ${uri}:`, error);
    }
  }

  /**
   * Notify all subscribers of a resource change
   * @param {string} uri - Resource URI that changed
   */
  notifySubscribers(uri) {
    const subscribers = this.subscriptions.get(uri);
    if (!subscribers) return;

    const changeEvent = {
      uri,
      timestamp: new Date().toISOString(),
      type: 'content_changed'
    };

    for (const [subscriptionId, callback] of subscribers.entries()) {
      try {
        callback(changeEvent);
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriptionId}:`, error);
      }
    }

    // Emit global change event
    this.emit('resourceChanged', changeEvent);
  }

  /**
   * Convert URI to file path
   * @param {string} uri - Resource URI
   * @returns {string|null} File path or null
   */
  uriToPath(uri) {
    if (!uri.startsWith('midaz://')) {
      return null;
    }

    const parts = uri.substring(8).split('/');
    if (parts.length < 2) {
      return null;
    }

    const category = parts[0];
    const resource = parts.slice(1).join('/');

    // Map to actual file paths
    const basePath = path.join(process.cwd(), 'src', 'resources', 'markdown');
    return path.join(basePath, category, `${resource}.md`);
  }

  /**
   * List all active subscriptions
   * @returns {Array} List of active subscriptions
   */
  listSubscriptions() {
    const list = [];
    for (const [uri, subs] of this.subscriptions.entries()) {
      for (const subscriptionId of subs.keys()) {
        list.push({ uri, subscriptionId });
      }
    }
    return list;
  }

  /**
   * Get changed resources since a timestamp
   * @param {number} since - Timestamp in milliseconds
   * @returns {Array} List of changed resources
   */
  listChanged(since) {
    // This would typically query a change log
    // For now, return empty array
    return [];
  }
}

// Global subscription manager instance
export const subscriptionManager = new SubscriptionManager();

/**
 * MCP-compliant subscription handler
 * @param {Object} server - MCP server instance
 */
export function setupSubscriptionHandlers(server) {
  // Handle subscribe requests
  server.setRequestHandler('resources/subscribe', async (request) => {
    const { uri } = request.params;
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      subscriptionManager.subscribe(uri, subscriptionId, (event) => {
        // Send notification to client
        server.sendNotification('resources/changed', {
          subscriptionId,
          ...event
        });
      });

      return {
        subscriptionId,
        uri
      };
    } catch (error) {
      throw {
        code: -32602,
        message: 'Invalid subscription request',
        data: { error: error.message }
      };
    }
  });

  // Handle unsubscribe requests
  server.setRequestHandler('resources/unsubscribe', async (request) => {
    const { subscriptionId } = request.params;

    const success = subscriptionManager.unsubscribe(subscriptionId);
    if (!success) {
      throw {
        code: -32602,
        message: 'Invalid subscription ID'
      };
    }

    return { success: true };
  });

  // Handle list changed requests
  server.setRequestHandler('resources/listChanged', async (request) => {
    const { since } = request.params;
    const sinceTimestamp = since ? new Date(since).getTime() : 0;

    const changed = subscriptionManager.listChanged(sinceTimestamp);
    return { changed };
  });
}

/**
 * Dynamic tool/resource discovery
 * @param {Object} server - MCP server instance
 */
export function setupDiscoveryHandlers(server) {
  // Discover available tools
  server.setRequestHandler('tools/discover', async () => {
    const tools = [];
    
    // Get all registered tools
    if (server._tools) {
      for (const [name, tool] of server._tools.entries()) {
        tools.push({
          name,
          description: tool.description,
          inputSchema: tool.inputSchema
        });
      }
    }

    return { tools };
  });

  // Discover available resources
  server.setRequestHandler('resources/discover', async () => {
    const resources = [];
    
    // Get all registered resources
    if (server._resources) {
      for (const [name, resource] of server._resources.entries()) {
        resources.push({
          name,
          uri: resource.uri,
          description: resource.description
        });
      }
    }

    return { resources };
  });

  // Server capabilities
  server.setRequestHandler('server/capabilities', async () => {
    return {
      capabilities: {
        tools: true,
        resources: true,
        subscriptions: true,
        discovery: true,
        pagination: true,
        logging: true
      },
      version: '1.0.0',
      name: 'midaz-mcp-server'
    };
  });
}