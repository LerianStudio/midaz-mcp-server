import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * SDK Knowledge Cache - Stores processed SDK information for quick access
 */
interface SdkKnowledge {
  golang: {
    overview: string;
    quickStart: string;
    architecture: string;
    examples: Array<{ name: string; description: string; code: string }>;
    features: Array<{ name: string; description: string; usage: string }>;
    authentication: string;
    configuration: string;
    bestPractices: string;
  };
  typescript: {
    overview: string;
    quickStart: string;
    architecture: string;
    examples: Array<{ name: string; description: string; code: string }>;
    features: Array<{ name: string; description: string; usage: string }>;
    authentication: string;
    configuration: string;
    bestPractices: string;
  };
  comparison: string;
  recommendations: {
    useGolang: string;
    useTypeScript: string;
  };
}

// Cache for SDK knowledge
let sdkKnowledgeCache: SdkKnowledge | null = null;

/**
 * Load and process SDK knowledge from cloned repositories
 */
const loadSdkKnowledge = (): SdkKnowledge => {
  if (sdkKnowledgeCache) {
    return sdkKnowledgeCache;
  }

  const tempSdkPath = join(process.cwd(), 'temp-sdks');
  const golangPath = join(tempSdkPath, 'midaz-sdk-golang');
  const typescriptPath = join(tempSdkPath, 'midaz-sdk-typescript');

  // Check if SDK repositories exist
  const golangExists = existsSync(golangPath);
  const typescriptExists = existsSync(typescriptPath);

  sdkKnowledgeCache = {
    golang: {
      overview: golangExists ? loadGolangOverview(golangPath) : 'Golang SDK not available for analysis',
      quickStart: golangExists ? loadGolangQuickStart(golangPath) : 'Golang SDK not available',
      architecture: golangExists ? loadGolangArchitecture(golangPath) : 'Architecture documentation not available',
      examples: golangExists ? loadGolangExamples(golangPath) : [],
      features: golangExists ? loadGolangFeatures(golangPath) : [],
      authentication: golangExists ? loadGolangAuthentication(golangPath) : 'Authentication guide not available',
      configuration: golangExists ? loadGolangConfiguration(golangPath) : 'Configuration guide not available',
      bestPractices: golangExists ? loadGolangBestPractices(golangPath) : 'Best practices not available',
    },
    typescript: {
      overview: typescriptExists ? loadTypeScriptOverview(typescriptPath) : 'TypeScript SDK not available for analysis',
      quickStart: typescriptExists ? loadTypeScriptQuickStart(typescriptPath) : 'TypeScript SDK not available',
      architecture: typescriptExists ? loadTypeScriptArchitecture(typescriptPath) : 'Architecture documentation not available',
      examples: typescriptExists ? loadTypeScriptExamples(typescriptPath) : [],
      features: typescriptExists ? loadTypeScriptFeatures(typescriptPath) : [],
      authentication: typescriptExists ? loadTypeScriptAuthentication(typescriptPath) : 'Authentication guide not available',
      configuration: typescriptExists ? loadTypeScriptConfiguration(typescriptPath) : 'Configuration guide not available',
      bestPractices: typescriptExists ? loadTypeScriptBestPractices(typescriptPath) : 'Best practices not available',
    },
    comparison: generateSdkComparison(),
    recommendations: {
      useGolang: generateGolangRecommendations(),
      useTypeScript: generateTypeScriptRecommendations(),
    }
  };

  return sdkKnowledgeCache;
};

/**
 * Load Golang SDK overview and features
 */
const loadGolangOverview = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      
      // Extract key sections from README
      const sections = {
        description: extractSection(readme, '# Midaz Go SDK', '## Features'),
        features: extractSection(readme, '## Features', '## Documentation'),
        installation: extractSection(readme, '## Installation', '## Quick Start'),
        overview: extractSection(readme, '## Overview', '## Installation') || extractSection(readme, '## Documentation', '## Installation'),
      };

      return `# Midaz Go SDK Overview

${sections.description || 'A comprehensive Go client for the Midaz financial ledger API.'}

## Key Features

${sections.features || `
- **Comprehensive API Coverage**: Complete support for all Midaz API endpoints
- **Functional Options Pattern**: Flexible configuration with type-safe, chainable options
- **Plugin-based Authentication**: Secure authentication through the Access Manager
- **Robust Error Handling**: Detailed error information with field-level validation
- **Concurrency Support**: Built-in utilities for parallel processing and batching
- **Observability**: Integrated tracing, metrics, and logging capabilities
- **Pagination**: Generic pagination utilities for large datasets
- **Retry Mechanism**: Configurable retry with exponential backoff
- **Environment Support**: Seamless switching between environments
- **Idiomatic Go Design**: Follows Go best practices and conventions
`}

## Installation

${sections.installation || `
\`\`\`bash
go get github.com/LerianStudio/midaz-sdk-golang
\`\`\`
`}

## Overview

${sections.overview || 'The Midaz Go SDK provides a powerful and flexible way to interact with the Midaz platform, enabling developers to build robust financial applications with ease.'}
`;
    }
  } catch (error) {
    console.error('Error loading Golang overview:', error);
  }
  
  return 'Golang SDK overview not available';
};

/**
 * Load Golang quick start guide
 */
const loadGolangQuickStart = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const quickStart = extractSection(readme, '## Quick Start', '## Client Configuration') ||
                        extractSection(readme, '## Quick Start', '## SDK Architecture');
      
      if (quickStart) {
        return `# Midaz Go SDK - Quick Start

${quickStart}

## Next Steps

1. **Explore Examples**: Check the \`examples/\` directory for comprehensive workflow examples
2. **Read Documentation**: Visit the SDK documentation for detailed API reference
3. **Configure Authentication**: Set up Access Manager for secure API access
4. **Enable Observability**: Configure tracing and metrics for production monitoring
`;
      }
    }
  } catch (error) {
    console.error('Error loading Golang quick start:', error);
  }
  
  return 'Golang SDK quick start guide not available';
};

/**
 * Load Golang architecture information
 */
