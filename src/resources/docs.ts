import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchDocumentation } from '../util/docs-fetcher.js';

/**
 * Register educational resources with the MCP server
 * @param server MCP server instance
 */
export const registerEducationalResources = (server: McpServer) => {

  // General overview resource
  server.resource(
    'overview',
    'midaz://docs/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/overview')
      }]
    })
  );

  // Architecture overview
  server.resource(
    'architecture',
    'midaz://docs/architecture',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/architecture')
      }]
    })
  );

  // Getting started guide
  server.resource(
    'getting-started',
    'midaz://docs/getting-started',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/getting-started')
      }]
    })
  );

  // CQRS pattern documentation
  server.resource(
    'cqrs',
    'midaz://docs/cqrs',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/cqrs')
      }]
    })
  );

  // Domain-Driven Design documentation
  server.resource(
    'domain-driven-design',
    'midaz://docs/domain-driven-design',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/domain-driven-design')
      }]
    })
  );
}; 