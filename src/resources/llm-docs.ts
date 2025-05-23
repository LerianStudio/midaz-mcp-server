import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { enhancedFetch } from '../util/http-client.js';
import { createLogger } from '../util/mcp-logging.js';
import { createToolResponse, validateArgs } from '../util/mcp-helpers.js';
import { fuzzySearchLines } from '../util/fuzzy-search.js';
import config from '../config.js';

const logger = createLogger('llm-docs');

// Cache for LLM documentation
let llmDocsCache: { content: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for frequently updated content

/**
 * Fetch LLM documentation from docs.lerian.studio/llms.txt
 * @returns {Promise<string>} LLM documentation content
 */
async function fetchLLMDocumentation(): Promise<string> {
  const now = Date.now();
  
  // Check cache
  if (llmDocsCache && (now - llmDocsCache.timestamp) < CACHE_TTL) {
    logger.debug('Returning cached LLM documentation');
    return llmDocsCache.content;
  }
  
  const docsUrl = config.docsUrl || 'https://docs.lerian.studio';
  const llmDocsUrl = `${docsUrl}/llms.txt`;
  
  logger.info('Fetching LLM documentation', { url: llmDocsUrl });
  
  try {
    const response = await enhancedFetch(llmDocsUrl, {
      headers: {
        'Accept': 'text/plain,text/markdown',
        'User-Agent': 'Midaz-MCP-Server/1.0'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // Cache the result
    llmDocsCache = {
      content,
      timestamp: now
    };
    
    logger.debug('Successfully fetched LLM documentation', { size: content.length });
    return content;
    
  } catch (error) {
    logger.error('Failed to fetch LLM documentation', { 
      url: llmDocsUrl,
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Return fallback content
    return generateFallbackLLMDocs();
  }
}

/**
 * Generate fallback LLM documentation
 * @returns {string} Fallback documentation
 */
function generateFallbackLLMDocs(): string {
  return `# Midaz Documentation for LLMs

This documentation is dynamically updated at https://docs.lerian.studio/llms.txt

## Overview

Midaz is a comprehensive financial ledger system that provides:
- Double-entry bookkeeping
- Multi-currency support
- Hierarchical account structures
- Real-time transaction processing
- Comprehensive audit trails

## Available Resources

The MCP server provides access to detailed documentation about:

### Models
- Organization: Top-level business entities
- Ledger: Financial ledger containers
- Account: Individual financial accounts
- Transaction: Financial movements
- Operation: Debit/credit entries
- Balance: Account balances by asset
- Asset: Currencies and commodities
- Portfolio: Account groupings
- Segment: Account categorization

### Components
- Onboarding Service: Manages organizations, ledgers, and accounts
- Transaction Service: Handles transactions and balances
- MDZ CLI: Command-line interface

### Infrastructure
- PostgreSQL: Primary database
- MongoDB: Document storage
- Redis: Caching layer
- RabbitMQ: Message queue
- Grafana: Monitoring

## Getting Started

Visit https://docs.lerian.studio for complete documentation.
`;
}

/**
 * Register LLM documentation resources with the MCP server
 * @param server MCP server instance
 */
export const registerLLMDocsResources = (server: McpServer) => {
  // LLM documentation resource
  server.resource(
    'llm-documentation',
    'midaz://llm/documentation',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await fetchLLMDocumentation(),
        mimeType: 'text/plain'
      }]
    })
  );

  // Available documentation resource
  server.resource(
    'available-docs',
    'midaz://llm/available-docs',
    async (uri) => {
      const llmDocs = await fetchLLMDocumentation();
      
      // Extract available documentation from the llms.txt content
      // This assumes the file contains structured information about available docs
      const availableDocsSection = extractAvailableDocsSection(llmDocs);
      
      return {
        contents: [{
          uri: uri.href,
          text: availableDocsSection,
          mimeType: 'text/markdown'
        }]
      };
    }
  );
};

/**
 * Register LLM documentation tool
 * @param server MCP server instance
 */
export const registerLLMDocsTool = (server: McpServer) => {
  server.tool(
    'get-documentation-overview',
    'Get a complete overview of all Midaz documentation from llms.txt - includes guides, API references, and changelog. Use this for a comprehensive view of what documentation is available.',
    {},
    async (_args: Record<string, unknown>, _extra: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const llmDocs = await fetchLLMDocumentation();
        
        return createToolResponse({
          documentation: llmDocs,
          source: 'https://docs.lerian.studio/llms.txt',
          lastUpdated: new Date().toISOString()
        }) as CallToolResult;
      } catch (error) {
        return createToolResponse({
          error: 'Failed to fetch documentation',
          message: error instanceof Error ? error.message : String(error)
        }) as CallToolResult;
      }
    }
  );

  server.tool(
    'search-documentation-overview',
    'Search within the documentation overview (llms.txt) for specific topics. Returns matching sections with context. Use this to quickly find topics in the documentation index.',
    {
      query: z.string().describe('Search query for documentation topics')
    },
    async (args: { query: string }, _extra: Record<string, unknown>): Promise<CallToolResult> => {
      const validated = validateArgs(args, z.object({
        query: z.string()
      })) as { query: string };
      
      const llmDocs = await fetchLLMDocumentation();
      
      // Use fuzzy search to find matching sections
      const matches = fuzzySearchLines(llmDocs, validated.query, 3);
      
      let searchResults = '';
      
      if (matches.length > 0) {
        // Build results with sections and context
        const uniqueSections = new Set<string>();
        const resultLines: string[] = [];
        
        for (const match of matches) {
          // Add section header if not already added
          if (match.section && !uniqueSections.has(match.section)) {
            uniqueSections.add(match.section);
            resultLines.push(`\n${match.section}`);
          }
          
          // Add the matching context
          resultLines.push(`\n--- Match (score: ${match.score}) ---`);
          resultLines.push(match.context);
        }
        
        searchResults = resultLines.join('\n');
      } else {
        searchResults = `No results found for "${validated.query}"`;
      }
      
      return createToolResponse({
        query: validated.query,
        results: searchResults,
        resultCount: matches.length,
        topMatches: matches.slice(0, 5).map(m => ({
          line: m.line,
          section: m.section,
          score: m.score
        })),
        timestamp: new Date().toISOString()
      }) as CallToolResult;
    }
  );
};

/**
 * Extract available documentation section from LLM docs
 * @param {string} llmDocs - Full LLM documentation
 * @returns {string} Available documentation section
 */
function extractAvailableDocsSection(llmDocs: string): string {
  // Look for a section about available documentation
  const lines = llmDocs.split('\n');
  let inAvailableSection = false;
  let availableContent: string[] = [];
  
  for (const line of lines) {
    if (line.toLowerCase().includes('available') && 
        (line.includes('documentation') || line.includes('resources'))) {
      inAvailableSection = true;
      availableContent.push(line);
      continue;
    }
    
    if (inAvailableSection) {
      // Stop at next major section
      if (line.startsWith('#') && !line.startsWith('##')) {
        break;
      }
      availableContent.push(line);
    }
  }
  
  if (availableContent.length === 0) {
    // Fallback: return a summary
    return `# Available Documentation

The Midaz MCP server provides comprehensive documentation fetched from docs.lerian.studio.

For a complete list of available documentation, use the \`get-available-documentation\` tool or access the \`midaz://llm/documentation\` resource.

Documentation is organized into:
- **Models**: Data structures and relationships
- **Components**: System services and APIs
- **Infrastructure**: Technical architecture
- **Guides**: Getting started and best practices
`;
  }
  
  return availableContent.join('\n');
}