const loadGolangArchitecture = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const architecture = extractSection(readme, '## SDK Architecture', '### Models') ||
                          extractSection(readme, '## Architecture', '## Working with Entities');
      
      if (architecture) {
        return `# Midaz Go SDK - Architecture

${architecture}

## Package Structure

The SDK is organized into the following main packages:

- **client**: Main entry point and client configuration
- **entities**: Service interfaces for all Midaz resources
- **models**: Data structures representing Midaz entities
- **pkg/**: Utility packages for various cross-cutting concerns
  - **config**: Configuration management and environment handling
  - **concurrent**: Concurrency utilities, batching, and rate limiting
  - **observability**: Tracing, metrics, and logging capabilities
  - **pagination**: Generic pagination for large datasets
  - **validation**: Input validation with helpful error messages
  - **errors**: Structured error handling with field-level details
  - **retry**: Configurable retry mechanisms with exponential backoff
  - **performance**: Performance optimization utilities
`;
      }
    }
  } catch (error) {
    console.error('Error loading Golang architecture:', error);
  }
  
  return 'Golang SDK architecture documentation not available';
};

/**
 * Load Golang examples
 */
const loadGolangExamples = (path: string): Array<{ name: string; description: string; code: string }> => {
  const examples: Array<{ name: string; description: string; code: string }> = [];
  
  try {
    const examplesPath = join(path, 'examples');
    if (existsSync(examplesPath)) {
      // List of known example directories
      const exampleDirs = [
        'workflow-with-entities',
        'configuration-examples', 
        'concurrency-example',
        'observability-example',
        'retry-example',
        'context-example',
        'validation-example'
      ];
      
      for (const dir of exampleDirs) {
        const examplePath = join(examplesPath, dir, 'main.go');
        if (existsSync(examplePath)) {
          const code = readFileSync(examplePath, 'utf-8');
          const description = extractCommentDescription(code);
          
          examples.push({
            name: dir,
            description: description || `Example demonstrating ${dir.replace('-', ' ')}`,
            code: code.length > 5000 ? code.substring(0, 5000) + '\\n\\n// ... (truncated)' : code
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading Golang examples:', error);
  }
  
  return examples;
};

/**
 * Load Golang features
 */
const loadGolangFeatures = (_path: string): Array<{ name: string; description: string; usage: string }> => {
  return [
    {
      name: 'Access Manager Authentication',
      description: 'Plugin-based authentication system that integrates with external identity providers',
      usage: `// Configure Access Manager
AccessManager := auth.AccessManager{
    Enabled:      true,
    Address:      "https://your-auth-service.com",
    ClientID:     "your-client-id",
    ClientSecret: "your-client-secret",
}

cfg, err := config.NewConfig(
    config.WithAccessManager(AccessManager),
)`
    },
    {
      name: 'Functional Options Pattern',
      description: 'Type-safe, chainable configuration options for flexible client setup',
      usage: `client, err := client.New(
    client.WithConfig(cfg),
    client.WithTimeout(30 * time.Second),
    client.WithRetries(3, 100*time.Millisecond, 1*time.Second),
    client.WithObservability(true, true, true),
    client.UseAllAPIs(),
)`
    },
    {
      name: 'Concurrency Utilities',
      description: 'Built-in support for parallel processing, batching, and rate limiting',
      usage: `// Process items in parallel
results := concurrent.WorkerPool(
    ctx,
    accountIDs,
    func(ctx context.Context, accountID string) (*models.Account, error) {
        return client.Entity.Accounts.GetAccount(ctx, "org-id", "ledger-id", accountID)
    },
    concurrent.WithWorkers(5),
)`
    },
    {
      name: 'Enhanced Error Handling',
      description: 'Structured error handling with field-level validation and recovery suggestions',
      usage: `if err != nil {
    switch {
    case errors.IsValidationError(err):
        fieldErrs := errors.GetFieldErrors(err)
        // Handle field-level validation errors
    case errors.IsNotFoundError(err):
        // Handle resource not found
    case errors.IsNetworkError(err):
        // Handle network issues
    }
}`
    },
    {
      name: 'Observability Integration',
      description: 'Built-in tracing, metrics, and logging with OpenTelemetry support',
      usage: `client, err := client.New(
    client.WithObservability(true, true, true), // tracing, metrics, logging
    client.UseAllAPIs(),
)

// Trace operations
err = client.Trace("create-organization", func(ctx context.Context) error {
    _, err := client.Entity.Organizations.CreateOrganization(ctx, input)
    return err
})`
    }
  ];
};

/**
 * Load TypeScript SDK overview
 */
const loadTypeScriptOverview = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      
      const sections = {
        description: extractSection(readme, '# Midaz SDK for TypeScript', '## Overview'),
        overview: extractSection(readme, '## Overview', '## Features'),
        features: extractSection(readme, '## Features', '## Installation'),
        installation: extractSection(readme, '## Installation', '## Quick Start'),
      };

      return `# Midaz TypeScript SDK Overview

${sections.description || 'A TypeScript client library for interacting with the Midaz API.'}

## Overview

${sections.overview || 'The Midaz SDK enables seamless integration with Midaz financial services platform with full TypeScript type safety.'}

## Key Features

${sections.features || `
- **Type-Safe API**: Full TypeScript support with accurate type definitions
- **Builder Pattern**: Fluent interfaces for constructing complex objects
- **Comprehensive Error Handling**: Sophisticated error handling with recovery mechanisms
- **Observability**: Built-in tracing, metrics, and logging capabilities
- **Layered Architecture**: Clear separation between client, entities, API, and model layers
- **Automatic Retries**: Configurable retry policies for transient failures
- **Concurrency Controls**: Utilities for managing parallel operations
- **Caching**: In-memory caching mechanisms for improved performance
- **Validation**: Extensive input validation with clear error messages
- **API Versioning**: Support for multiple API versions with transformers
- **Access Manager**: Plugin-based authentication with external identity providers
`}

## Installation

${sections.installation || `
\`\`\`bash
npm install midaz-sdk
# or
yarn add midaz-sdk
\`\`\`
`}
`;
    }
  } catch (error) {
    console.error('Error loading TypeScript overview:', error);
  }
  
  return 'TypeScript SDK overview not available';
};

/**
 * Load TypeScript quick start guide
 */
const loadTypeScriptQuickStart = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const quickStart = extractSection(readme, '## Quick Start', '### Using Access Manager for Authentication') ||
                        extractSection(readme, '## Quick Start', '## Authentication');
      
      if (quickStart) {
        return `# Midaz TypeScript SDK - Quick Start

${quickStart}

## Next Steps

1. **Explore Examples**: Check the \`examples/\` directory for comprehensive workflow examples
2. **Read Documentation**: Visit the \`docs/\` directory for detailed guides
3. **Configure Authentication**: Set up Access Manager for secure API access
4. **Enable Type Safety**: Leverage TypeScript's type system for better development experience
`;
      }
    }
  } catch (error) {
    console.error('Error loading TypeScript quick start:', error);
  }
  
  return 'TypeScript SDK quick start guide not available';
};

