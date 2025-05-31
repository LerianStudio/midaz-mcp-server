#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Node.js globals
declare const process: any;
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeSecurity } from './util/security.js';
import { initializeManifest } from './util/docs-manifest.js';
import { initializeMcpLogger, createLogger, logLifecycleEvent, logConfigEvent, logLoggingConfig } from './util/mcp-logging.js';

// Import NEW consolidated tools
import { registerMidazDocsTools } from './tools/midaz-docs.js';
import { registerMidazApiTools } from './tools/midaz-api.js';
import { registerMidazGenerateTools } from './tools/midaz-generate.js';
import { registerMidazStatusTools } from './tools/midaz-status.js';

// Import client detection system
import { initializeClientDetection } from './util/client-integration.js';

/**
 * Create consolidated MCP server for Midaz
 * Replaces 18+ tools with 4 focused, working tools
 */
const main = async () => {
  try {
    // Initialize silently - no console output until after MCP connection
    initializeSecurity();
    logConfigEvent('security_initialized');

    await initializeManifest();
    logConfigEvent('docs_manifest_initialized');

    // Consolidated capabilities - 4 focused tools instead of 18+ redundant ones
    const capabilities = {
      resources: false, // No mock resources
      tools: {
        // Unified tools with real functionality
        midaz_docs: true,        // Unified documentation search (replaces 8 doc tools)
        midaz_api: true,         // Real API interaction (replaces 9 CRUD tools)
        midaz_generate: true,    // Intelligent code generation (replaces examples)
        midaz_status: true       // Real health monitoring (replaces mock status)
      },
      prompts: false,
      logging: true
    };

    // Create the MCP server
    const server = new McpServer({
      name: 'midaz-mcp-server-consolidated',
      version: '3.0.0',
      capabilities
    });

    // Initialize MCP logger
    initializeMcpLogger(server);
    logLoggingConfig();
    const logger = createLogger('consolidated-server');
    
    // Log startup
    logLifecycleEvent('starting_consolidated', { version: '3.0.0', capabilities });
    logger.info('Consolidated server initialization started', { version: '3.0.0' });

    // Register the 4 consolidated tools
    registerMidazDocsTools(server);
    logger.info('✅ midaz_docs registered - unified documentation search');
    
    registerMidazApiTools(server);
    logger.info('✅ midaz_api registered - real API connectivity with auth');
    
    registerMidazGenerateTools(server);
    logger.info('✅ midaz_generate registered - intelligent code generation');
    
    registerMidazStatusTools(server);
    logger.info('✅ midaz_status registered - real health monitoring');

    logger.info('🚀 All consolidated tools registered successfully');
    logger.info('📊 Reduced from 18+ tools to 4 focused tools with real functionality');

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    
    // Initialize client detection
    const clientContext = await initializeClientDetection(server);
    logger.info('Client detected and configured', { 
      client: clientContext.client.name,
      capabilities: Object.keys(clientContext.capabilities).length
    });
    
    await server.connect(transport);
    
    // Log success
    logLifecycleEvent('consolidated_started', { 
      transport: 'stdio', 
      client: clientContext.client.name,
      toolCount: 4,
      timestamp: new Date().toISOString() 
    });
    logger.info('🎯 Consolidated server ready - real API connectivity, no mock data');
    
  } catch (error) {
    console.error('❌ Error starting Consolidated Midaz MCP Server:', error);
    if (typeof logLifecycleEvent === 'function') {
      const errorInfo = error instanceof Error ? {
        error: error.message, 
        stack: error.stack
      } : {
        error: String(error)
      };
      logLifecycleEvent('consolidated_startup_failed', { 
        ...errorInfo,
        timestamp: new Date().toISOString()
      });
    }
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error in Consolidated Midaz MCP Server:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});
