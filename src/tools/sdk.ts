/**
 * SDK tools for Midaz SDKs
 * Provides tools for code generation, usage guidance, and SDK-specific queries
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { wrapToolHandler, validateArgs } from '../util/mcp-helpers.js';

interface CodeExample {
  title: string;
  description: string;
  code: string;
  dependencies: string[];
  runInstructions: string[];
}

interface FeatureComparison {
  golang: {
    approach: string;
    strengths: string[];
  };
  typescript: {
    approach: string;
    strengths: string[];
  };
}

/**
 * Register SDK tools with the MCP server
 * @param server MCP server instance
 */
export const registerSdkTools = (server: McpServer) => {

  // SDK Code Generator Tool
  server.tool(
    'generate-sdk-code',
    'Generate code examples using Midaz SDKs for specific use cases. Supports both Golang and TypeScript SDKs with various patterns like CRUD operations, transactions, authentication, etc.',
    {
      language: z.enum(['golang', 'typescript']).describe('Programming language/SDK to use'),
      useCase: z.enum([
        'basic-setup',
        'organization-crud',
        'transaction-processing',
        'authentication-setup',
        'error-handling'
      ]).describe('Type of code example to generate'),
      includeComments: z.boolean().default(true).describe('Include detailed comments in generated code'),
    },
    wrapToolHandler(async (args: any, extra: any) => {
      const validatedArgs = validateArgs(args, z.object({
        language: z.enum(['golang', 'typescript']),
        useCase: z.enum([
          'basic-setup',
          'organization-crud', 
          'transaction-processing',
          'authentication-setup',
          'error-handling'
        ]),
        includeComments: z.boolean().default(true),
      })) as { language: string; useCase: string; includeComments: boolean };
      const { language, useCase, includeComments } = validatedArgs;

      const codeExample = generateSdkCode(language, useCase, includeComments);
      
      return {
        language,
        useCase,
        generated: true,
        codeExample: {
          title: codeExample.title,
          description: codeExample.description,
          code: codeExample.code,
          dependencies: codeExample.dependencies,
          runInstructions: codeExample.runInstructions
        }
      };
    })
  );

  // SDK Feature Comparison Tool
  server.tool(
    'compare-sdk-features',
    'Compare specific features between Golang and TypeScript Midaz SDKs. Helps choose the right SDK for your use case.',
    {
      features: z.array(z.enum([
        'authentication',
        'error-handling', 
        'concurrency',
        'observability',
        'performance',
        'type-safety'
      ])).describe('Features to compare between SDKs'),
    },
    wrapToolHandler(async (args: any, extra: any) => {
      const validatedArgs = validateArgs(args, z.object({
        features: z.array(z.enum([
          'authentication',
          'error-handling',
          'concurrency', 
          'observability',
          'performance',
          'type-safety'
        ])),
      })) as { features: string[] };
      const { features } = validatedArgs;

      const comparison = compareFeatures(features);
      
      return {
        features,
        comparison,
        summary: `Compared ${features.length} features between Golang and TypeScript SDKs.`
      };
    })
  );

  // SDK Example Finder Tool
  server.tool(
    'find-sdk-examples',
    'Find specific code examples from the Midaz SDK repositories based on functionality or pattern.',
    {
      query: z.string().min(3).describe('Search query for examples (e.g., \'transaction creation\', \'error handling\', \'pagination\')'),
      language: z.enum(['both', 'golang', 'typescript']).default('both').describe('Which SDK language to search'),
      maxResults: z.number().min(1).max(10).default(5).describe('Maximum number of examples to return')
    },
    wrapToolHandler(async (args: any, extra: any) => {
      const validatedArgs = validateArgs(args, z.object({
        query: z.string().min(3),
        language: z.enum(['both', 'golang', 'typescript']).default('both'),
        maxResults: z.number().min(1).max(10).default(5)
      })) as { query: string; language: string; maxResults: number };
      const { query, language, maxResults } = validatedArgs;

      const examples = findSdkExamples(query, language, maxResults);
      
      return {
        query,
        language,
        maxResults,
        results: {
          count: examples.length,
          examples: examples.map(example => ({
            language: example.language,
            title: example.title,
            description: example.description,
            file: example.file,
            codeSnippet: example.codeSnippet,
            tags: example.tags
          }))
        }
      };
    })
  );
};