/**
 * Load TypeScript architecture information
 */
const loadTypeScriptArchitecture = (path: string): string => {
  try {
    const docsPath = join(path, 'docs', 'architecture');
    if (existsSync(docsPath)) {
      const overviewPath = join(docsPath, 'overview.md');
      if (existsSync(overviewPath)) {
        const overview = readFileSync(overviewPath, 'utf-8');
        return `# Midaz TypeScript SDK - Architecture

${overview}

## Package Structure

The SDK follows a layered architecture:

- **src/client.ts**: Main client entry point and configuration
- **src/entities/**: High-level entity interfaces and implementations
- **src/api/**: HTTP client layer and API interfaces  
- **src/models/**: Data models and validation schemas
- **src/util/**: Cross-cutting utility modules
  - **auth/**: Access Manager and authentication utilities
  - **cache/**: Caching mechanisms and strategies
  - **concurrency/**: Rate limiting and worker pool utilities
  - **config/**: Configuration management
  - **data/**: Data formatting, pagination, and transformation
  - **error/**: Enhanced error handling and recovery
  - **network/**: HTTP client and retry policies
  - **observability/**: Tracing, metrics, and logging
  - **validation/**: Input validation and schema checking
`;
      }
    } else {
      // Fallback to README architecture section
      const readmePath = join(path, 'README.md');
      if (existsSync(readmePath)) {
        const readme = readFileSync(readmePath, 'utf-8');
        const docsSection = extractSection(readme, '## Documentation', '## TypeScript Support');
        if (docsSection) {
          return `# Midaz TypeScript SDK - Architecture

${docsSection}`;
        }
      }
    }
  } catch (error) {
    console.error('Error loading TypeScript architecture:', error);
  }
  
  return 'TypeScript SDK architecture documentation not available';
};

/**
 * Load TypeScript examples
 */
const loadTypeScriptExamples = (path: string): Array<{ name: string; description: string; code: string }> => {
  const examples: Array<{ name: string; description: string; code: string }> = [];
  
  try {
    const examplesPath = join(path, 'examples');
    if (existsSync(examplesPath)) {
      const exampleFiles = [
        'workflow.ts',
        'client-config-example.ts',
        'error-handling-example.ts',
        'concurrency-example.ts',
        'observability-example.ts',
        'validation-example.ts',
        'cache-example.ts'
      ];
      
      for (const file of exampleFiles) {
        const examplePath = join(examplesPath, file);
        if (existsSync(examplePath)) {
          const code = readFileSync(examplePath, 'utf-8');
          const description = extractCommentDescription(code);
          
          examples.push({
            name: file.replace('.ts', ''),
            description: description || `Example demonstrating ${file.replace('.ts', '').replace('-', ' ')}`,
            code: code.length > 5000 ? code.substring(0, 5000) + '\\n\\n// ... (truncated)' : code
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading TypeScript examples:', error);
  }
  
  return examples;
};

/**
 * Load TypeScript features
 */
const loadTypeScriptFeatures = (_path: string): Array<{ name: string; description: string; usage: string }> => {
  return [
    {
      name: 'Builder Pattern',
      description: 'Fluent interfaces for constructing complex objects with type safety',
      usage: `import { createAccountBuilder, createTransactionBuilder } from 'midaz-sdk';

const accountInput = createAccountBuilder('Savings Account', 'USD')
  .withType('savings')
  .withAlias('personal-savings')
  .withMetadata({ purpose: 'Personal savings account' })
  .build();

const transactionInput = createTransactionBuilder()
  .withCode('payment_001')
  .withOperations([/* operations */])
  .withMetadata({ purpose: 'Monthly payment' })
  .build();`
    },
    {
      name: 'Enhanced Error Recovery',
      description: 'Sophisticated error handling with automatic retries and verification',
      usage: `import { withEnhancedRecovery } from 'midaz-sdk/util/error';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, input),
  {
    maxRetries: 3,
    enableSmartRecovery: true,
    verifyOperation: async () => {
      // Custom verification logic
      return true;
    }
  }
);`
    },
    {
      name: 'Access Manager Authentication',
      description: 'Plugin-based authentication with external identity providers',
      usage: `import { createClientConfigWithAccessManager } from 'midaz-sdk';

const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withEnvironment('sandbox')
    .withApiVersion('v1')
);`
    },
    {
      name: 'Observability Integration',
      description: 'Built-in tracing, metrics, and logging with OpenTelemetry support',
      usage: `import { Observability } from 'midaz-sdk';

Observability.configure({
  enableTracing: true,
  enableMetrics: true,
  enableLogging: true,
  serviceName: 'my-financial-app'
});

// Automatic instrumentation of all SDK operations
const span = Observability.startSpan('custom-operation');
// ... perform operations
span.end();`
    },
    {
      name: 'Concurrency Controls',
      description: 'Rate limiting, worker pools, and parallel processing utilities',
      usage: `import { RateLimiter, WorkerPool } from 'midaz-sdk/util/concurrency';

const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000 // 1 minute
});

const workerPool = new WorkerPool({
  concurrency: 5,
  taskTimeout: 30000
});

await workerPool.execute(tasks);`
    }
  ];
};

/**
 * Load authentication guides
 */
const loadGolangAuthentication = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const auth = extractSection(readme, '## Access Manager', '### Environment Variables') ||
                  extractSection(readme, '## Access Manager', '### How It Works');
      
      if (auth) {
        return `# Golang SDK - Authentication

${auth}

## Environment Variables

You can configure authentication using environment variables:

\`\`\`bash
PLUGIN_AUTH_ENABLED=true
PLUGIN_AUTH_ADDRESS=https://your-auth-service.com
MIDAZ_CLIENT_ID=your-client-id
MIDAZ_CLIENT_SECRET=your-client-secret
\`\`\`

## Benefits

- **Security**: No hardcoded tokens in application code
- **Flexibility**: Easy switching between authentication providers
- **Centralized Management**: Single location for auth configuration
- **Automatic Refresh**: Tokens refreshed automatically when expired
`;
      }
    }
  } catch (error) {
    console.error('Error loading Golang authentication:', error);
  }
  
  return 'Golang authentication guide not available';
};

const loadTypeScriptAuthentication = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const auth = extractSection(readme, '## Authentication', '## Documentation') ||
                  extractSection(readme, '### Using Access Manager for Authentication', '## Authentication');
      
      if (auth) {
        return `# TypeScript SDK - Authentication

${auth}

The Access Manager eliminates the need to manage authentication tokens manually by integrating with external identity providers using OAuth flows.
`;
      }
    }
  } catch (error) {
    console.error('Error loading TypeScript authentication:', error);
  }
  
  return 'TypeScript authentication guide not available';
};

