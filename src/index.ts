#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Node.js globals
declare const process: any;
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeSecurity } from './util/security.js';
import { initializeManifest } from './util/docs-manifest.js';
import { initializeMcpLogger, createLogger, logLifecycleEvent, logConfigEvent, logLoggingConfig } from './util/mcp-logging.js';
import { globalErrorMonitor, trackAsyncOperation, ErrorSeverity } from './util/error-monitoring.js';

// Import unified tools (consolidates 17 tools into 2)
import { registerUnifiedDocumentationTool } from './tools/docs-unified.js';
import { registerUnifiedLearningTool } from './tools/learn-unified.js';

// Import discovery prompts
import { registerDiscoveryPrompts } from './prompts/tool-discovery.js';
import { registerWorkflowPrompts } from './prompts/midaz-workflows.js';
import { registerAdvancedPrompts } from './prompts/advanced-workflows.js';

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
import { registerMonitoringTools } from './tools/monitoring.js';

// Resources completely removed - no subscription handlers needed

// Import client detection system
import { initializeClientDetection } from './util/client-integration.js';

/**
 * Create an MCP server for Lerian
 * 
 * This server provides Model Context Protocol (MCP) access to Lerian's financial ledger system.
 * It offers read-only API access, documentation, learning resources, and SDK code generation
 * for AI assistants like Claude, ChatGPT, and others.
 * 
 * @since 3.0.0 - Rebranded from Midaz to Lerian with full backward compatibility
 */
