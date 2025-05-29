#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Node.js globals
declare const process: any;
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeSecurity } from './util/security.js';
import { initializeManifest } from './util/docs-manifest.js';
import { initializeMcpLogger, createLogger, logLifecycleEvent, logConfigEvent, logLoggingConfig } from './util/mcp-logging.js';

// Import comprehensive documentation tools (replaces resource system)
import { registerAllDocumentationTools } from './tools/docs-registry.js';
import { registerDocsDemoTools } from './tools/docs-demo.js';

// Import tool definitions
import { registerOrganizationTools } from './tools/organization.js';
import { registerLedgerTools } from './tools/ledger.js';
import { registerAccountTools } from './tools/account.js';
import { registerTransactionTools } from './tools/transaction.js';
import { registerBalanceTools } from './tools/balance.js';
import { registerAssetTools } from './tools/asset.js';
// Removed asset-rate tools import
import { registerPortfolioTools } from './tools/portfolio.js';
import { registerSegmentTools } from './tools/segment.js';
import { registerSdkTools } from './tools/sdk.js';

// Import MCP protocol handlers
import { setupSubscriptionHandlers } from './util/resource-subscriptions.js';

// Import client detection system
import { initializeClientDetection } from './util/client-integration.js';

/**
 * Create an MCP server for Midaz
 */
const main = async () => {
  try {
    // Initialize security module
    console.error('🔒 Initializing security module...');
    initializeSecurity();
    logConfigEvent('security_initialized');

    // Initialize documentation manifest system
    console.error('📚 Initializing documentation manifest...');
    await initializeManifest();
    logConfigEvent('docs_manifest_initialized');

    // Collect all capabilities with comprehensive documentation tools (no resources)
    const capabilities = {
      resources: false, // Replaced with comprehensive documentation tools
      tools: {
        // Financial/Ledger tools
        organization: true,
        ledger: true,
        account: true,
        transaction: true,
        balance: true,
        asset: true,
        portfolio: true,
        segment: true,
        sdk: true,
        // Comprehensive documentation tools
        documentationSystem: true,
        apiReference: true,
        codeExamples: true,
        troubleshooting: true,
        architectureDocs: true,
        interactiveTutorials: true
      },
      prompts: false,
      logging: true
    };

    // Create the MCP server with declared capabilities
    const server = new McpServer({
      name: 'midaz-mcp-server',
      version: '2.4.1',
      capabilities
    });

    // Initialize MCP logger
    initializeMcpLogger(server);
    logLoggingConfig();
    const logger = createLogger('server');
    
    // Log startup
    console.error('🚀 Starting Midaz MCP Server...');
    logLifecycleEvent('starting', { version: '1.0.0', capabilities });
    logger.info('Server initialization started', { version: '1.0.0' });

    // Register comprehensive documentation tools (replaces resources)
    console.error('📚 Registering comprehensive documentation tools...');
    registerAllDocumentationTools(server);
    registerDocsDemoTools(server);
    logger.info('Documentation tools registered successfully - replaces resource system for broader compatibility');

    // Register financial/ledger tools
    console.error('🔧 Registering financial/ledger tools...');
    const financialTools = [
      'organization', 'ledger', 'account', 'transaction', 
      'balance', 'asset', 'portfolio', 'segment', 'sdk'
    ];
    registerOrganizationTools(server);
    registerLedgerTools(server);
    registerAccountTools(server);
    registerTransactionTools(server);
    registerBalanceTools(server);
    registerAssetTools(server);
    registerPortfolioTools(server);
    registerSegmentTools(server);
    registerSdkTools(server);
    logger.info('Financial tools registered', { toolCount: financialTools.length, tools: financialTools });

    // Setup MCP protocol handlers for subscriptions and discovery
    console.error('🔌 Setting up MCP protocol handlers...');
    setupSubscriptionHandlers(server);
    logger.info('Protocol handlers configured');
    // Note: Discovery handlers are non-standard and not supported by the MCP SDK

    // Connect to stdio transport
    console.error('🔗 Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    
    // Initialize client detection system before connecting
    console.error('🎯 Initializing client detection...');
    const clientContext = await initializeClientDetection(server);
    logger.info('Client detected and configured', { 
      client: clientContext.client.name,
      capabilities: Object.keys(clientContext.capabilities).length
    });
    
    await server.connect(transport);
    
    console.error('✅ Midaz MCP Server running successfully!');
    logLifecycleEvent('started', { 
      transport: 'stdio', 
      client: clientContext.client.name,
      timestamp: new Date().toISOString() 
    });
    logger.info('Server ready to accept requests');
  } catch (error) {
    console.error('❌ Error starting Midaz MCP Server:', error);
    if (typeof logLifecycleEvent === 'function') {
      const errorInfo = error instanceof Error ? {
        error: error.message, 
        stack: error.stack
      } : {
        error: String(error)
      };
      logLifecycleEvent('startup_failed', { 
        ...errorInfo,
        timestamp: new Date().toISOString()
      });
    }
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error in Midaz MCP Server:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}); 