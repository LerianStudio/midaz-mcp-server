/**
 * Documentation Troubleshooting Utilities
 * Provides troubleshooting guides, common issues, and diagnostic tools
 */

import { createLogger } from './mcp-logging.js';

const logger = createLogger('docs-troubleshooting');

// ===========================================
// TROUBLESHOOTING GUIDE GENERATION
// ===========================================

/**
 * Generate comprehensive troubleshooting guide
 */
export async function generateTroubleshootingGuide(category, severity, includePreventionTips) {
  const guides = {
    authentication: generateAuthTroubleshooting(severity, includePreventionTips),
    'api-errors': generateApiErrorTroubleshooting(severity, includePreventionTips),
    performance: generatePerformanceTroubleshooting(severity, includePreventionTips),
    'data-consistency': generateDataConsistencyTroubleshooting(severity, includePreventionTips),
    integration: generateIntegrationTroubleshooting(severity, includePreventionTips)
  };

  if (category === 'all') {
    return guides;
  }

  return guides[category] || null;
}

/**
 * Get common issues by category
 */
export async function getCommonIssues(category) {
  const issues = {
    authentication: [
      {
        issue: "401 Unauthorized Error",
        frequency: "Very Common",
        description: "API requests failing with 401 status",
        quickFix: "Verify API token is valid and properly formatted"
      },
      {
        issue: "Token Expiration",
        frequency: "Common",
        description: "API token has expired",
        quickFix: "Refresh or regenerate API token"
      },
      {
        issue: "Invalid Bearer Format",
        frequency: "Common",
        description: "Authorization header not properly formatted",
        quickFix: "Ensure header format is 'Bearer {token}'"
      }
    ],
    'api-errors': [
      {
        issue: "400 Bad Request",
        frequency: "Very Common",
        description: "Request validation failures",
        quickFix: "Check request payload against API documentation"
      },
      {
        issue: "409 Conflict",
        frequency: "Common",
        description: "Resource already exists or constraint violation",
        quickFix: "Check if resource exists or modify request to avoid conflict"
      },
      {
        issue: "422 Validation Error",
        frequency: "Common",
        description: "Request data fails business rule validation",
        quickFix: "Review validation errors in response and adjust data"
      }
    ],
    performance: [
      {
        issue: "Slow API Response Times",
        frequency: "Common",
        description: "API requests taking longer than expected",
        quickFix: "Implement pagination and reduce payload size"
      },
      {
        issue: "Rate Limiting",
        frequency: "Common",
        description: "Hitting API rate limits",
        quickFix: "Implement exponential backoff and respect rate limit headers"
      },
      {
        issue: "Timeout Errors",
        frequency: "Occasional",
        description: "Requests timing out",
        quickFix: "Increase timeout settings and optimize query parameters"
      }
    ],
    'data-consistency': [
      {
        issue: "Balance Mismatch",
        frequency: "Rare",
        description: "Account balances don't match expected values",
        quickFix: "Verify all transactions are properly recorded and committed"
      },
      {
        issue: "Duplicate Transactions",
        frequency: "Occasional",
        description: "Same transaction appears multiple times",
        quickFix: "Use idempotency keys for all transaction requests"
      },
      {
        issue: "Missing Operations",
        frequency: "Rare",
        description: "Transaction operations not appearing in ledger",
        quickFix: "Check transaction status and ensure it's committed"
      }
    ],
    integration: [
      {
        issue: "Webhook Delivery Failures",
        frequency: "Common",
        description: "Webhooks not being delivered to endpoints",
        quickFix: "Verify endpoint URL is accessible and returns 200 status"
      },
      {
        issue: "SDK Connection Issues",
        frequency: "Occasional",
        description: "SDK failing to connect to API",
        quickFix: "Check network connectivity and API endpoint configuration"
      },
      {
        issue: "Data Format Mismatches",
        frequency: "Common",
        description: "Data not in expected format between systems",
        quickFix: "Validate data types and format according to API schema"
      }
    ]
  };

  return issues[category] || [];
}

/**
 * Get diagnostic tools
 */
