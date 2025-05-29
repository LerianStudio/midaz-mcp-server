#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Minimal MCP server for Midaz - Claude Desktop compatible
 */
const main = async () => {
  try {
    // Create a minimal MCP server
    const server = new McpServer({
      name: 'midaz-mcp-server',
      version: '2.2.0',
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
        logging: {}
      }
    });

    // Add a simple test tool
    server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'test_midaz_connection',
          description: 'Test the Midaz MCP server connection',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }));

    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'test_midaz_connection') {
        return {
          content: [
            {
              type: 'text',
              text: '✅ Midaz MCP Server is working correctly!\n\nThis minimal version successfully connects to Claude Desktop.'
            }
          ]
        };
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Add a simple resource
    server.setRequestHandler('resources/list', async () => ({
      resources: [
        {
          uri: 'midaz://status',
          name: 'Midaz Server Status',
          description: 'Current status of the Midaz MCP server',
          mimeType: 'text/plain'
        }
      ]
    }));

    server.setRequestHandler('resources/read', async (request) => {
      if (request.params.uri === 'midaz://status') {
        return {
          contents: [
            {
              uri: 'midaz://status',
              mimeType: 'text/plain',
              text: 'Midaz MCP Server is running and ready to accept requests.'
            }
          ]
        };
      }
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ Minimal Midaz MCP Server running successfully!');
  } catch (error) {
    console.error('❌ Error starting Midaz MCP Server:', error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error in Midaz MCP Server:', error);
  process.exit(1);
});