const main = async () => {
  return await trackAsyncOperation('server_startup', async () => {
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
      name: 'lerian-mcp-server',
      version: '3.0.0',
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
    logger.info('✅ Unified tools registered - 2 tools for MCP client compatibility');

    // Register discovery prompts
    registerDiscoveryPrompts(server);
    logger.info('✅ Discovery prompts registered - helps users find and use tools');

    // Register workflow prompts
    registerWorkflowPrompts(server);
    logger.info('✅ Workflow prompts registered - contextual wizards and troubleshooting');

    // Register advanced prompts
    registerAdvancedPrompts(server);
    logger.info('✅ Advanced prompts registered - CSV analysis, hierarchy discovery, tools catalog');

    // Fix prompt list handler to work around Zod compatibility issue
    server.server.setRequestHandler(ListPromptsRequestSchema, () => {
      try {
        logger.info('Listing prompts - using known prompts list');

        // Return the complete list of known prompts since they are registered but not accessible via server properties
        const knownPrompts = [
          {
            name: "help-me-start",
            description: "Show me what I can do with this Lerian MCP server and how to get started quickly",
            arguments: []
          },
          {
            name: "help-with-api",
            description: "Show me how to use the Midaz API effectively with practical examples",
            arguments: []
          },
          {
            name: "help-me-learn",
            description: "Get personalized learning guidance for Midaz based on your role and experience",
            arguments: [
              { name: "role", description: "Your primary role (developer, admin, business, explorer)", required: false },
              { name: "experience", description: "Your experience level (beginner, intermediate, advanced)", required: false }
            ]
          },
          {
            name: "create-transaction-wizard",
            description: "Guide me through creating a transaction step by step with my actual Midaz data",
            arguments: [
              { name: "organization_id", description: "Organization ID (will help find your ledgers)", required: false },
              { name: "ledger_id", description: "Ledger ID (will help find your accounts)", required: false },
              { name: "transaction_type", description: "Type of transaction", required: false },
              { name: "step", description: "Current step in the wizard (1-5)", required: false }
            ]
          },
          {
            name: "debug-my-balance",
            description: "Help me understand and troubleshoot balance issues with my accounts",
            arguments: [
              { name: "organization_id", description: "Organization ID to check", required: true },
              { name: "ledger_id", description: "Ledger ID to check", required: true },
              { name: "account_id", description: "Specific account ID to debug", required: false },
              { name: "issue_type", description: "Type of balance issue", required: false }
            ]
          },
          {
            name: "setup-my-org",
            description: "Guide me through setting up a new organization with ledgers, accounts, and initial configuration",
            arguments: [
              { name: "org_name", description: "Name for the new organization", required: false },
              { name: "business_type", description: "Type of business", required: false },
              { name: "setup_stage", description: "Current setup stage", required: false }
            ]
          },
          {
            name: "explain-my-data",
            description: "Help me understand my current Midaz data, balances, and transaction patterns",
            arguments: [
              { name: "organization_id", description: "Organization ID to analyze", required: true },
              { name: "ledger_id", description: "Specific ledger to focus on", required: false },
              { name: "analysis_type", description: "Type of analysis to perform", required: false },
              { name: "time_period", description: "Time period for analysis", required: false }
            ]
          },
          {
            name: "check-file-balances",
            description: "Analyze CSV, TXT, or JSON files to find account UUIDs and check their balances in Midaz",
            arguments: [
              { name: "file_content", description: "File content (CSV, TXT, or JSON format)", required: true },
              { name: "file_type", description: "File type (auto-detect if not specified)", required: false },
              { name: "organization_hint", description: "Hint for which organization to use", required: false },
              { name: "ledger_hint", description: "Hint for which ledger to use", required: false }
            ]
          },
          {
            name: "discover-midaz-hierarchy",
            description: "Explore the complete Midaz hierarchy: organizations → ledgers → assets → accounts → portfolios",
            arguments: [
              { name: "discovery_level", description: "How deep to explore the hierarchy", required: true },
              { name: "organization_id", description: "Focus on specific organization", required: false },
              { name: "ledger_id", description: "Focus on specific ledger", required: false },
              { name: "show_counts", description: "Include count statistics", required: false }
            ]
          },
          {
            name: "show-all-tools",
            description: "Display complete catalog of all Midaz MCP tools, operations, and parameters with descriptions",
            arguments: [
              { name: "category_filter", description: "Filter tools by category", required: false },
              { name: "detail_level", description: "Level of detail to show", required: false },
              { name: "show_parameters", description: "Include parameter details", required: false }
            ]
          }
        ];

        logger.info('Returning known prompts list', { promptCount: knownPrompts.length });
        return { prompts: knownPrompts };
      } catch (error) {
        logger.error('Error listing prompts', { error: String(error) });
        return { prompts: [] };
      }
    });
    logger.info('✅ Prompt list handler override applied');

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

    // Register monitoring tools
    registerMonitoringTools(server);
    logger.info('✅ Monitoring tools registered', { toolCount: 3, features: ['health-status', 'error-metrics', 'performance-metrics'] });

    // Total tool count: 2 unified + 18 financial + 3 monitoring = 23 tools (down from ~40)
    logger.info('🎯 Total tools registered: ~23');

    // Connect to stdio transport
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Initialize client detection system AFTER connecting to avoid race conditions
    const clientContext = await initializeClientDetection(server);
    logger.info('Client detected and configured', {
      client: clientContext.client.name,
      capabilities: Object.keys(clientContext.capabilities).length
    });

    // Log internally only - no console output to keep stdio clean
    logLifecycleEvent('started', {
      transport: 'stdio',
      client: clientContext.client.name,
      timestamp: new Date().toISOString()
    });
    logger.info('Server ready to accept requests');
  }, {
    version: '2.27.0',
    transport: 'stdio'
  });
};

// Run the main function
main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error('❌ Fatal error in Lerian MCP Server:', errorMessage);
  if (errorStack) {
    console.error('Stack trace:', errorStack);
  }

  // Log the fatal error
  globalErrorMonitor.logError(
    error instanceof Error ? error : new Error(String(error)),
    ErrorSeverity.CRITICAL,
    {
      type: 'fatal_startup_error',
      timestamp: new Date().toISOString()
    }
  );

  process.exit(1);
}); 