/**
 * Load configuration guides
 */
const loadGolangConfiguration = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const config = extractSection(readme, '## Client Configuration', '## SDK Architecture') ||
                   extractSection(readme, '## Environment Variables', '## Documentation');
      
      if (config) {
        return `# Golang SDK - Configuration

${config}

## Environment Variables

The SDK supports these environment variables:

- \`MIDAZ_AUTH_TOKEN\`: Authentication token
- \`MIDAZ_ENVIRONMENT\`: Environment (local, development, production)
- \`MIDAZ_ONBOARDING_URL\`: Override for onboarding service URL
- \`MIDAZ_TRANSACTION_URL\`: Override for transaction service URL
- \`MIDAZ_DEBUG\`: Enable debug mode (true/false)
- \`MIDAZ_MAX_RETRIES\`: Maximum number of retry attempts
`;
      }
    }
  } catch (error) {
    console.error('Error loading Golang configuration:', error);
  }
  
  return 'Golang configuration guide not available';
};

const loadTypeScriptConfiguration = (_path: string): string => {
  return `# TypeScript SDK - Configuration

## Client Configuration

\`\`\`typescript
import { createClient } from 'midaz-sdk';

const client = createClient({
  apiKey: 'your-api-key',
  environment: 'sandbox', // 'development', 'sandbox', 'production'
  apiVersion: 'v1',
  timeout: 30000,
  retries: 3
});
\`\`\`

## Environment-Specific Configuration

\`\`\`typescript
// Sandbox environment
const sandboxClient = createClient({
  environment: 'sandbox',
  // ... other options
});

// Production environment
const productionClient = createClient({
  environment: 'production',
  // ... other options
});
\`\`\`

## Configuration with Access Manager

\`\`\`typescript
const client = createClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  environment: 'sandbox',
});
\`\`\`
`;
};

/**
 * Load best practices
 */
const loadGolangBestPractices = (path: string): string => {
  try {
    const readmePath = join(path, 'README.md');
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      const practices = extractSection(readme, '## Best Practices', '## Contributing') ||
                       extractSection(readme, '### Error Handling', '### Context Usage');
      
      if (practices) {
        return `# Golang SDK - Best Practices

${practices}

## Additional Recommendations

1. **Always use contexts**: Pass context.Context for timeouts and cancellation
2. **Handle errors properly**: Check error types and extract field-level details
3. **Clean up resources**: Use defer to ensure proper cleanup
4. **Use pagination**: For large datasets, use the pagination utilities
5. **Enable observability**: Configure tracing and metrics for production
6. **Validate inputs**: Use the validation utilities before API calls
`;
      }
    }
  } catch (error) {
    console.error('Error loading Golang best practices:', error);
  }
  
  return 'Golang best practices not available';
};

const loadTypeScriptBestPractices = (_path: string): string => {
  return `# TypeScript SDK - Best Practices

## Error Handling

\`\`\`typescript
try {
  const result = await client.entities.accounts.createAccount(orgId, ledgerId, input);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Validation errors:', error.fieldErrors);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.log('Network error:', error.message);
  }
}
\`\`\`

## Resource Management

\`\`\`typescript
// Always clean up resources
const client = createClient(config);
try {
  // Use the client
} finally {
  client.close();
}
\`\`\`

## Type Safety

\`\`\`typescript
// Leverage TypeScript's type system
interface CreateAccountRequest {
  name: string;
  assetCode: string;
  type: AccountType;
}

const request: CreateAccountRequest = {
  name: 'My Account',
  assetCode: 'USD',
  type: 'savings'
};
\`\`\`

## Async/Await Best Practices

\`\`\`typescript
// Use Promise.all for parallel operations
const [accounts, assets] = await Promise.all([
  client.entities.accounts.listAccounts(orgId, ledgerId),
  client.entities.assets.listAssets(orgId, ledgerId)
]);

// Use enhanced recovery for critical operations
const result = await withEnhancedRecovery(
  () => criticalOperation(),
  { maxRetries: 3 }
);
\`\`\`
`;
};

/**
 * Generate SDK comparison
 */
