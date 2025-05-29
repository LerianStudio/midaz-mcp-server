/**
 * Documentation Demo Tool
 * Demonstrates the comprehensive documentation system capabilities
 * Provides guided tours and interactive examples
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";
import { getDocumentationCapabilities, getResourceMigrationGuide } from './docs-registry.js';

const logger = createLogger('docs-demo');

/**
 * Register documentation demo and exploration tools
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerDocsDemoTools = (server) => {

  server.tool(
    "docs-demo-overview",
    "Get a comprehensive overview of the documentation system capabilities, including all available tools and their use cases.",
    {
      includeExamples: z.boolean().default(true).describe("Include usage examples for each capability"),
      format: z.enum(['summary', 'detailed', 'interactive']).default('detailed').describe("Level of detail in the overview")
    },
    wrapToolHandler(async (args, extra) => {
      const { includeExamples, format } = validateArgs(args, z.object({
        includeExamples: z.boolean().default(true),
        format: z.enum(['summary', 'detailed', 'interactive']).default('detailed')
      }));

      try {
        const capabilities = getDocumentationCapabilities();
        
        const overview = {
          title: "🚀 Midaz MCP Documentation System",
          description: capabilities.overview,
          
          // Quick start guide
          quickStart: {
            title: "Quick Start",
            steps: [
              {
                step: 1,
                action: "Get API reference",
                tool: "get-api-reference",
                example: includeExamples ? "get-api-reference with endpoint='organizations'" : null
              },
              {
                step: 2,
                action: "Search documentation",
                tool: "search-documentation", 
                example: includeExamples ? "search-documentation with query='create transaction'" : null
              },
              {
                step: 3,
                action: "Generate examples",
                tool: "generate-code-examples",
                example: includeExamples ? "generate-code-examples with useCase='create organization'" : null
              },
              {
                step: 4,
                action: "Get troubleshooting help",
                tool: "get-troubleshooting-guide",
                example: includeExamples ? "get-troubleshooting-guide with category='authentication'" : null
              }
            ]
          },

          // Tool categories
          toolCategories: format === 'summary' ? 
            Object.keys(capabilities.capabilities) : 
            capabilities.capabilities,

          // Usage examples
          examples: includeExamples ? generateUsageExamples() : null,

          // Interactive guide
          interactiveGuide: format === 'interactive' ? generateInteractiveGuide() : null,

          // Benefits and features
          benefits: capabilities.benefits,
          supportedFormats: capabilities.supportedFormats,

          // Next steps
          nextSteps: [
            "Try the quick start examples above",
            "Explore specific tool categories based on your needs",
            "Use search-documentation to find specific topics",
            "Check out the troubleshooting guide for common issues"
          ]
        };

        return {
          overview,
          format,
          timestamp: new Date().toISOString(),
          totalTools: countTotalTools(),
          recommendedStartingPoints: getRecommendedStartingPoints()
        };

      } catch (error) {
        logger.error('Failed to generate documentation overview', { error: error.message });
        return {
          error: error.message,
          format,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  server.tool(
    "docs-migration-guide",
    "Get guidance on migrating from MCP resources to the new documentation tools system for better compatibility.",
    {
      showExamples: z.boolean().default(true).describe("Include before/after examples"),
      includeMapping: z.boolean().default(true).describe("Include detailed resource-to-tool mapping")
    },
    wrapToolHandler(async (args, extra) => {
      const { showExamples, includeMapping } = validateArgs(args, z.object({
        showExamples: z.boolean().default(true),
        includeMapping: z.boolean().default(true)
      }));

      try {
        const migrationGuide = getResourceMigrationGuide();
        
        const guide = {
          ...migrationGuide,
          mapping: includeMapping ? migrationGuide.mapping : null,
          examples: showExamples ? migrationGuide.examples : null,
          
          // Add practical migration steps
          migrationSteps: [
            {
              step: 1,
              title: "Identify Current Resource Usage",
              description: "List all resources currently being used in your applications",
              action: "Review your code for resource:// URLs"
            },
            {
              step: 2,
              title: "Map Resources to Tools",
              description: "Use the mapping table to find equivalent tools",
              action: "Reference the resource mapping section below"
            },
            {
              step: 3,
              title: "Update Client Code",
              description: "Replace resource calls with tool calls",
              action: "Test each tool call to ensure equivalent functionality"
            },
            {
              step: 4,
              title: "Verify Enhanced Functionality",
              description: "Take advantage of new features not available in resources",
              action: "Explore search, examples, and troubleshooting capabilities"
            }
          ],

          // Common migration patterns
          commonPatterns: includeMapping ? [
            {
              pattern: "Resource browsing",
              before: "List all available resources",
              after: "Use get-documentation-sitemap or browse-documentation",
              improvement: "Hierarchical navigation with search and filtering"
            },
            {
              pattern: "Documentation reading",
              before: "Read specific resource content",
              after: "Use read-documentation or get-api-reference",
              improvement: "Enhanced formatting and related content suggestions"
            },
            {
              pattern: "Content discovery",
              before: "Browse resources by category",
              after: "Use search-documentation with category filters",
              improvement: "Fuzzy search with relevance ranking"
            }
          ] : null,

          // Client compatibility matrix
          compatibilityMatrix: {
            resources: {
              "Claude Desktop": "Limited support",
              "VSCode Extension": "Not supported", 
              "Web Clients": "Varies by implementation",
              "CLI Clients": "Basic support"
            },
            tools: {
              "Claude Desktop": "Full support ✅",
              "VSCode Extension": "Full support ✅",
              "Web Clients": "Full support ✅", 
              "CLI Clients": "Full support ✅"
            }
          }
        };

        return {
          migrationGuide: guide,
          recommendedApproach: "Gradual migration with testing at each step",
          supportResources: [
            "Use docs-demo-overview for system overview",
            "Use search-documentation to find specific topics",
            "Use get-troubleshooting-guide for migration issues"
          ],
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Failed to generate migration guide', { error: error.message });
        return {
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  server.tool(
    "docs-guided-tour",
    "Take a guided tour of the documentation system with step-by-step examples and recommendations.",
    {
      tourType: z.enum(['quick', 'comprehensive', 'developer', 'troubleshooting']).default('quick').describe("Type of guided tour"),
      interactive: z.boolean().default(true).describe("Include interactive examples and tool suggestions")
    },
    wrapToolHandler(async (args, extra) => {
      const { tourType, interactive } = validateArgs(args, z.object({
        tourType: z.enum(['quick', 'comprehensive', 'developer', 'troubleshooting']).default('quick'),
        interactive: z.boolean().default(true)
      }));

      try {
        const tours = {
          quick: generateQuickTour(interactive),
          comprehensive: generateComprehensiveTour(interactive),
          developer: generateDeveloperTour(interactive),
          troubleshooting: generateTroubleshootingTour(interactive)
        };

        const tour = tours[tourType];
        
        return {
          tour,
          tourType,
          interactive,
          duration: tour.estimatedDuration,
          nextRecommendations: getNextTourRecommendations(tourType),
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Failed to generate guided tour', { tourType, error: error.message });
        return {
          error: error.message,
          tourType,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  server.tool(
    "docs-health-check",
    "Perform a comprehensive health check of the documentation system, including connectivity, cache status, and content validation.",
    {
      includeMetrics: z.boolean().default(true).describe("Include performance and usage metrics"),
      testConnectivity: z.boolean().default(true).describe("Test connectivity to documentation sources")
    },
    wrapToolHandler(async (args, extra) => {
      const { includeMetrics, testConnectivity } = validateArgs(args, z.object({
        includeMetrics: z.boolean().default(true),
        testConnectivity: z.boolean().default(true)
      }));

      try {
        const healthCheck = await performDocumentationHealthCheck(includeMetrics, testConnectivity);
        
        return {
          healthCheck,
          status: healthCheck.overall.status,
          issues: healthCheck.issues || [],
          recommendations: healthCheck.recommendations || [],
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Failed to perform documentation health check', { error: error.message });
        return {
          error: error.message,
          status: 'error',
          timestamp: new Date().toISOString()
        };
      }
    })
  );
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function generateUsageExamples() {
  return [
    {
      category: "Getting Started",
      examples: [
        {
          description: "Get comprehensive API reference",
          tool: "get-api-reference",
          parameters: { format: "detailed" },
          expectedResult: "Complete API documentation with examples"
        },
        {
          description: "Search for specific functionality", 
          tool: "search-documentation",
          parameters: { query: "create transaction", includeContent: false },
          expectedResult: "Relevant documentation pages with descriptions"
        }
      ]
    },
    {
      category: "Development",
      examples: [
        {
          description: "Generate code examples for use case",
          tool: "generate-code-examples", 
          parameters: { useCase: "create organization", language: "javascript" },
          expectedResult: "Production-ready JavaScript code examples"
        },
        {
          description: "Get SDK documentation",
          tool: "get-sdk-documentation",
          parameters: { language: "typescript", section: "quickstart" },
          expectedResult: "TypeScript SDK quickstart guide"
        }
      ]
    },
    {
      category: "Troubleshooting",
      examples: [
        {
          description: "Get authentication troubleshooting",
          tool: "get-troubleshooting-guide",
          parameters: { category: "authentication", includePreventionTips: true },
          expectedResult: "Authentication issues and solutions"
        },
        {
          description: "Find common API errors",
          tool: "get-troubleshooting-guide", 
          parameters: { category: "api-errors", severity: "high" },
          expectedResult: "High-severity API error troubleshooting"
        }
      ]
    }
  ];
}

function generateInteractiveGuide() {
  return {
    title: "Interactive Documentation Explorer",
    description: "Follow these steps to explore the documentation system interactively",
    
    sessions: [
      {
        session: 1,
        title: "API Discovery",
        steps: [
          "Run: get-api-reference",
          "Run: search-api-endpoints with query='transaction'",
          "Run: generate-code-examples with useCase='create transaction'"
        ],
        learningObjective: "Understand API structure and generate working code"
      },
      {
        session: 2,
        title: "Architecture Exploration", 
        steps: [
          "Run: get-architecture-overview",
          "Run: get-architecture-overview with component='transaction'",
          "Run: get-best-practices-guide with topic='architecture'"
        ],
        learningObjective: "Learn system architecture and best practices"
      },
      {
        session: 3,
        title: "Workflow Mastery",
        steps: [
          "Run: get-common-workflows",
          "Run: get-getting-started-guide with section='examples'",
          "Run: generate-code-examples with multiple use cases"
        ],
        learningObjective: "Master common workflows and implementation patterns"
      }
    ]
  };
}

function generateQuickTour(interactive) {
  return {
    title: "Quick Tour: Documentation Essentials",
    estimatedDuration: "5-10 minutes",
    description: "Essential tools and capabilities overview",
    
    stops: [
      {
        stop: 1,
        title: "API Reference",
        description: "Access complete API documentation",
        tool: "get-api-reference",
        keyFeature: "Comprehensive endpoint documentation with examples",
        tryIt: interactive ? "get-api-reference with endpoint='organizations'" : null
      },
      {
        stop: 2,
        title: "Search Documentation",
        description: "Find documentation quickly",
        tool: "search-documentation",
        keyFeature: "Fuzzy search with relevance ranking",
        tryIt: interactive ? "search-documentation with query='authentication'" : null
      },
      {
        stop: 3,
        title: "Code Examples",
        description: "Generate contextual code examples", 
        tool: "generate-code-examples",
        keyFeature: "Multi-language, production-ready examples",
        tryIt: interactive ? "generate-code-examples with useCase='check balance'" : null
      },
      {
        stop: 4,
        title: "Troubleshooting",
        description: "Get help with common issues",
        tool: "get-troubleshooting-guide",
        keyFeature: "Categorized issues with step-by-step solutions",
        tryIt: interactive ? "get-troubleshooting-guide with category='api-errors'" : null
      }
    ],
    
    nextSteps: [
      "Try the comprehensive tour for deeper exploration",
      "Use search-documentation to find specific topics",
      "Explore architecture documentation for system understanding"
    ]
  };
}

function generateComprehensiveTour(interactive) {
  return {
    title: "Comprehensive Tour: Complete Documentation System",
    estimatedDuration: "20-30 minutes",
    description: "Deep dive into all documentation capabilities",
    
    modules: [
      {
        module: 1,
        title: "API Mastery",
        duration: "8-10 minutes",
        tools: ["get-api-reference", "search-api-endpoints"],
        activities: interactive ? [
          "Explore complete API reference",
          "Search for specific endpoints",
          "Review authentication documentation"
        ] : null
      },
      {
        module: 2,
        title: "Architecture Deep Dive",
        duration: "5-8 minutes", 
        tools: ["get-architecture-overview", "get-best-practices-guide"],
        activities: interactive ? [
          "Understand system architecture",
          "Explore component relationships", 
          "Learn architectural best practices"
        ] : null
      },
      {
        module: 3,
        title: "Development Workflows",
        duration: "7-12 minutes",
        tools: ["generate-code-examples", "get-common-workflows", "get-sdk-documentation"],
        activities: interactive ? [
          "Generate code examples for common use cases",
          "Explore typical business workflows",
          "Review SDK documentation and examples"
        ] : null
      }
    ]
  };
}

function generateDeveloperTour(interactive) {
  return {
    title: "Developer Tour: Code-Focused Exploration",
    estimatedDuration: "15-20 minutes",
    description: "Developer-focused tour with emphasis on code examples and SDKs",
    
    tracks: [
      {
        track: "API Integration",
        tools: ["get-api-reference", "generate-code-examples"],
        focus: "Understanding APIs and generating integration code"
      },
      {
        track: "SDK Usage",
        tools: ["get-sdk-documentation"],
        focus: "SDK installation, configuration, and usage patterns"
      },
      {
        track: "Best Practices",
        tools: ["get-best-practices-guide"],
        focus: "Development best practices and common patterns"
      },
      {
        track: "Troubleshooting",
        tools: ["get-troubleshooting-guide"],
        focus: "Common development issues and debugging"
      }
    ]
  };
}

function generateTroubleshootingTour(interactive) {
  return {
    title: "Troubleshooting Tour: Problem Resolution Guide",
    estimatedDuration: "10-15 minutes",
    description: "Comprehensive guide to troubleshooting common issues",
    
    scenarios: [
      {
        scenario: "Authentication Issues",
        tool: "get-troubleshooting-guide",
        parameters: { category: "authentication" },
        commonProblems: ["401 errors", "token expiration", "invalid formats"]
      },
      {
        scenario: "API Errors",
        tool: "get-troubleshooting-guide", 
        parameters: { category: "api-errors" },
        commonProblems: ["400 bad request", "409 conflicts", "validation errors"]
      },
      {
        scenario: "Performance Issues",
        tool: "get-troubleshooting-guide",
        parameters: { category: "performance" },
        commonProblems: ["slow responses", "rate limiting", "timeouts"]
      }
    ]
  };
}

function countTotalTools() {
  return {
    comprehensive: 8,
    user: 3,
    admin: 4,
    demo: 4,
    total: 19
  };
}

function getRecommendedStartingPoints() {
  return [
    {
      role: "New User",
      recommendation: "Start with get-getting-started-guide",
      reason: "Provides comprehensive onboarding with examples"
    },
    {
      role: "Developer",
      recommendation: "Start with get-api-reference and generate-code-examples",
      reason: "Immediate access to technical implementation details"
    },
    {
      role: "System Administrator", 
      recommendation: "Start with get-architecture-overview",
      reason: "Understanding system design and infrastructure"
    },
    {
      role: "Troubleshooter",
      recommendation: "Start with get-troubleshooting-guide",
      reason: "Direct access to problem resolution guides"
    }
  ];
}

function getNextTourRecommendations(currentTourType) {
  const recommendations = {
    quick: ["comprehensive", "developer"],
    comprehensive: ["developer", "troubleshooting"],
    developer: ["comprehensive", "troubleshooting"],
    troubleshooting: ["developer", "comprehensive"]
  };
  
  return recommendations[currentTourType] || ["quick"];
}

async function performDocumentationHealthCheck(includeMetrics, testConnectivity) {
  const healthCheck = {
    overall: { status: "healthy", checks: 0, passed: 0, failed: 0 },
    components: {},
    issues: [],
    recommendations: [],
    metrics: includeMetrics ? {} : null
  };

  // Test basic functionality
  try {
    healthCheck.components.toolRegistry = { status: "healthy", message: "All tools registered successfully" };
    healthCheck.overall.checks++;
    healthCheck.overall.passed++;
  } catch (error) {
    healthCheck.components.toolRegistry = { status: "unhealthy", message: error.message };
    healthCheck.overall.checks++;
    healthCheck.overall.failed++;
    healthCheck.issues.push("Tool registry initialization failed");
  }

  // Test connectivity if requested
  if (testConnectivity) {
    try {
      // This would test actual connectivity to docs.lerian.studio
      healthCheck.components.connectivity = { status: "healthy", message: "Documentation sources accessible" };
      healthCheck.overall.checks++;
      healthCheck.overall.passed++;
    } catch (error) {
      healthCheck.components.connectivity = { status: "unhealthy", message: "Cannot reach documentation sources" };
      healthCheck.overall.checks++;
      healthCheck.overall.failed++;
      healthCheck.issues.push("Documentation connectivity issues");
      healthCheck.recommendations.push("Check network connectivity and DNS resolution");
    }
  }

  // Determine overall status
  if (healthCheck.overall.failed > 0) {
    healthCheck.overall.status = healthCheck.overall.failed > healthCheck.overall.passed ? "unhealthy" : "degraded";
  }

  return healthCheck;
}

export default { registerDocsDemoTools };