/**
 * Generate SDK code examples
 */
function generateSdkCode(language: string, useCase: string, includeComments: boolean) {
  if (language === 'golang') {
    return generateGolangCode(useCase, includeComments);
  } else {
    return generateTypeScriptCode(useCase, includeComments);
  }
}

/**
 * Generate Golang code examples
 */
function generateGolangCode(useCase: string, includeComments: boolean) {
  const examples: Record<string, CodeExample> = {
    'basic-setup': {
      title: 'Basic Midaz Go SDK Setup',
      description: 'Initialize and configure the Midaz Go SDK with authentication',
      code: `package main

import (
\t"context"
\t"log"
\t"os"

\tclient "github.com/LerianStudio/midaz-sdk-golang"
\t"github.com/LerianStudio/midaz-sdk-golang/pkg/config"
\tauth "github.com/LerianStudio/midaz-sdk-golang/pkg/access-manager"
)

func main() {
\t${includeComments ? '// Configure Access Manager authentication' : ''}
\tAccessManager := auth.AccessManager{
\t\tEnabled:      true,
\t\tAddress:      os.Getenv("AUTH_SERVICE_URL"),
\t\tClientID:     os.Getenv("MIDAZ_CLIENT_ID"),
\t\tClientSecret: os.Getenv("MIDAZ_CLIENT_SECRET"),
\t}

\t${includeComments ? '// Create SDK configuration' : ''}
\tcfg, err := config.NewConfig(
\t\tconfig.WithAccessManager(AccessManager),
\t)
\tif err != nil {
\t\tlog.Fatalf("Failed to create config: %v", err)
\t}

\t${includeComments ? '// Initialize the Midaz client' : ''}
\tc, err := client.New(
\t\tclient.WithConfig(cfg),
\t\tclient.UseAllAPIs(),
\t)
\tif err != nil {
\t\tlog.Fatalf("Failed to create client: %v", err)
\t}
\tdefer c.Shutdown(context.Background())

\tlog.Println("Midaz client initialized successfully")
}`,
      dependencies: ['github.com/LerianStudio/midaz-sdk-golang'],
      runInstructions: ['Set environment variables', 'Run with: go run main.go']
    },
    'organization-crud': {
      title: 'Organization Management',
      description: 'Create, read, update, and delete organizations using the Go SDK',
      code: `package main

import (
\t"context"
\t"log"

\tclient "github.com/LerianStudio/midaz-sdk-golang"
\t"github.com/LerianStudio/midaz-sdk-golang/models"
)

func main() {
\t${includeComments ? '// Initialize client (setup omitted for brevity)' : ''}
\tc := initializeClient()
\tdefer c.Shutdown(context.Background())

\tctx := context.Background()

\t${includeComments ? '// Create an organization' : ''}
\torg, err := c.Entity.Organizations.CreateOrganization(ctx, &models.CreateOrganizationInput{
\t\tLegalName:       "Example Corporation",
\t\tLegalDocument:   "123456789",
\t\tDoingBusinessAs: "Example Inc.",
\t})
\tif err != nil {
\t\tlog.Fatalf("Failed to create organization: %v", err)
\t}

\tlog.Printf("Organization created: %s", org.ID)

\t${includeComments ? '// List all organizations' : ''}
\torgs, err := c.Entity.Organizations.ListOrganizations(ctx, nil)
\tif err != nil {
\t\tlog.Fatalf("Failed to list organizations: %v", err)
\t}

\tlog.Printf("Found %d organizations", len(orgs.Items))
}`,
      dependencies: ['github.com/LerianStudio/midaz-sdk-golang'],
      runInstructions: ['Implement initializeClient() function', 'Run with: go run main.go']
    }
  };

  return examples[useCase] || examples['basic-setup'];
}

