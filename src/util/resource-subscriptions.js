/**
 * Resource Subscription Management
 * 
 * This module implements resource subscriptions and change notifications
 * following the MCP protocol specifications.
 */

import { watch } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { 
  SubscribeRequestSchema, 
  UnsubscribeRequestSchema,
  McpError,
  ErrorCode 
} from '@modelcontextprotocol/sdk/types.js';

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
 * @param {Object} mcpServer - MCP server instance
 */
export function setupSubscriptionHandlers(mcpServer) {
  // Get the underlying server instance
  const server = mcpServer.server;
  
  // Register subscription capability
  server.registerCapabilities({
    resources: {
      subscribe: true
    }
  });

  // Handle subscribe requests
  server.setRequestHandler(SubscribeRequestSchema, async (request) => {
    const { uri } = request.params;
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      subscriptionManager.subscribe(uri, subscriptionId, (event) => {
        // Send notification to client
        server.sendResourceUpdated({
          uri: event.uri
        });
      });

      return {
        _meta: {
          subscriptionId
        }
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid subscription request',
        { error: error.message }
      );
    }
  });

  // Handle unsubscribe requests
  server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
    const { uri } = request.params;

    // Find and remove subscriptions for this URI
    let removed = false;
    const subscriptions = subscriptionManager.listSubscriptions();
    
    for (const sub of subscriptions) {
      if (sub.uri === uri) {
        subscriptionManager.unsubscribe(sub.subscriptionId);
        removed = true;
      }
    }

    if (!removed) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'No subscription found for URI'
      );
    }

    return {};
  });
}

/**
 * Dynamic tool/resource discovery
 * Note: These are non-standard extensions and may not be supported by all clients
 * @param {Object} mcpServer - MCP server instance
 */
export function setupDiscoveryHandlers(mcpServer) {
  // Discovery is not part of the standard MCP protocol
  // These handlers won't work with the standard SDK
  console.warn('Discovery handlers are non-standard and not supported by the MCP SDK');
}