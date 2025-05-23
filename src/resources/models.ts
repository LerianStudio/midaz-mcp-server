import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchDocumentation } from '../util/docs-fetcher.js';

/**
 * Register model-related resources with the MCP server
 * @param server MCP server instance
 */
export const registerModelResources = (server: McpServer) => {
  // Entity relationship resources
  server.resource(
    'entity-relationships',
    'midaz://models/entity-relationships',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/entity-relationships')
      }]
    })
  );

  // Entity hierarchy resource
  server.resource(
    'entity-hierarchy',
    'midaz://models/entity-hierarchy',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/entity-hierarchy')
      }]
    })
  );

  // Organization model resource
  server.resource(
    'organization',
    'midaz://models/organization',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/organization')
      }]
    })
  );

  // Ledger model resource
  server.resource(
    'ledger',
    'midaz://models/ledger',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/ledger')
      }]
    })
  );

  // Account model resource
  server.resource(
    'account',
    'midaz://models/account',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/account')
      }]
    })
  );

  // Transaction model resource
  server.resource(
    'transaction',
    'midaz://models/transaction',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/transaction')
      }]
    })
  );

  // Operation model resource
  server.resource(
    'operation',
    'midaz://models/operation',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/operation')
      }]
    })
  );

  // Balance model resource
  server.resource(
    'balance',
    'midaz://models/balance',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/balance')
      }]
    })
  );

  // Portfolio model resource
  server.resource(
    'portfolio',
    'midaz://models/portfolio',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/portfolio')
      }]
    })
  );

  // Segment model resource
  server.resource(
    'segment',
    'midaz://models/segment',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/segment')
      }]
    })
  );

  // Asset model resource
  server.resource(
    'asset',
    'midaz://models/asset',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('models/asset')
      }]
    })
  );
}; 