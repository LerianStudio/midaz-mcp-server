/**
 * Unified Documentation Tool
 * Consolidates all documentation tools into a single tool with operation parameters
 * Reduces 13 tools to 1 tool for MCP client compatibility
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";

// Import all existing documentation utilities
import {
  getAvailableResources,
  searchResources,
  getResourcesByCategory
} from "../util/docs-manifest.js";
import { fetchDocumentation } from "../util/docs-fetcher.js";
import {
  extractBestPractices,
  extractArchitectureOverview,
  formatBestPractices,
  generateSDKDocumentation
} from "../util/docs-helpers.js";
import {
  generateContextualExamples,
  generateWorkflowDocumentation
} from "../util/docs-examples.js";
import {
  generateTroubleshootingGuide,
  generateSitemap
} from "../util/docs-troubleshooting.js";

const logger = createLogger('docs-unified');

/**
 * Register unified documentation tool
 */
export const registerUnifiedDocumentationTool = (server) => {
  server.tool(
    "midaz-docs",
    "Unified Midaz documentation (13 operations). Use operation='getting-started' if new to Midaz, 'search' to find specific topics, 'api-reference' for endpoint details, 'code-examples' for implementation help. Single tool replaces 13 separate documentation tools for MCP client compatibility.",
    {
      operation: z.enum([
        'api-reference',     // Get complete API reference or specific endpoint documentation
        'search-endpoints',  // Search API endpoints by functionality, HTTP method, or resource type
        'getting-started',   // Step-by-step setup instructions and first API calls
        'best-practices',    // Security, performance, and architectural recommendations
        'architecture',      // System design, components, data flow, and integration patterns
        'sdk-docs',         // SDK documentation for Go and TypeScript clients
        'code-examples',    // Generate contextual code examples for specific use cases
        'workflows',        // Common business workflows with implementation patterns
        'troubleshooting',  // Common issues, solutions, and diagnostic steps
        'search',           // Advanced search across all documentation with filtering
        'sitemap',          // Complete documentation structure and navigation paths
        'read',             // Read full content of specific documentation page
        'browse'            // Browse available documentation by category
      ]).describe("Documentation operation to perform. Common: 'getting-started' (new users), 'search' (find topics), 'api-reference' (endpoint details), 'code-examples' (implementation help)."),

      // Operation-specific parameters with detailed guidance
      endpoint: z.string().optional().describe("API endpoint name or path (REQUIRED for: api-reference with specific endpoint). Examples: 'organizations', 'create-transaction', '/v1/organizations/{id}/ledgers'. Use specific endpoint names for targeted documentation, or omit for complete API reference."),

      query: z.string().optional().describe("Search query, 2-100 characters (REQUIRED for: search, search-endpoints). Examples: 'create transaction', 'authentication setup', 'error handling', 'portfolio management'. Use specific terms for better results. Avoid single words - use phrases that describe what you want to accomplish."),

      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("HTTP method filter (optional for: search-endpoints). Filters search results to show only endpoints that use this HTTP method. Useful when you know you need to 'POST' to create something or 'GET' to retrieve data."),

      language: z.enum(["curl", "javascript", "typescript", "go", "python"]).default("curl").describe("Programming language for code examples (for: code-examples, sdk-docs). 'curl' for REST API examples, 'javascript'/'typescript' for web/Node.js, 'go' for backend services, 'python' for scripts/data analysis."),

      useCase: z.string().optional().describe("Specific use case for code generation, 5-100 characters (REQUIRED for: code-examples). Examples: 'create first transaction', 'user account onboarding', 'check account balance', 'transfer between portfolios', 'handle payment errors'. Be specific about the business scenario you're implementing."),

      path: z.string().optional().describe("Exact documentation file path (REQUIRED for: read operation). Format: '/category/filename.md' or 'section/subsection'. Examples: '/reference/create-asset.md', '/guides/getting-started.md', 'models/transaction'. Get valid paths from browse or sitemap operations first."),

      category: z.string().optional().describe("Documentation category filter (optional for: browse). Valid categories: 'api' (REST endpoints), 'guides' (tutorials), 'examples' (code samples), 'models' (data structures), 'components' (system parts). Omit to see all categories."),

      format: z.enum(["summary", "detailed", "examples-only"]).default("detailed").describe("Response detail level. 'summary': 1-2 paragraphs overview (~200 chars), 'detailed': complete documentation with explanations, 'examples-only': just code blocks and usage samples without explanatory text."),

      includeExamples: z.boolean().default(true).describe("Whether to include code examples and snippets in the response. Set to false for text-only documentation without code blocks. Examples include curl commands, SDK usage, and configuration snippets."),

      maxResults: z.number().min(1).max(50).default(10).describe("Maximum search results to return (for: search, search-endpoints). Range: 1-50, default: 10. Use lower numbers (1-5) for focused searches, higher numbers (10-20) for comprehensive exploration. Large numbers may return less relevant results.")
    },

    wrapToolHandler(async (args, extra) => {
      const {
        operation,
        endpoint,
        query,
        method,
        language = "curl",
        useCase,
        path,
        category,
        format,
        includeExamples,
        maxResults
      } = validateArgs(args, z.object({
        operation: z.enum([
          'api-reference', 'search-endpoints', 'getting-started',
          'best-practices', 'architecture', 'sdk-docs',
          'code-examples', 'workflows', 'troubleshooting',
          'search', 'sitemap', 'read', 'browse'
        ]),
        endpoint: z.string().optional(),
        query: z.string().optional(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
        language: z.enum(["curl", "javascript", "typescript", "go", "python"]).default("curl"),
        useCase: z.string().optional(),
        path: z.string().optional(),
        category: z.string().optional(),
        format: z.enum(["summary", "detailed", "examples-only"]).default("detailed"),
        includeExamples: z.boolean().default(true),
        maxResults: z.number().min(1).max(50).default(10)
      }));

      logger.info('Processing unified documentation request', {
        operation,
        endpoint,
        query,
        format
      });

      try {
        switch (operation) {
          case 'api-reference':
            return await handleApiReference(endpoint, format, includeExamples);

          case 'search-endpoints':
            if (!query) throw new Error("Query parameter required for search-endpoints operation");
            return await handleSearchEndpoints(query, method, includeExamples, maxResults);

          case 'getting-started':
            return await handleGettingStarted(format, includeExamples);

          case 'best-practices':
            return await handleBestPractices(format);

          case 'architecture':
            return await handleArchitecture(format);

          case 'sdk-docs':
            return await handleSDKDocs(language, format);

          case 'code-examples':
            if (!useCase) throw new Error("useCase parameter required for code-examples operation");
            return await handleCodeExamples(useCase, language, format);

          case 'workflows':
            return await handleWorkflows(format);

          case 'troubleshooting':
            return await handleTroubleshooting(format);

          case 'search':
            if (!query) throw new Error("Query parameter required for search operation");
            return await handleSearch(query, category, maxResults);

          case 'sitemap':
            return await handleSitemap(format);

          case 'read':
            if (!path) throw new Error("Path parameter required for read operation");
            return await handleRead(path);

          case 'browse':
            return await handleBrowse(category);

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        logger.error('Error in unified documentation tool', {
          operation,
          error: error.message
        });
        throw error;
      }
    })
  );

  logger.info('✅ Unified documentation tool registered (replaces 13 individual tools)');
};

// Operation handlers (implementing the logic from the original tools)

async function handleApiReference(endpoint, format, includeExamples) {
  try {
    const apiResources = await getResourcesByCategory('api');

    if (endpoint) {
      const specificResource = apiResources.find(r =>
        r.title.toLowerCase().includes(endpoint.toLowerCase()) ||
        r.path.toLowerCase().includes(endpoint.toLowerCase())
      );

      if (!specificResource) {
        return `No API documentation found for endpoint: ${endpoint}`;
      }

      const content = await fetchDocumentation(specificResource.path);
      return formatApiResponse(content, format, includeExamples);
    }

    // Return all API documentation
    const allApiContent = await Promise.all(
      apiResources.slice(0, 10).map(async resource => {
        const content = await fetchDocumentation(resource.path);
        return {
          endpoint: resource.title,
          content: formatApiResponse(content, format, includeExamples)
        };
      })
    );

    return {
      title: "Complete API Reference",
      endpoints: allApiContent
    };
  } catch (error) {
    throw new Error(`Failed to get API reference: ${error.message}`);
  }
}

async function handleSearchEndpoints(query, method, includeExamples, maxResults) {
  try {
    const apiResources = await getResourcesByCategory('api');
    const searchResults = await searchResources(query);
    const apiSearchResults = searchResults
      .filter(r => r.category === 'api')
      .slice(0, maxResults);

    const results = await Promise.all(
      apiSearchResults.map(async resource => {
        const content = await fetchDocumentation(resource.path);
        return {
          endpoint: resource.title,
          path: resource.path,
          relevanceScore: resource.score || 1,
          content: formatApiResponse(content, 'summary', includeExamples)
        };
      })
    );

    return {
      query,
      totalResults: results.length,
      results
    };
  } catch (error) {
    throw new Error(`Failed to search endpoints: ${error.message}`);
  }
}

async function handleGettingStarted(format, includeExamples) {
  const gettingStartedContent = `# Getting Started with Midaz

## Quick Setup
1. **Installation**: \`npm install -g @lerianstudio/midaz-mcp-server\`
2. **Configuration**: Set up your API credentials
3. **First API Call**: Test with organization listing

## Prerequisites
- Node.js 18+
- Midaz API access (optional - works with sample data)

## Authentication
Configure your API key:
\`\`\`bash
export MIDAZ_API_KEY="your-api-key-here"
\`\`\`

## Basic Usage
\`\`\`bash
# List organizations
curl -H "Authorization: Bearer $API_KEY" https://api.midaz.io/v1/organizations

# Create a ledger
curl -X POST -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  https://api.midaz.io/v1/organizations/org_123/ledgers \\
  -d '{"name": "My Ledger", "metadata": {}}'
\`\`\`

## Next Steps
- Explore the API reference with \`midaz-docs\` operation: \`api-reference\`
- Learn about best practices with operation: \`best-practices\`
- Try interactive tutorials with \`midaz-learn\`
`;

  return format === 'summary' ?
    'Complete getting started guide with setup, authentication, and first API calls.' :
    gettingStartedContent;
}

async function handleBestPractices(format) {
  const practices = await extractBestPractices();
  return formatBestPractices(practices, format);
}

async function handleArchitecture(format) {
  const overview = await extractArchitectureOverview();
  return format === 'summary' ? overview.summary : overview;
}

async function handleSDKDocs(language, format) {
  const sdkDocs = await generateSDKDocumentation(language);
  return format === 'summary' ? sdkDocs.summary : sdkDocs;
}

async function handleCodeExamples(useCase, language, format) {
  const examples = await generateContextualExamples(useCase, language);
  return format === 'examples-only' ? examples.code : examples;
}

async function handleWorkflows(format) {
  const workflows = await generateWorkflowDocumentation();
  return format === 'summary' ? workflows.summary : workflows;
}

async function handleTroubleshooting(format) {
  const guide = await generateTroubleshootingGuide();
  return format === 'summary' ? guide.summary : guide;
}

async function handleSearch(query, category, maxResults) {
  const results = await searchResources(query);
  const filteredResults = category ?
    results.filter(r => r.category === category) :
    results;

  return {
    query,
    category: category || 'all',
    totalResults: filteredResults.length,
    results: filteredResults.slice(0, maxResults)
  };
}

async function handleSitemap(format) {
  const sitemap = await generateSitemap();
  return format === 'summary' ? sitemap.summary : sitemap;
}

async function handleRead(path) {
  const content = await fetchDocumentation(path);
  return {
    path,
    content
  };
}

async function handleBrowse(category) {
  if (category) {
    const resources = await getResourcesByCategory(category);
    return {
      category,
      resources: resources.map(r => ({
        title: r.title,
        path: r.path,
        description: r.description
      }))
    };
  }

  const allResources = await getAvailableResources();
  const categorized = allResources.reduce((acc, resource) => {
    const cat = resource.category || 'uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({
      title: resource.title,
      path: resource.path,
      description: resource.description
    });
    return acc;
  }, {});

  return {
    categories: Object.keys(categorized),
    resources: categorized
  };
}

// Helper function to format API responses
function formatApiResponse(content, format, includeExamples) {
  if (format === 'summary') {
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  if (format === 'examples-only' && includeExamples) {
    // Extract code blocks and examples
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return {
      examples: codeBlocks
    };
  }

  return content;
}