const generateSdkComparison = (): string => {
  return `# Midaz SDK Comparison: Go vs TypeScript

## Language & Ecosystem

### Go SDK
- **Language**: Go (Golang) 1.24+
- **Ecosystem**: Native Go modules, strong in backend/microservices
- **Type Safety**: Compile-time type checking with Go's type system
- **Performance**: High performance, low memory footprint
- **Concurrency**: Built-in goroutines and channels support

### TypeScript SDK  
- **Language**: TypeScript 5.8+ (compiles to JavaScript)
- **Ecosystem**: NPM packages, excellent for web/Node.js applications
- **Type Safety**: Compile-time type checking with rich type definitions
- **Performance**: Good performance, V8 engine optimization
- **Concurrency**: Promise-based async/await patterns

## Architecture & Design Patterns

### Go SDK
- **Pattern**: Functional Options Pattern for configuration
- **Structure**: Package-based organization with interfaces
- **Error Handling**: Go's explicit error handling with rich error types
- **Initialization**: Constructor functions with options

### TypeScript SDK
- **Pattern**: Builder Pattern for object construction
- **Structure**: Class-based architecture with layered design  
- **Error Handling**: Exception-based with enhanced recovery mechanisms
- **Initialization**: Class instantiation with configuration objects

## Authentication & Security

### Both SDKs
- **Access Manager**: Plugin-based authentication with external identity providers
- **OAuth Integration**: Support for OAuth2 flows
- **Token Management**: Automatic token refresh and caching
- **Security**: No hardcoded credentials, centralized auth configuration

## Key Features Comparison

| Feature | Go SDK | TypeScript SDK |
|---------|--------|----------------|
| **API Coverage** | Complete | Complete |
| **Type Safety** | ✅ Compile-time | ✅ Compile-time |
| **Error Handling** | Rich error types | Enhanced recovery |
| **Concurrency** | Worker pools, batching | Rate limiting, worker pools |
| **Observability** | OpenTelemetry integration | OpenTelemetry integration |
| **Pagination** | Generic utilities | Pagination abstraction |
| **Retries** | Exponential backoff | Configurable policies |
| **Caching** | Basic support | In-memory caching |
| **Validation** | Field-level validation | Schema validation |
| **Examples** | Comprehensive workflows | Interactive examples |

## Use Case Recommendations

### Choose Go SDK When:
- Building backend microservices or APIs
- Need maximum performance and low latency
- Working in a Go-first technology stack
- Prefer explicit error handling
- Need strong concurrency for high-throughput operations

### Choose TypeScript SDK When:
- Building web applications or Node.js services
- Working with JavaScript/TypeScript ecosystem
- Need rich IDE support and autocomplete
- Prefer promise-based async patterns
- Want fluent builder interfaces for complex objects

## Code Style Comparison

### Organization Creation - Go SDK
\`\`\`go
org, err := client.Entity.Organizations.CreateOrganization(
    ctx,
    &models.CreateOrganizationInput{
        LegalName:       "Example Corporation",
        LegalDocument:   "123456789",
        DoingBusinessAs: "Example Inc.",
        Address: models.Address{
            Line1:   "123 Main St",
            City:    "New York",
            State:   "NY",
            ZipCode: "10001",
            Country: "US",
        },
    },
)
if err != nil {
    // Handle error
}
\`\`\`

### Organization Creation - TypeScript SDK
\`\`\`typescript
const organizationInput = createOrganizationBuilder(
  'Example Corporation', 
  '123456789', 
  'Example Inc.'
)
  .withAddress({
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  })
  .build();

try {
  const org = await client.entities.organizations.createOrganization(organizationInput);
} catch (error) {
  // Handle error
}
\`\`\`

## Performance Characteristics

### Go SDK
- **Memory**: Low memory footprint
- **CPU**: Efficient CPU usage
- **Concurrency**: Excellent with goroutines
- **Startup**: Fast startup time

### TypeScript SDK  
- **Memory**: Higher memory usage (V8 overhead)
- **CPU**: Good performance with V8 optimizations
- **Concurrency**: Good with async/await and worker pools
- **Startup**: Moderate startup time (Node.js initialization)

## Ecosystem Integration

### Go SDK
- **Deployment**: Docker containers, Kubernetes
- **Monitoring**: Prometheus, Grafana integration
- **Logging**: Structured logging with multiple backends
- **Testing**: Built-in testing framework, table-driven tests

### TypeScript SDK
- **Deployment**: Docker, Serverless functions, cloud platforms
- **Monitoring**: APM tools, observability platforms
- **Logging**: Pino logger with pretty printing
- **Testing**: Jest framework with comprehensive test utilities

## Conclusion

Both SDKs provide complete, production-ready access to the Midaz platform. Choose based on your technology stack, performance requirements, and team expertise. The Go SDK excels in high-performance backend scenarios, while the TypeScript SDK provides excellent developer experience for web and Node.js applications.
`;
};

/**
 * Generate recommendations for when to use each SDK
 */
const generateGolangRecommendations = (): string => {
  return `# When to Use the Golang SDK

## Ideal Use Cases

### 1. Backend Microservices
- Building financial microservices that need to integrate with Midaz
- High-throughput transaction processing systems
- Real-time payment processing applications
- Financial data aggregation services

### 2. High-Performance Applications
- Applications requiring low latency and high throughput
- Systems processing thousands of transactions per second
- Real-time financial analytics and reporting
- High-frequency trading or payment processing

### 3. Containerized Deployments
- Docker-based deployments with minimal resource usage
- Kubernetes clusters requiring efficient resource utilization
- Cloud-native applications with auto-scaling requirements
- Serverless functions with fast cold-start requirements

### 4. Enterprise Integration
- Integration with existing Go-based enterprise systems
- Legacy system modernization projects
- Financial institutions with Go-first technology stacks
- Compliance-heavy environments requiring explicit error handling

## Technical Advantages

### Performance Benefits
- **Memory Efficiency**: Low memory footprint ideal for containerized environments
- **CPU Performance**: Compiled binary execution for maximum speed
- **Concurrency**: Native goroutines for handling thousands of concurrent operations
- **Startup Time**: Fast application startup critical for serverless deployments

### Development Benefits
- **Type Safety**: Compile-time error detection prevents runtime issues
- **Error Handling**: Explicit error handling enforces proper error management
- **Testing**: Built-in testing framework with table-driven test patterns
- **Deployment**: Single binary deployment simplifies DevOps processes

### Operational Benefits
- **Monitoring**: Rich observability with OpenTelemetry integration
- **Debugging**: Excellent debugging tools and profiling capabilities
- **Maintenance**: Static compilation eliminates dependency issues
- **Security**: Memory safety and compile-time checks reduce vulnerabilities

## Sample Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Mobile App    │    │  External APIs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │      API Gateway (Go)           │
              │  - Authentication               │
              │  - Rate Limiting               │
              │  - Request Routing             │
              └─────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Transaction     │    │ Account         │    │ Reporting       │
│ Service (Go)    │    │ Service (Go)    │    │ Service (Go)    │
│ - Midaz SDK     │    │ - Midaz SDK     │    │ - Midaz SDK     │
│ - High Volume   │    │ - CRUD Ops      │    │ - Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │      Midaz Platform             │
              └─────────────────────────────────┘
\`\`\`

## Getting Started

### 1. Project Setup
\`\`\`bash
# Initialize Go module
go mod init your-financial-app

# Add Midaz SDK
go get github.com/LerianStudio/midaz-sdk-golang

# Add commonly used dependencies
go get github.com/joho/godotenv  # Environment variables
go get github.com/gin-gonic/gin  # Web framework (optional)
\`\`\`

### 2. Basic Configuration
\`\`\`go
package main

import (
    "context"
    "log"
    
    client "github.com/LerianStudio/midaz-sdk-golang"
    "github.com/LerianStudio/midaz-sdk-golang/pkg/config"
    auth "github.com/LerianStudio/midaz-sdk-golang/pkg/access-manager"
)

func main() {
    // Configure authentication
    AccessManager := auth.AccessManager{
        Enabled:      true,
        Address:      "https://your-auth-service.com",
        ClientID:     "your-client-id", 
        ClientSecret: "your-client-secret",
    }
    
    // Create configuration
    cfg, err := config.NewConfig(
        config.WithAccessManager(AccessManager),
    )
    if err != nil {
        log.Fatalf("Failed to create config: %v", err)
    }
    
    // Initialize client
    c, err := client.New(
        client.WithConfig(cfg),
        client.WithEnvironment(config.EnvironmentProduction),
        client.WithObservability(true, true, true),
        client.UseAllAPIs(),
    )
    if err != nil {
        log.Fatalf("Failed to create client: %v", err)
    }
    defer c.Shutdown(context.Background())
    
    // Your application logic here
    log.Println("Midaz client initialized successfully")
}
\`\`\`

### 3. Error Handling Pattern
\`\`\`go
import "github.com/LerianStudio/midaz-sdk-golang/pkg/errors"

func handleMidazOperation() error {
    result, err := client.Entity.Organizations.CreateOrganization(ctx, input)
    if err != nil {
        switch {
        case errors.IsValidationError(err):
            fieldErrs := errors.GetFieldErrors(err)
            for _, fieldErr := range fieldErrs {
                log.Printf("Validation error on %s: %s", fieldErr.Field, fieldErr.Message)
            }
            return fmt.Errorf("validation failed: %w", err)
            
        case errors.IsNotFoundError(err):
            log.Printf("Resource not found: %v", err)
            return fmt.Errorf("resource not found: %w", err)
            
        case errors.IsNetworkError(err):
            log.Printf("Network error: %v", err)
            return fmt.Errorf("network issue: %w", err)
            
        default:
            log.Printf("Unknown error: %v", err)
            return fmt.Errorf("operation failed: %w", err)
        }
    }
    
    log.Printf("Organization created successfully: %s", result.ID)
    return nil
}
\`\`\`

## Production Considerations

### 1. Configuration Management
- Use environment variables for all configurable values
- Implement configuration validation at startup
- Support multiple environments (dev, staging, prod)
- Use secure secret management for sensitive credentials

### 2. Observability Setup
- Enable distributed tracing with OpenTelemetry
- Configure metrics collection for monitoring
- Implement structured logging with appropriate log levels
- Set up health checks and readiness probes

### 3. Error Handling Strategy
- Implement circuit breakers for external dependencies
- Use retry mechanisms with exponential backoff
- Log errors with sufficient context for debugging
- Implement graceful degradation for non-critical failures

### 4. Performance Optimization
- Use connection pooling for HTTP clients
- Implement request/response caching where appropriate
- Monitor and tune garbage collection settings
- Profile application performance regularly

The Golang SDK is the optimal choice for building robust, high-performance financial applications that need to integrate with the Midaz platform.
`;
};