/**
 * Generate TypeScript code examples
 */
function generateTypeScriptCode(useCase: string, includeComments: boolean) {
  const examples: Record<string, CodeExample> = {
    'basic-setup': {
      title: 'Basic TypeScript SDK Setup',
      description: 'Initialize and configure the Midaz TypeScript SDK',
      code: `import { createClient } from 'midaz-sdk';
import * as dotenv from 'dotenv';

${includeComments ? '// Load environment variables' : ''}
dotenv.config();

async function main() {
\t${includeComments ? '// Initialize client with API key authentication' : ''}
\tconst client = createClient({
\t\tapiKey: process.env.MIDAZ_API_KEY!,
\t\tenvironment: 'sandbox',
\t\tapiVersion: 'v1'
\t});

\ttry {
\t\t${includeComments ? '// Test connection by listing organizations' : ''}
\t\tconst organizations = await client.entities.organizations.listOrganizations();
\t\tconsole.log(\`Found \${organizations.length} organizations\`);
\t} catch (error) {
\t\tconsole.error('Error:', error);
\t} finally {
\t\t${includeComments ? '// Clean up resources' : ''}
\t\tclient.close();
\t}
}

main().catch(console.error);`,
      dependencies: ['midaz-sdk', 'dotenv'],
      runInstructions: ['Create .env file with MIDAZ_API_KEY', 'Run with: npx ts-node index.ts']
    },
    'organization-crud': {
      title: 'Organization Management',
      description: 'Create and manage organizations using the TypeScript SDK',
      code: `import { createClient, createOrganizationBuilder } from 'midaz-sdk';

async function main() {
\t${includeComments ? '// Initialize client' : ''}
\tconst client = createClient({
\t\tapiKey: process.env.MIDAZ_API_KEY!,
\t\tenvironment: 'sandbox'
\t});

\ttry {
\t\t${includeComments ? '// Create organization using builder pattern' : ''}
\t\tconst organizationInput = createOrganizationBuilder(
\t\t\t'Example Corporation',
\t\t\t'123456789',
\t\t\t'Example Inc.'
\t\t)
\t\t\t.withAddress({
\t\t\t\tline1: '123 Main St',
\t\t\t\tcity: 'New York',
\t\t\t\tstate: 'NY',
\t\t\t\tzipCode: '10001',
\t\t\t\tcountry: 'US'
\t\t\t})
\t\t\t.build();

\t\tconst organization = await client.entities.organizations.createOrganization(organizationInput);
\t\tconsole.log('Organization created:', organization.id);

\t\t${includeComments ? '// List all organizations' : ''}
\t\tconst organizations = await client.entities.organizations.listOrganizations();
\t\tconsole.log(\`Found \${organizations.length} organizations\`);
\t} catch (error) {
\t\tconsole.error('Error:', error);
\t} finally {
\t\tclient.close();
\t}
}

main().catch(console.error);`,
      dependencies: ['midaz-sdk'],
      runInstructions: ['Set MIDAZ_API_KEY environment variable', 'Run with: npx ts-node index.ts']
    }
  };

  return examples[useCase] || examples['basic-setup'];
}

/**
 * Compare features between SDKs
 */
