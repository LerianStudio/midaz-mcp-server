#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Node.js globals
declare const process: any;

/**
 * Minimal MCP server for testing basic connectivity
 */
const main = async () => {
  try {
    // Create a minimal MCP server
    const server = new McpServer({
      name: 'midaz-mcp-server-minimal',
      version: '2.5.1'
    });

    // Add one simple test tool using the MCP server API
    server.tool('test-connection', 'Test MCP connection', {}, async (args: any) => {
      return {
        content: [{
          type: 'text',
          text: 'MCP connection is working! ✅\n\nServer: midaz-mcp-server-minimal v2.5.1\nTimestamp: ' + new Date().toISOString()
        }]
      };
    });

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Only log success to stderr, not during startup
    console.error('✅ Minimal Midaz MCP Server ready');
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

main().catch(console.error);