export async function getDiagnosticTools() {
  return {
    apiTesting: {
      name: "API Health Check",
      description: "Test basic API connectivity and authentication",
      command: "curl -H 'Authorization: Bearer $TOKEN' https://api.midaz.io/v1/health",
      expectedResponse: "200 OK with health status"
    },
    tokenValidation: {
      name: "Token Validation",
      description: "Verify API token is valid",
      command: "curl -H 'Authorization: Bearer $TOKEN' https://api.midaz.io/v1/auth/validate",
      expectedResponse: "200 OK with token details"
    },
    networkConnectivity: {
      name: "Network Connectivity Test",
      description: "Test network connectivity to API endpoints",
      command: "ping api.midaz.io && curl -I https://api.midaz.io",
      expectedResponse: "Successful ping and HTTP 200 response"
    },
    balanceVerification: {
      name: "Balance Verification",
      description: "Verify account balances are accurate",
      endpoint: "/v1/organizations/{org_id}/ledgers/{ledger_id}/accounts/{account_id}/balances",
      method: "GET"
    },
    transactionHistory: {
      name: "Transaction History Check",
      description: "Review recent transactions for an account",
      endpoint: "/v1/organizations/{org_id}/ledgers/{ledger_id}/transactions",
      method: "GET",
      parameters: "?account_id={account_id}&limit=50"
    }
  };
}

/**
 * Get prevention tips by category
 */
export async function getPreventionTips(category) {
  const tips = {
    authentication: [
      "Store API tokens securely using environment variables or secret management",
      "Implement token refresh logic before expiration",
      "Use short-lived tokens with refresh capability for better security",
      "Monitor token usage and set up alerts for authentication failures",
      "Implement proper error handling for authentication failures"
    ],
    'api-errors': [
      "Always validate input data before sending requests",
      "Implement retry logic with exponential backoff for transient errors",
      "Use idempotency keys for operations that shouldn't be duplicated",
      "Log all API requests and responses for debugging",
      "Follow API versioning best practices"
    ],
    performance: [
      "Implement pagination for large data sets",
      "Use caching for frequently accessed, rarely changing data",
      "Batch requests when possible to reduce API calls",
      "Monitor and optimize database queries",
      "Implement connection pooling for database connections"
    ],
    'data-consistency': [
      "Always use transactions for related operations",
      "Implement proper error handling and rollback mechanisms",
      "Use database constraints to enforce data integrity",
      "Regularly audit balances and reconcile discrepancies",
      "Implement checksums or hashes for critical data validation"
    ],
    integration: [
      "Test integrations thoroughly in staging environment",
      "Implement proper error handling and retry mechanisms",
      "Use consistent data formats and validation schemas",
      "Monitor integration points with alerting",
      "Document integration contracts and API changes"
    ]
  };

  return tips[category] || [];
}

// ===========================================
// CATEGORY-SPECIFIC TROUBLESHOOTING
// ===========================================

function generateAuthTroubleshooting(severity, includePreventionTips) {
  const issues = [
    {
      title: "401 Unauthorized Errors",
      severity: "high",
      symptoms: [
        "API requests returning 401 status code",
        "Authentication required error messages",
        "Access denied responses"
      ],
      causes: [
        "Invalid or expired API token",
        "Missing Authorization header",
        "Incorrect token format",
        "Token for wrong environment (staging vs production)"
      ],
      solutions: [
        {
          step: 1,
          action: "Verify API token is present and correctly formatted",
          example: "Authorization: Bearer your_api_token_here"
        },
        {
          step: 2,
          action: "Check token expiration date",
          command: "Check token metadata or try refresh"
        },
        {
          step: 3,
          action: "Verify you're using the correct environment token",
          note: "Staging tokens won't work in production"
        },
        {
          step: 4,
          action: "Regenerate token if necessary",
          warning: "Update all applications using the old token"
        }
      ],
      prevention: includePreventionTips ? [
        "Implement token refresh before expiration",
        "Use environment-specific configuration",
        "Monitor authentication failure rates",
        "Set up alerts for token expiration"
      ] : null
    },
    {
      title: "Token Format Issues",
      severity: "medium",
      symptoms: [
        "Malformed authorization header errors",
        "Invalid token format messages"
      ],
      causes: [
        "Missing 'Bearer ' prefix",
        "Extra spaces or characters in header",
        "Base64 encoding issues"
      ],
      solutions: [
        {
          step: 1,
          action: "Ensure proper Bearer token format",
          example: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
        },
        {
          step: 2,
          action: "Check for extra whitespace or special characters",
          command: "echo '$TOKEN' | od -c"
        }
      ]
    }
  ];

  return filterBySeverity(issues, severity);
}