function compareFeatures(features: string[]) {
  const comparisons: Record<string, FeatureComparison> = {};
  
  for (const feature of features) {
    switch (feature) {
    case 'authentication':
      comparisons[feature] = {
        golang: {
          approach: 'Access Manager with functional options',
          strengths: ['Compile-time validation', 'Strong typing', 'Environment variable support']
        },
        typescript: {
          approach: 'Access Manager with builder pattern', 
          strengths: ['Fluent interfaces', 'OAuth integration', 'Type-safe configuration']
        }
      };
      break;
    case 'error-handling':
      comparisons[feature] = {
        golang: {
          approach: 'Explicit error handling with rich error types',
          strengths: ['Compile-time error checking', 'Field-level validation', 'Error categorization']
        },
        typescript: {
          approach: 'Exception-based with enhanced recovery',
          strengths: ['Automatic retries', 'Smart recovery', 'Verification callbacks']
        }
      };
      break;
    case 'performance':
      comparisons[feature] = {
        golang: {
          approach: 'Compiled binary with low overhead',
          strengths: ['High throughput', 'Low memory usage', 'Fast startup']
        },
        typescript: {
          approach: 'V8 engine optimization',
          strengths: ['Good performance', 'Caching mechanisms', 'Optimized serialization']
        }
      };
      break;
    default:
      comparisons[feature] = {
        golang: { approach: 'Go-specific implementation', strengths: ['Performance', 'Type safety'] },
        typescript: { approach: 'TypeScript-specific implementation', strengths: ['Developer experience', 'Ecosystem'] }
      };
    }
  }
  
  return comparisons;
}

/**
 * Find SDK examples based on query
 */
function findSdkExamples(query: string, language: string, maxResults: number) {
  const queryLower = query.toLowerCase();
  
  // Mock examples based on the cloned repositories
  const mockExamples = [
    {
      language: 'golang',
      title: 'Complete Workflow Example',
      description: 'End-to-end workflow showing organization, ledger, account, and transaction creation',
      file: 'workflow-with-entities/main.go',
      codeSnippet: 'func createOrganization(client *client.Client) (*models.Organization, error) { ... }',
      tags: ['workflow', 'organization', 'ledger', 'account', 'transaction'],
      relevance: calculateRelevance(queryLower, ['workflow', 'organization', 'ledger'])
    },
    {
      language: 'typescript',
      title: 'Workflow Example',
      description: 'Comprehensive financial workflow with error recovery and observability',
      file: 'workflow.ts',
      codeSnippet: 'const accountInput = createAccountBuilder("Savings", "USD").withType("savings").build();',
      tags: ['workflow', 'error-recovery', 'observability', 'builder-pattern'],
      relevance: calculateRelevance(queryLower, ['workflow', 'error', 'builder'])
    },
    {
      language: 'golang',
      title: 'Transaction Processing',
      description: 'Various transaction patterns including DSL and batch processing',
      file: 'transaction-example/main.go',
      codeSnippet: 'tx, err := client.Entity.Transactions.CreateTransactionWithDSL(...)',
      tags: ['transaction', 'dsl', 'batch', 'payment'],
      relevance: calculateRelevance(queryLower, ['transaction', 'payment', 'dsl'])
    },
    {
      language: 'typescript',
      title: 'Error Handling Example',
      description: 'Enhanced error recovery mechanisms and validation',
      file: 'error-handling-example.ts',
      codeSnippet: 'await withEnhancedRecovery(() => operation(), { maxRetries: 3 });',
      tags: ['error-handling', 'validation', 'recovery'],
      relevance: calculateRelevance(queryLower, ['error', 'handling', 'validation'])
    }
  ];

  // Filter by language
  const filteredExamples = mockExamples.filter(example => {
    if (language === 'both') return true;
    return example.language === language;
  });

  // Filter by relevance and sort
  return filteredExamples
    .filter(example => example.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Calculate relevance score for search
 */
function calculateRelevance(query: string, tags: string[]): number {
  let score = 0;
  const keywords = query.split(' ');
  
  for (const keyword of keywords) {
    for (const tag of tags) {
      if (tag.includes(keyword) || keyword.includes(tag)) {
        score += tag === keyword ? 10 : 5;
      }
    }
  }
  
  return score;
}