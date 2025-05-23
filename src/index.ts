#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeSecurity } from './util/security.js';
import { initializeManifest } from './util/docs-manifest.js';

// Import resource definitions
import { registerModelResources } from './resources/models.js';
import { registerComponentResources } from './resources/components.js';
import { registerEducationalResources } from './resources/docs.js';
import { registerLLMDocsResources, registerLLMDocsTool } from './resources/llm-docs.js';
import { registerSdkResources } from './resources/sdk.js';

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
import { registerDocsAdminTools } from './tools/docs-admin.js';
import { registerDocsUserTools } from './tools/docs-user.js';
import { registerSdkTools } from './tools/sdk.js';

// Import MCP protocol handlers
import { setupSubscriptionHandlers } from './util/resource-subscriptions.js';

/**
 * Create an MCP server for Midaz
 */
const main = async () => {
  try {
    // Initialize security module
    initializeSecurity();

    // Initialize documentation manifest system
    await initializeManifest();

    // Collect all resources and tools with enhanced MCP capabilities
    const capabilities = {
      resources: {
        models: true,
        components: true,
        docs: true,
        sdks: true,
        subscriptions: true,
        templates: true
      },
      tools: {
        organization: true,
        ledger: true,
        account: true,
        transaction: true,
        balance: true,
        asset: true,
        portfolio: true,
        segment: true,
        sdk: true
      },
      prompts: false,
      logging: true
    };

    // Create the MCP server with declared capabilities
    const server = new McpServer({
      name: 'midaz-mcp-server',
      version: '1.0.0',
      capabilities
    });

    // Log startup
    console.error('Starting Midaz MCP Server...');

    // Register resources
    registerModelResources(server);
    registerComponentResources(server);
    registerEducationalResources(server);
    registerLLMDocsResources(server);
    registerSdkResources(server);

    // Register tools
    registerOrganizationTools(server);
    registerLedgerTools(server);
    registerAccountTools(server);
    registerTransactionTools(server);
    registerBalanceTools(server);
    registerAssetTools(server);
    // Removed asset-rate tools registration
    registerPortfolioTools(server);
    registerSegmentTools(server);
    registerLLMDocsTool(server);
    registerDocsUserTools(server);
    registerDocsAdminTools(server);
    registerSdkTools(server);

    // Setup MCP protocol handlers for subscriptions and discovery
    setupSubscriptionHandlers(server);
    // Note: Discovery handlers are non-standard and not supported by the MCP SDK

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Midaz MCP Server running');
  } catch (error) {
    console.error('Error starting Midaz MCP Server:', error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('Fatal error in Midaz MCP Server:', error);
  process.exit(1);
}); 