function generateApiErrorTroubleshooting(severity, includePreventionTips) {
  const issues = [
    {
      title: "400 Bad Request Errors",
      severity: "high",
      symptoms: [
        "Request validation failures",
        "Missing required fields errors",
        "Invalid data format messages"
      ],
      causes: [
        "Missing required request fields",
        "Invalid data types or formats",
        "Request body not properly formatted JSON",
        "Incorrect Content-Type header"
      ],
      solutions: [
        {
          step: 1,
          action: "Validate request payload against API documentation",
          tool: "Use JSON schema validator"
        },
        {
          step: 2,
          action: "Check Content-Type header is application/json",
          example: "Content-Type: application/json"
        },
        {
          step: 3,
          action: "Verify all required fields are present",
          command: "Review API documentation for required fields"
        },
        {
          step: 4,
          action: "Test with minimal valid payload first",
          approach: "Build up complexity gradually"
        }
      ]
    },
    {
      title: "409 Conflict Errors",
      severity: "medium",
      symptoms: [
        "Resource already exists errors",
        "Constraint violation messages",
        "Unique key conflicts"
      ],
      causes: [
        "Attempting to create duplicate resources",
        "Violating unique constraints",
        "Concurrent modification conflicts"
      ],
      solutions: [
        {
          step: 1,
          action: "Check if resource already exists",
          method: "Query existing resources first"
        },
        {
          step: 2,
          action: "Use unique identifiers to avoid conflicts",
          suggestion: "Generate UUIDs for external IDs"
        },
        {
          step: 3,
          action: "Implement idempotency for safe retries",
          header: "Idempotency-Key: unique-request-id"
        }
      ]
    }
  ];

  return filterBySeverity(issues, severity);
}

function generatePerformanceTroubleshooting(severity, includePreventionTips) {
  const issues = [
    {
      title: "Slow API Response Times",
      severity: "high",
      symptoms: [
        "Requests taking longer than expected",
        "Timeout errors",
        "High latency measurements"
      ],
      causes: [
        "Large response payloads",
        "Complex queries without pagination",
        "Network latency issues",
        "Server-side performance problems"
      ],
      solutions: [
        {
          step: 1,
          action: "Implement pagination for large datasets",
          parameter: "Use limit and offset parameters"
        },
        {
          step: 2,
          action: "Reduce response payload size",
          method: "Use field selection or filtering"
        },
        {
          step: 3,
          action: "Optimize query parameters",
          suggestion: "Only request necessary data"
        },
        {
          step: 4,
          action: "Monitor network latency",
          tool: "Use network monitoring tools"
        }
      ]
    },
    {
      title: "Rate Limiting Issues",
      severity: "medium",
      symptoms: [
        "429 Too Many Requests errors",
        "Rate limit exceeded messages",
        "Temporary request blocking"
      ],
      solutions: [
        {
          step: 1,
          action: "Implement exponential backoff",
          algorithm: "Retry with increasing delays"
        },
        {
          step: 2,
          action: "Respect rate limit headers",
          headers: "X-RateLimit-Remaining, X-RateLimit-Reset"
        },
        {
          step: 3,
          action: "Batch requests when possible",
          benefit: "Reduce total number of API calls"
        }
      ]
    }
  ];

  return filterBySeverity(issues, severity);
}