const generateTypeScriptRecommendations = (): string => {
  return `# When to Use the TypeScript SDK

## Ideal Use Cases

### 1. Web Applications
- Frontend applications needing direct Midaz integration
- Single Page Applications (SPAs) with React, Vue, or Angular
- Progressive Web Apps (PWAs) for financial services
- Admin dashboards and financial management interfaces

### 2. Node.js Backend Services
- RESTful APIs built with Express, Fastify, or NestJS
- GraphQL servers with financial data integration
- Serverless functions (AWS Lambda, Vercel, Netlify)
- Real-time applications with WebSocket integration

### 3. Full-Stack JavaScript Applications
- Next.js applications with server-side rendering
- Nuxt.js applications for financial platforms
- Remix applications with progressive enhancement
- T3 stack applications (Next.js + tRPC + TypeScript)

### 4. Rapid Prototyping & Development
- MVP development for fintech startups
- Proof-of-concept financial applications
- Internal tools and administrative interfaces
- Developer tooling and CLI applications

## Technical Advantages

### Developer Experience
- **IDE Support**: Excellent autocomplete and IntelliSense
- **Type Safety**: Rich type definitions prevent runtime errors
- **Builder Pattern**: Fluent interfaces for complex object creation
- **Hot Reload**: Fast development cycles with instant feedback

### Ecosystem Benefits
- **NPM Packages**: Access to vast JavaScript ecosystem
- **Tooling**: Rich development tools (ESLint, Prettier, Jest)
- **Testing**: Comprehensive testing frameworks and utilities
- **Documentation**: TypeDoc for automatic API documentation

### Integration Advantages
- **Web APIs**: Native browser API integration
- **Frameworks**: Seamless integration with popular frameworks
- **Databases**: Easy integration with various database libraries
- **Cloud Services**: Native support for cloud platform SDKs

## Sample Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   React SPA     │  │  Vue.js Admin   │  │ Angular Mobile  │ │
│  │ - Midaz SDK     │  │ - Midaz SDK     │  │ - Midaz SDK     │ │
│  │ - User Portal   │  │ - Admin Panel   │  │ - Mobile App    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │      API Gateway                │
              │  - Authentication               │
              │  - Rate Limiting               │
              │  - CORS Handling               │
              └─────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────┐
│                   Backend Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Next.js API     │  │ Express.js API  │  │ Lambda Functions│ │
│  │ - Midaz SDK     │  │ - Midaz SDK     │  │ - Midaz SDK     │ │
│  │ - SSR/SSG       │  │ - RESTful API   │  │ - Serverless    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │      Midaz Platform             │
              └─────────────────────────────────┘
\`\`\`

## Getting Started

### 1. Project Setup
\`\`\`bash
# Create new TypeScript project
mkdir financial-app
cd financial-app
npm init -y

# Install TypeScript and tools
npm install -D typescript @types/node ts-node nodemon

# Install Midaz SDK
npm install midaz-sdk

# Install additional dependencies (choose based on your stack)
npm install express  # For REST APIs
npm install next react react-dom  # For Next.js apps
npm install @nestjs/core @nestjs/common  # For NestJS apps
\`\`\`

### 2. Basic Configuration
\`\`\`typescript
import { createClient, MidazClient } from 'midaz-sdk';

// Basic client setup
const client = createClient({
  apiKey: process.env.MIDAZ_API_KEY,
  environment: 'sandbox', // 'development', 'sandbox', 'production'
  apiVersion: 'v1',
});

// Advanced client setup with Access Manager
import { createClientConfigWithAccessManager } from 'midaz-sdk';

const advancedClient = new MidazClient(
  createClientConfigWithAccessManager({
    address: process.env.AUTH_SERVICE_URL!,
    clientId: process.env.OAUTH_CLIENT_ID!,
    clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  })
    .withEnvironment('sandbox')
    .withApiVersion('v1')
    .withTimeout(30000)
    .withRetries(3)
);

// Ensure cleanup
process.on('SIGTERM', () => {
  client.close();
  advancedClient.close();
});
\`\`\`

### 3. Builder Pattern Usage
\`\`\`typescript
import { 
  createAccountBuilder, 
  createTransactionBuilder,
  createOrganizationBuilder 
} from 'midaz-sdk';

// Create organization with builder
const organizationInput = createOrganizationBuilder(
  'Example Corp',
  '123456789',
  'Example Inc.'
)
  .withAddress({
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  })
  .withMetadata({
    industry: 'Financial Services',
    website: 'https://example.com'
  })
  .build();

// Create account with builder
const accountInput = createAccountBuilder('Savings Account', 'USD')
  .withType('savings')
  .withAlias('primary-savings')
  .withMetadata({
    purpose: 'Personal savings',
    interestRate: 0.05
  })
  .build();

// Create transaction with builder
const transactionInput = createTransactionBuilder()
  .withCode('TXN_001')
  .withDescription('Monthly salary deposit')
  .withOperations([
    {
      accountId: 'external-payroll',
      assetCode: 'USD',
      amount: 500000, // $5000.00
      type: 'credit'
    },
    {
      accountId: accountId,
      assetCode: 'USD', 
      amount: 500000,
      type: 'debit'
    }
  ])
  .withMetadata({
    payrollId: 'PAY_2024_01',
    employeeId: 'EMP_12345'
  })
  .build();
\`\`\`

### 4. Error Handling with Enhanced Recovery
\`\`\`typescript
import { 
  withEnhancedRecovery, 
  ValidationError, 
  NetworkError 
} from 'midaz-sdk/util/error';

async function createAccountWithRecovery(
  orgId: string, 
  ledgerId: string, 
  accountInput: any
) {
  try {
    const result = await withEnhancedRecovery(
      () => client.entities.accounts.createAccount(orgId, ledgerId, accountInput),
      {
        maxRetries: 3,
        enableSmartRecovery: true,
        verifyOperation: async () => {
          // Verify account was created
          const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
          return accounts.some(acc => acc.name === accountInput.name);
        }
      }
    );
    
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation errors:', error.fieldErrors);
      throw new Error(\`Invalid account data: \${error.fieldErrors.map(e => e.message).join(', ')}\`);
    } else if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
      throw new Error('Unable to connect to Midaz service');
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
\`\`\`

## Framework Integration Examples

### 1. Express.js API
\`\`\`typescript
import express from 'express';
import { createClient } from 'midaz-sdk';

const app = express();
const midaz = createClient({ 
  apiKey: process.env.MIDAZ_API_KEY,
  environment: 'sandbox'
});

app.use(express.json());

app.post('/api/organizations', async (req, res) => {
  try {
    const organization = await midaz.entities.organizations.createOrganization(req.body);
    res.json(organization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Financial API running on port 3000');
});
\`\`\`

### 2. Next.js API Route
\`\`\`typescript
// pages/api/accounts/[orgId]/[ledgerId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from 'midaz-sdk';

const midaz = createClient({
  apiKey: process.env.MIDAZ_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { orgId, ledgerId } = req.query;
  
  if (req.method === 'GET') {
    try {
      const accounts = await midaz.entities.accounts.listAccounts(
        orgId as string, 
        ledgerId as string
      );
      res.status(200).json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  } else if (req.method === 'POST') {
    try {
      const account = await midaz.entities.accounts.createAccount(
        orgId as string,
        ledgerId as string,
        req.body
      );
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create account' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}
\`\`\`

### 3. React Hook for Midaz Integration
\`\`\`typescript
// hooks/useMidaz.ts
import { useState, useEffect } from 'react';
import { createClient, MidazClient } from 'midaz-sdk';

export function useMidaz() {
  const [client, setClient] = useState<MidazClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const midazClient = createClient({
      apiKey: process.env.NEXT_PUBLIC_MIDAZ_API_KEY,
      environment: 'sandbox'
    });
    
    setClient(midazClient);
    setIsConnected(true);
    
    return () => {
      midazClient.close();
    };
  }, []);
  
  return { client, isConnected };
}

// Component usage
function AccountList({ orgId, ledgerId }: { orgId: string; ledgerId: string }) {
  const { client, isConnected } = useMidaz();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!client || !isConnected) return;
    
    async function fetchAccounts() {
      try {
        const accountList = await client.entities.accounts.listAccounts(orgId, ledgerId);
        setAccounts(accountList);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAccounts();
  }, [client, isConnected, orgId, ledgerId]);
  
  if (loading) return <div>Loading accounts...</div>;
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
\`\`\`

## Production Considerations

### 1. Environment Configuration
\`\`\`typescript
// config/midaz.ts
interface MidazConfig {
  apiKey: string;
  environment: 'development' | 'sandbox' | 'production';
  apiVersion: string;
  timeout: number;
  retries: number;
}

export const getMidazConfig = (): MidazConfig => {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  
  return {
    apiKey: process.env.MIDAZ_API_KEY!,
    environment,
    apiVersion: 'v1',
    timeout: parseInt(process.env.MIDAZ_TIMEOUT || '30000'),
    retries: parseInt(process.env.MIDAZ_RETRIES || '3')
  };
};
\`\`\`

### 2. Observability Setup
\`\`\`typescript
import { Observability } from 'midaz-sdk';

// Configure observability
Observability.configure({
  enableTracing: process.env.ENABLE_TRACING === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true', 
  enableLogging: process.env.ENABLE_LOGGING === 'true',
  serviceName: process.env.SERVICE_NAME || 'financial-app'
});

// Custom metrics
Observability.recordMetric('account.created', 1, {
  organizationId: 'org_123',
  ledgerId: 'ledger_456'
});
\`\`\`

### 3. Testing Setup
\`\`\`typescript
// __tests__/midaz.test.ts
import { createClient } from 'midaz-sdk';

// Mock the SDK for testing
jest.mock('midaz-sdk');

describe('Midaz Integration', () => {
  let mockClient: any;
  
  beforeEach(() => {
    mockClient = {
      entities: {
        accounts: {
          createAccount: jest.fn(),
          listAccounts: jest.fn()
        }
      },
      close: jest.fn()
    };
    
    (createClient as jest.Mock).mockReturnValue(mockClient);
  });
  
  it('should create account successfully', async () => {
    const accountData = { name: 'Test Account', assetCode: 'USD' };
    const expectedAccount = { id: 'acc_123', ...accountData };
    
    mockClient.entities.accounts.createAccount.mockResolvedValue(expectedAccount);
    
    const client = createClient({ apiKey: 'test-key', environment: 'sandbox' });
    const result = await client.entities.accounts.createAccount('org_1', 'ledger_1', accountData);
    
    expect(result).toEqual(expectedAccount);
    expect(mockClient.entities.accounts.createAccount).toHaveBeenCalledWith('org_1', 'ledger_1', accountData);
  });
});
\`\`\`

The TypeScript SDK is the perfect choice for building modern web applications, Node.js services, and full-stack JavaScript applications that need seamless integration with the Midaz platform.
`;
};

