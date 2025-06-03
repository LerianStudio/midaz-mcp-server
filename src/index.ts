#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Node.js globals
declare const process: any;
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeSecurity } from './util/security.js';
import { initializeManifest } from './util/docs-manifest.js';
import { initializeMcpLogger, createLogger, logLifecycleEvent, logConfigEvent, logLoggingConfig } from './util/mcp-logging.js';

// Import unified tools (consolidates 17 tools into 2)
import { registerUnifiedDocumentationTool } from './tools/docs-unified.js';
import { registerUnifiedLearningTool } from './tools/learn-unified.js';

// Import discovery prompts
import { registerDiscoveryPrompts } from './prompts/tool-discovery.js';

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

// Resources completely removed - no subscription handlers needed

// Import client detection system
import { initializeClientDetection } from './util/client-integration.js';

/**
 * Create an MCP server for Midaz
 */
const main = async () => {
  try {
    // Initialize silently - no console output until after MCP connection
    initializeSecurity();
    logConfigEvent('security_initialized');

    await initializeManifest();
    logConfigEvent('docs_manifest_initialized');

    // Collect all capabilities with unified tools
    const capabilities = {
      resources: false, // Completely removed
      tools: {
        // Financial/Ledger tools (18 tools)
        organization: true,
        ledger: true,
        account: true,
        transaction: true,
        balance: true,
        asset: true,
        portfolio: true,
        segment: true,
        sdk: true,
        // Unified documentation & learning (2 tools - replaces 17 tools)
        unifiedDocumentation: true,
        unifiedLearning: true,
        // Status monitoring
        statusMonitoring: true
      },
      prompts: true, // Enable tool discovery prompts
      logging: true
    };

    // Create the MCP server with declared capabilities
    const server = new McpServer({
      name: 'midaz-mcp-server',
      version: '2.8.0',
      capabilities
    });

    // Initialize MCP logger
    initializeMcpLogger(server);
    logLoggingConfig();
    const logger = createLogger('server');
    
    // Log startup (to logger only, not console during MCP startup)
    logLifecycleEvent('starting', { version: '2.5.1', capabilities });
    logger.info('Server initialization started', { version: '2.5.1' });

    // Register unified tools (major consolidation: 17 → 2 tools)
    registerUnifiedDocumentationTool(server);
    registerUnifiedLearningTool(server);
    logger.info('✅ Unified tools registered - reduced from 17 to 2 tools for MCP client compatibility');
    
    // Register discovery prompts
    registerDiscoveryPrompts(server);
    logger.info('✅ Discovery prompts registered - helps users find and use tools');

    // Register financial/ledger tools (18 tools total)
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
    logger.info('✅ Financial API tools registered', { toolCount: 18, categories: financialTools.length });

    // Total tool count: 2 unified + 18 financial + 1 status = 21 tools (down from ~40)
    logger.info('🎯 Total tools registered: ~21 (major reduction for MCP client compatibility)');

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    
    // Initialize client detection system before connecting
    const clientContext = await initializeClientDetection(server);
    logger.info('Client detected and configured', { 
      client: clientContext.client.name,
      capabilities: Object.keys(clientContext.capabilities).length
    });
    
    await server.connect(transport);
    
    // Log internally only - no console output to keep stdio clean
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