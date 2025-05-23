import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchDocumentation } from '../util/docs-fetcher.js';

/**
 * Register component-related resources with the MCP server
 * @param server MCP server instance
 */
export const registerComponentResources = (server: McpServer) => {
  // Onboarding component overview
  server.resource(
    'onboarding-overview',
    'midaz://components/onboarding/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/onboarding/overview')
      }]
    })
  );

  // Onboarding API resource
  server.resource(
    'onboarding-api',
    'midaz://components/onboarding/api',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/onboarding/api')
      }]
    })
  );

  // Onboarding architecture resource
  server.resource(
    'onboarding-architecture',
    'midaz://components/onboarding/architecture',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/onboarding/architecture')
      }]
    })
  );

  // Transaction component overview
  server.resource(
    'transaction-overview',
    'midaz://components/transaction/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/transaction/overview')
      }]
    })
  );

  // Transaction API resource
  server.resource(
    'transaction-api',
    'midaz://components/transaction/api',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/transaction/api')
      }]
    })
  );

  // Transaction setup resource
  server.resource(
    'transaction-setup',
    'midaz://components/transaction/setup',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/transaction/setup')
      }]
    })
  );

  // MDZ component overview
  server.resource(
    'mdz-overview',
    'midaz://components/mdz/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/mdz/overview')
      }]
    })
  );

  // MDZ setup resource
  server.resource(
    'mdz-setup',
    'midaz://components/mdz/setup',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/mdz/setup')
      }]
    })
  );

  // Onboarding setup resource
  server.resource(
    'onboarding-setup',
    'midaz://components/onboarding/setup',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('components/onboarding/setup')
      }]
    })
  );

  // Security architecture and best practices
  server.resource(
    'security-docs',
    'midaz://docs/security',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/security')
      }]
    })
  );

  // Troubleshooting guide
  server.resource(
    'troubleshooting-docs',
    'midaz://docs/troubleshooting',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('docs/troubleshooting')
      }]
    })
  );
}; 