/**
 * Utility function to extract sections from markdown content
 */
const extractSection = (content: string, startMarker: string, endMarker?: string): string | null => {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return null;
  
  const contentAfterStart = content.substring(startIndex + startMarker.length);
  
  if (endMarker) {
    const endIndex = contentAfterStart.indexOf(endMarker);
    if (endIndex === -1) return contentAfterStart.trim();
    return contentAfterStart.substring(0, endIndex).trim();
  }
  
  return contentAfterStart.trim();
};

/**
 * Extract description from code comments
 */
const extractCommentDescription = (code: string): string | null => {
  // Look for multi-line comments at the beginning
  const multiLineMatch = code.match(/\/\*\*?\s*(.*?)\s*\*\//s);
  if (multiLineMatch) {
    return multiLineMatch[1]
      .split('\\n')
      .map(line => line.replace(/^\s*\*?\s?/, ''))
      .join(' ')
      .trim();
  }
  
  // Look for single-line comments
  const singleLineMatch = code.match(/^\/\/\s*(.+)/m);
  if (singleLineMatch) {
    return singleLineMatch[1].trim();
  }
  
  return null;
};

/**
 * Register SDK resources with the MCP server
 * @param server MCP server instance
 */
export const registerSdkResources = (server: McpServer) => {
  // Load SDK knowledge on first access
  const getSdkKnowledge = () => loadSdkKnowledge();

  // Golang SDK Overview
  server.resource(
    'golang-sdk-overview',
    'midaz://sdk/golang/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.overview,
        mimeType: 'text/markdown'
      }]
    })
  );

  // Golang SDK Quick Start
  server.resource(
    'golang-sdk-quickstart',
    'midaz://sdk/golang/quickstart',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.quickStart,
        mimeType: 'text/markdown'
      }]
    })
  );

  // Golang SDK Architecture
  server.resource(
    'golang-sdk-architecture',
    'midaz://sdk/golang/architecture',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.architecture,
        mimeType: 'text/markdown'
      }]
    })
  );

  // Golang SDK Examples
  server.resource(
    'golang-sdk-examples',
    'midaz://sdk/golang/examples',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(getSdkKnowledge().golang.examples, null, 2),
        mimeType: 'application/json'
      }]
    })
  );

  // Golang SDK Features
  server.resource(
    'golang-sdk-features', 
    'midaz://sdk/golang/features',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(getSdkKnowledge().golang.features, null, 2),
        mimeType: 'application/json'
      }]
    })
  );

  // Golang SDK Authentication
  server.resource(
    'golang-sdk-authentication',
    'midaz://sdk/golang/authentication',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.authentication,
        mimeType: 'text/markdown'
      }]
    })
  );

  // Golang SDK Configuration
  server.resource(
    'golang-sdk-configuration',
    'midaz://sdk/golang/configuration',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.configuration,
        mimeType: 'text/markdown'
      }]
    })
  );

  // Golang SDK Best Practices
  server.resource(
    'golang-sdk-best-practices',
    'midaz://sdk/golang/best-practices',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().golang.bestPractices,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Overview
  server.resource(
    'typescript-sdk-overview',
    'midaz://sdk/typescript/overview',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.overview,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Quick Start
  server.resource(
    'typescript-sdk-quickstart',
    'midaz://sdk/typescript/quickstart',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.quickStart,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Architecture
  server.resource(
    'typescript-sdk-architecture',
    'midaz://sdk/typescript/architecture',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.architecture,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Examples
  server.resource(
    'typescript-sdk-examples',
    'midaz://sdk/typescript/examples',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(getSdkKnowledge().typescript.examples, null, 2),
        mimeType: 'application/json'
      }]
    })
  );

  // TypeScript SDK Features
  server.resource(
    'typescript-sdk-features',
    'midaz://sdk/typescript/features',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(getSdkKnowledge().typescript.features, null, 2),
        mimeType: 'application/json'
      }]
    })
  );

  // TypeScript SDK Authentication
  server.resource(
    'typescript-sdk-authentication',
    'midaz://sdk/typescript/authentication',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.authentication,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Configuration
  server.resource(
    'typescript-sdk-configuration',
    'midaz://sdk/typescript/configuration',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.configuration,
        mimeType: 'text/markdown'
      }]
    })
  );

  // TypeScript SDK Best Practices
  server.resource(
    'typescript-sdk-best-practices',
    'midaz://sdk/typescript/best-practices',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().typescript.bestPractices,
        mimeType: 'text/markdown'
      }]
    })
  );

  // SDK Comparison
  server.resource(
    'sdk-comparison',
    'midaz://sdk/comparison',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().comparison,
        mimeType: 'text/markdown'
      }]
    })
  );

  // SDK Recommendations - When to use Golang
  server.resource(
    'sdk-recommendations-golang',
    'midaz://sdk/recommendations/golang',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().recommendations.useGolang,
        mimeType: 'text/markdown'
      }]
    })
  );

  // SDK Recommendations - When to use TypeScript
  server.resource(
    'sdk-recommendations-typescript',
    'midaz://sdk/recommendations/typescript',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: getSdkKnowledge().recommendations.useTypeScript,
        mimeType: 'text/markdown'
      }]
    })
  );
};