function generateDataConsistencyTroubleshooting(severity, includePreventionTips) {
  const issues = [
    {
      title: "Balance Inconsistencies",
      severity: "critical",
      symptoms: [
        "Account balances don't match expected values",
        "Sum of operations doesn't equal balance change",
        "Missing or extra amounts in accounts"
      ],
      causes: [
        "Failed transaction rollbacks",
        "Concurrent transaction conflicts",
        "Double-entry bookkeeping violations",
        "System errors during transaction processing"
      ],
      solutions: [
        {
          step: 1,
          action: "Verify transaction completion status",
          method: "Check transaction status endpoint"
        },
        {
          step: 2,
          action: "Audit transaction operations",
          process: "Sum debits and credits for period"
        },
        {
          step: 3,
          action: "Reconcile with source systems",
          comparison: "Compare with external system balances"
        },
        {
          step: 4,
          action: "Report discrepancies for investigation",
          escalation: "Contact support with transaction details"
        }
      ]
    }
  ];

  return filterBySeverity(issues, severity);
}

function generateIntegrationTroubleshooting(severity, includePreventionTips) {
  const issues = [
    {
      title: "Webhook Delivery Failures",
      severity: "medium",
      symptoms: [
        "Webhooks not being received",
        "Delayed webhook delivery",
        "Webhook retry attempts failing"
      ],
      causes: [
        "Endpoint URL not accessible",
        "SSL certificate issues",
        "Endpoint returning error status codes",
        "Network connectivity problems"
      ],
      solutions: [
        {
          step: 1,
          action: "Verify endpoint URL is accessible",
          test: "Test URL with curl or browser"
        },
        {
          step: 2,
          action: "Check SSL certificate validity",
          command: "openssl s_client -connect your-domain.com:443"
        },
        {
          step: 3,
          action: "Ensure endpoint returns 200 status",
          requirement: "Webhook endpoint must return 2xx status"
        },
        {
          step: 4,
          action: "Review webhook logs",
          location: "Check webhook delivery logs in dashboard"
        }
      ]
    }
  ];

  return filterBySeverity(issues, severity);
}

