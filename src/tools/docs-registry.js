/**
 * Documentation Tools Registry
 * Centralized registration of all documentation-focused tools
 * This replaces the resource system with comprehensive tool-based documentation access
 */

import { registerComprehensiveDocsTools } from './docs-comprehensive.js';
import { registerDocsUserTools } from './docs-user.js';
import { registerDocsAdminTools } from './docs-admin.js';
import { createLogger } from '../util/mcp-logging.js';

const logger = createLogger('docs-registry');

/**
 * Register all documentation tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerAllDocumentationTools = (server) => {
  try {
    logger.info('Registering comprehensive documentation tools...');
    
    // Register comprehensive documentation tools (main replacement for resources)
    registerComprehensiveDocsTools(server);
    logger.info('✅ Comprehensive documentation tools registered');
    
    // Register user-facing documentation tools
    registerDocsUserTools(server);
    logger.info('✅ User documentation tools registered');
    
    // Register admin documentation tools
    registerDocsAdminTools(server);
    logger.info('✅ Admin documentation tools registered');
    
    logger.info('🚀 All documentation tools successfully registered');
    
    // Log summary of available tools
    logToolsSummary();
    
  } catch (error) {
    logger.error('Failed to register documentation tools', { error: error.message });
    throw error;
  }
};

/**
 * Log summary of available documentation tools
 */
function logToolsSummary() {
  const toolCategories = {
    'API Reference': [
      'get-api-reference',
      'search-api-endpoints'
    ],
    'Guides & Tutorials': [
      'get-getting-started-guide',
      'get-best-practices-guide',
      'get-common-workflows'
    ],
    'Architecture': [
      'get-architecture-overview'
    ],
    'SDK Documentation': [
      'get-sdk-documentation'
    ],
    'Interactive Examples': [
      'generate-code-examples',
      'get-common-workflows'
    ],
    'Troubleshooting': [
      'get-troubleshooting-guide'
    ],
    'Search & Navigation': [
      'search-documentation',
      'get-documentation-sitemap'
    ],
    'User Tools': [
      'search-documentation',
      'read-documentation',
      'browse-documentation'
    ],
    'Admin Tools': [
      'refresh-documentation-cache',
      'validate-documentation-links',
      'get-documentation-metrics'
    ]
  };
  
  logger.info('📋 Documentation Tools Summary:');
  for (const [category, tools] of Object.entries(toolCategories)) {
    logger.info(`  ${category}:`);
    tools.forEach(tool => {
      logger.info(`    - ${tool}`);
    });
  }
}

/**
 * Get comprehensive documentation capabilities overview
 */
export const getDocumentationCapabilities = () => {
  return {
    overview: "Comprehensive documentation access through tools, replacing the resource system for broader MCP client compatibility",
    
    capabilities: {
      apiReference: {
        description: "Complete API reference with endpoints, examples, and authentication details",
        tools: ['get-api-reference', 'search-api-endpoints'],
        features: ['endpoint discovery', 'request/response examples', 'authentication guides']
      },
      
      guidesAndTutorials: {
        description: "Step-by-step guides and best practices",
        tools: ['get-getting-started-guide', 'get-best-practices-guide'],
        features: ['installation guides', 'security best practices', 'performance optimization']
      },
      
      architecture: {
        description: "System architecture and design documentation",
        tools: ['get-architecture-overview'],
        features: ['component diagrams', 'data flow visualization', 'integration patterns']
      },
      
      sdk: {
        description: "SDK documentation for Go and TypeScript",
        tools: ['get-sdk-documentation'],
        features: ['installation instructions', 'code examples', 'API client usage']
      },
      
      interactiveExamples: {
        description: "Contextual code examples and common workflows",
        tools: ['generate-code-examples', 'get-common-workflows'],
        features: ['multi-language examples', 'workflow tutorials', 'production-ready code']
      },
      
      troubleshooting: {
        description: "Comprehensive troubleshooting and diagnostic tools",
        tools: ['get-troubleshooting-guide'],
        features: ['common issues database', 'diagnostic tools', 'prevention tips']
      },
      
      searchAndNavigation: {
        description: "Advanced search and navigation capabilities",
        tools: ['search-documentation', 'get-documentation-sitemap'],
        features: ['fuzzy search', 'content filtering', 'related suggestions']
      }
    },
    
    benefits: [
      "Broader MCP client compatibility (tools work everywhere, resources don't)",
      "Comprehensive documentation access without requiring resource support",
      "Interactive examples and contextual help",
      "Advanced search and troubleshooting capabilities",
      "Production-ready code examples and workflows",
      "Real-time documentation updates and validation"
    ],
    
    supportedFormats: [
      'API reference documentation',
      'Step-by-step tutorials',
      'Code examples (curl, JavaScript, TypeScript, Go, Python)',
      'Architecture diagrams (ASCII art)',
      'Troubleshooting guides',
      'Best practices checklists',
      'Workflow documentation'
    ],
    
    contentSources: [
      'docs.lerian.studio (primary documentation)',
      'Dynamic manifest from llms.txt',
      'Static fallback mappings',
      'Generated examples and workflows',
      'Troubleshooting knowledge base'
    ]
  };
};

/**
 * Migration guide from resources to tools
 */
export const getResourceMigrationGuide = () => {
  return {
    title: "Migration from Resources to Documentation Tools",
    
    overview: "This guide helps you migrate from using MCP resources to the new comprehensive documentation tools for broader client compatibility.",
    
    mapping: {
      resources: {
        'midaz://docs/overview': {
          replacement: 'get-getting-started-guide',
          parameters: { section: 'overview' },
          note: "More comprehensive with examples and troubleshooting"
        },
        'midaz://docs/architecture': {
          replacement: 'get-architecture-overview',
          parameters: { depth: 'detailed', includeDiagrams: true },
          note: "Interactive architecture exploration with component details"
        },
        'midaz://docs/getting-started': {
          replacement: 'get-getting-started-guide',
          parameters: { section: 'all', includeExamples: true },
          note: "Enhanced with code examples and common workflows"
        },
        'midaz://models/*': {
          replacement: 'get-api-reference',
          parameters: { format: 'detailed' },
          note: "Complete API reference with examples and validation"
        },
        'midaz://components/*': {
          replacement: 'get-architecture-overview',
          parameters: { component: 'specific-component' },
          note: "Detailed component architecture and integration guides"
        }
      }
    },
    
    advantages: {
      compatibility: "Tools work with all MCP clients (Claude Desktop, VSCode, etc.)",
      functionality: "More features than resources (search, examples, troubleshooting)",
      interactivity: "Dynamic content generation and contextual help",
      maintenance: "Easier to update and extend functionality"
    },
    
    examples: [
      {
        before: "Read resource: midaz://docs/overview",
        after: "Use tool: get-getting-started-guide with section='overview'",
        benefit: "Includes examples, troubleshooting, and related topics"
      },
      {
        before: "Read resource: midaz://models/transaction",
        after: "Use tool: get-api-reference with endpoint='transactions'",
        benefit: "Complete API documentation with request/response examples"
      },
      {
        before: "Browse all resources",
        after: "Use tool: get-documentation-sitemap",
        benefit: "Interactive navigation with filtering and search"
      }
    ]
  };
};

export default {
  registerAllDocumentationTools,
  getDocumentationCapabilities,
  getResourceMigrationGuide
};