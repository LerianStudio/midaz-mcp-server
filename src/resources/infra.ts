import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchDocumentation } from '../util/docs-fetcher.js';

/**
 * Register infrastructure-related resources with the MCP server
 * @param server MCP server instance
 */
export const registerInfraResources = (server: McpServer) => {

  // Infrastructure overview resource
  server.resource(
    'infra-overview',
    'midaz://infra/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/overview')
      }]
    })
  );

  // PostgreSQL resource
  server.resource(
    'postgres',
    'midaz://infra/postgres',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/postgres')
      }]
    })
  );

  // MongoDB resource
  server.resource(
    'mongodb',
    'midaz://infra/mongodb',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/mongodb')
      }]
    })
  );

  // RabbitMQ resource
  server.resource(
    'rabbitmq',
    'midaz://infra/rabbitmq',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/rabbitmq')
      }]
    })
  );

  // Redis/Valkey resource
  server.resource(
    'redis',
    'midaz://infra/redis',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/redis')
      }]
    })
  );

  // Grafana/OpenTelemetry resource
  server.resource(
    'grafana',
    'midaz://infra/grafana',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchDocumentation('infra/grafana')
      }]
    })
  );
}; 