// ===========================================
// SEARCH AND NAVIGATION HELPERS
// ===========================================

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(query) {
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  // Common search patterns and suggestions
  const patterns = {
    'auth': ['authentication', 'authorization', 'api tokens', 'bearer token'],
    'error': ['troubleshooting', 'common issues', 'error codes', 'debugging'],
    'transaction': ['create transaction', 'transaction flow', 'operations', 'balance'],
    'account': ['create account', 'account types', 'chart of accounts', 'balance'],
    'api': ['api reference', 'endpoints', 'request format', 'response format'],
    'sdk': ['go sdk', 'typescript sdk', 'installation', 'examples'],
    'organization': ['create organization', 'organization setup', 'onboarding'],
    'ledger': ['create ledger', 'ledger management', 'accounting'],
    'balance': ['check balance', 'balance inquiry', 'account balance'],
    'asset': ['asset management', 'asset rates', 'currency'],
    'webhook': ['webhook setup', 'webhook debugging', 'integration']
  };
  
  // Find matching patterns
  for (const [pattern, related] of Object.entries(patterns)) {
    if (queryLower.includes(pattern)) {
      suggestions.push(...related.filter(s => !s.includes(queryLower)));
    }
  }
  
  // Add common typo corrections
  const corrections = {
    'authentification': 'authentication',
    'trasaction': 'transaction',
    'acount': 'account',
    'ballance': 'balance',
    'organiztion': 'organization'
  };
  
  if (corrections[queryLower]) {
    suggestions.unshift(`Did you mean "${corrections[queryLower]}"?`);
  }
  
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Get related topics for a query
 */
export async function getRelatedTopics(query) {
  const queryLower = query.toLowerCase();
  
  const topicRelations = {
    authentication: ['api tokens', 'security', 'authorization', 'bearer token format'],
    transaction: ['operations', 'balance', 'double-entry', 'accounting', 'ledger'],
    account: ['ledger', 'organization', 'balance', 'transaction', 'chart of accounts'],
    organization: ['ledger', 'account', 'onboarding', 'setup', 'hierarchy'],
    api: ['endpoints', 'request format', 'response format', 'error codes', 'authentication'],
    sdk: ['installation', 'examples', 'documentation', 'integration', 'client libraries'],
    balance: ['account', 'transaction', 'inquiry', 'verification', 'reconciliation'],
    webhook: ['integration', 'events', 'callbacks', 'notifications', 'endpoints']
  };
  
  // Find the most relevant topic
  let matchedTopic = null;
  let bestMatch = 0;
  
  for (const [topic, relations] of Object.entries(topicRelations)) {
    if (queryLower.includes(topic)) {
      const matchLength = topic.length;
      if (matchLength > bestMatch) {
        bestMatch = matchLength;
        matchedTopic = topic;
      }
    }
  }
  
  if (matchedTopic) {
    return topicRelations[matchedTopic];
  }
  
  // Return general related topics
  return ['getting started', 'api reference', 'examples', 'troubleshooting', 'best practices'];
}

/**
 * Filter content by type
 */
export function filterByContentType(results, contentType) {
  if (contentType === 'all') {
    return results;
  }
  
  const typeFilters = {
    guides: (r) => r.category === 'docs' && (r.path.includes('guide') || r.path.includes('tutorial')),
    reference: (r) => r.category === 'api' || r.category === 'models',
    examples: (r) => r.path.includes('example') || r.description?.includes('example'),
    troubleshooting: (r) => r.path.includes('troubleshoot') || r.path.includes('debug') || r.path.includes('error')
  };
  
  const filter = typeFilters[contentType];
  return filter ? results.filter(filter) : results;
}

/**
 * Generate documentation sitemap
 */
export function generateSitemap(resources, format, includeMetadata) {
  switch (format) {
    case 'flat':
      return generateFlatSitemap(resources, includeMetadata);
    case 'graph':
      return generateGraphSitemap(resources, includeMetadata);
    case 'tree':
    default:
      return generateTreeSitemap(resources, includeMetadata);
  }
}

function generateTreeSitemap(resources, includeMetadata) {
  const tree = {};
  
  // Group by category
  for (const resource of resources) {
    if (!tree[resource.category]) {
      tree[resource.category] = [];
    }
    
    const item = {
      title: resource.title,
      path: resource.path,
      url: resource.url
    };
    
    if (includeMetadata) {
      item.metadata = {
        description: resource.description,
        name: resource.name,
        source: resource.source
      };
    }
    
    tree[resource.category].push(item);
  }
  
  return tree;
}

function generateFlatSitemap(resources, includeMetadata) {
  return resources.map(resource => {
    const item = {
      title: resource.title,
      path: resource.path,
      url: resource.url,
      category: resource.category
    };
    
    if (includeMetadata) {
      item.metadata = {
        description: resource.description,
        name: resource.name,
        source: resource.source
      };
    }
    
    return item;
  });
}

function generateGraphSitemap(resources, includeMetadata) {
  const nodes = resources.map(resource => ({
    id: resource.path,
    title: resource.title,
    category: resource.category,
    metadata: includeMetadata ? {
      description: resource.description,
      url: resource.url
    } : null
  }));
  
  // Generate edges based on category relationships
  const edges = [];
  const categoryGroups = {};
  
  // Group nodes by category
  for (const node of nodes) {
    if (!categoryGroups[node.category]) {
      categoryGroups[node.category] = [];
    }
    categoryGroups[node.category].push(node.id);
  }
  
  // Create edges within categories
  for (const [category, nodeIds] of Object.entries(categoryGroups)) {
    for (let i = 0; i < nodeIds.length - 1; i++) {
      edges.push({
        from: nodeIds[i],
        to: nodeIds[i + 1],
        type: 'category-relation'
      });
    }
  }
  
  return { nodes, edges };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function filterBySeverity(issues, severity) {
  if (severity === 'all') {
    return issues;
  }
  
  const severityLevels = {
    critical: ['critical'],
    high: ['critical', 'high'],
    medium: ['critical', 'high', 'medium'],
    low: ['critical', 'high', 'medium', 'low']
  };
  
  const allowedSeverities = severityLevels[severity] || ['critical', 'high', 'medium', 'low'];
  return issues.filter(issue => allowedSeverities.includes(issue.severity));
}