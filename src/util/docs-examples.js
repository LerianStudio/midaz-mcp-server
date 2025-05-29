/**
 * Documentation Examples Generator
 * Generates contextual code examples and workflows
 */

import { createLogger } from './mcp-logging.js';

const logger = createLogger('docs-examples');

// ===========================================
// CONTEXTUAL EXAMPLE GENERATION
// ===========================================

/**
 * Generate contextual examples for specific use cases
 */
export async function generateContextualExamples(useCase, language, format, includeErrorHandling) {
  const exampleGenerators = {
    'create organization': () => generateOrganizationExample(language, format, includeErrorHandling),
    'create ledger': () => generateLedgerExample(language, format, includeErrorHandling),
    'create account': () => generateAccountExample(language, format, includeErrorHandling),
    'create transaction': () => generateTransactionExample(language, format, includeErrorHandling),
    'transfer between accounts': () => generateTransferExample(language, format, includeErrorHandling),
    'check balance': () => generateBalanceExample(language, format, includeErrorHandling),
    'list transactions': () => generateListTransactionsExample(language, format, includeErrorHandling),
    'get asset rates': () => generateAssetRateExample(language, format, includeErrorHandling),
    'manage portfolios': () => generatePortfolioExample(language, format, includeErrorHandling),
    'segment analysis': () => generateSegmentExample(language, format, includeErrorHandling)
  };

  const normalizedUseCase = useCase.toLowerCase();
  const generator = exampleGenerators[normalizedUseCase];
  
  if (!generator) {
    // Try partial matching
    const partialMatch = Object.keys(exampleGenerators).find(key => 
      key.includes(normalizedUseCase) || normalizedUseCase.includes(key)
    );
    
    if (partialMatch) {
      return exampleGenerators[partialMatch]();
    }
    
    throw new Error(`No examples available for use case: ${useCase}`);
  }

  return generator();
}

/**
 * Get related use cases for a given use case
 */
export async function getRelatedUseCases(useCase) {
  const relationships = {
    'create organization': ['create ledger', 'manage portfolios'],
    'create ledger': ['create account', 'create transaction'],
    'create account': ['create transaction', 'check balance', 'transfer between accounts'],
    'create transaction': ['check balance', 'list transactions'],
    'transfer between accounts': ['create transaction', 'check balance'],
    'check balance': ['list transactions', 'transfer between accounts'],
    'list transactions': ['create transaction', 'check balance'],
    'get asset rates': ['create transaction', 'transfer between accounts'],
    'manage portfolios': ['create account', 'segment analysis'],
    'segment analysis': ['manage portfolios', 'list transactions']
  };

  return relationships[useCase.toLowerCase()] || [];
}

// ===========================================
// WORKFLOW DOCUMENTATION
// ===========================================

/**
 * Generate workflow documentation
 */
export async function generateWorkflowDocumentation(workflow, includeCode, format) {
  const workflows = {
    'user-onboarding': generateUserOnboardingWorkflow(includeCode, format),
    'transaction-processing': generateTransactionProcessingWorkflow(includeCode, format),
    'balance-inquiry': generateBalanceInquiryWorkflow(includeCode, format),
    'asset-management': generateAssetManagementWorkflow(includeCode, format),
    'reporting': generateReportingWorkflow(includeCode, format)
  };

  if (workflow === 'all') {
    const allWorkflows = {};
    for (const [key, value] of Object.entries(workflows)) {
      allWorkflows[key] = value;
    }
    return allWorkflows;
  }

  return { [workflow]: workflows[workflow] };
}

/**
 * Generate user onboarding workflow
 */
function generateUserOnboardingWorkflow(includeCode, format) {
  const steps = [
    {
      step: 1,
      title: "Create Organization",
      description: "Set up the top-level organization entity",
      prerequisites: ["API credentials", "Organization details"],
      code: includeCode ? getOrganizationCreationCode() : null
    },
    {
      step: 2,
      title: "Create Initial Ledger",
      description: "Create the first ledger for the organization",
      prerequisites: ["Organization ID from step 1"],
      code: includeCode ? getLedgerCreationCode() : null
    },
    {
      step: 3,
      title: "Set Up Chart of Accounts",
      description: "Create necessary accounts for business operations",
      prerequisites: ["Ledger ID from step 2", "Account structure plan"],
      code: includeCode ? getAccountCreationCode() : null
    },
    {
      step: 4,
      title: "Configure Assets",
      description: "Define assets that will be used in transactions",
      prerequisites: ["Asset definitions", "Rate configurations"],
      code: includeCode ? getAssetConfigurationCode() : null
    },
    {
      step: 5,
      title: "Test Transaction Flow",
      description: "Execute a test transaction to verify setup",
      prerequisites: ["Account IDs", "Asset codes"],
      code: includeCode ? getTestTransactionCode() : null
    }
  ];

  return formatWorkflow(steps, format, "User Onboarding");
}

/**
 * Generate transaction processing workflow
 */
function generateTransactionProcessingWorkflow(includeCode, format) {
  const steps = [
    {
      step: 1,
      title: "Validate Input",
      description: "Validate transaction request and business rules",
      code: includeCode ? getValidationCode() : null
    },
    {
      step: 2,
      title: "Check Balances",
      description: "Verify sufficient balances for the transaction",
      code: includeCode ? getBalanceCheckCode() : null
    },
    {
      step: 3,
      title: "Create Transaction",
      description: "Submit the transaction with operations",
      code: includeCode ? getTransactionCreationCode() : null
    },
    {
      step: 4,
      title: "Monitor Status",
      description: "Track transaction status until completion",
      code: includeCode ? getStatusMonitoringCode() : null
    },
    {
      step: 5,
      title: "Handle Result",
      description: "Process successful completion or handle errors",
      code: includeCode ? getResultHandlingCode() : null
    }
  ];

  return formatWorkflow(steps, format, "Transaction Processing");
}

/**
 * Generate balance inquiry workflow
 */
function generateBalanceInquiryWorkflow(includeCode, format) {
  const steps = [
    {
      step: 1,
      title: "Identify Account",
      description: "Determine the account to query",
      code: includeCode ? getAccountIdentificationCode() : null
    },
    {
      step: 2,
      title: "Query Current Balance",
      description: "Retrieve current balance for specified assets",
      code: includeCode ? getCurrentBalanceCode() : null
    },
    {
      step: 3,
      title: "Get Historical Data",
      description: "Optionally retrieve balance history",
      code: includeCode ? getHistoricalBalanceCode() : null
    },
    {
      step: 4,
      title: "Format Response",
      description: "Format and return balance information",
      code: includeCode ? getBalanceFormattingCode() : null
    }
  ];

  return formatWorkflow(steps, format, "Balance Inquiry");
}

/**
 * Generate asset management workflow
 */
function generateAssetManagementWorkflow(includeCode, format) {
  const steps = [
    {
      step: 1,
      title: "Define Asset",
      description: "Create or update asset definition",
      code: includeCode ? getAssetDefinitionCode() : null
    },
    {
      step: 2,
      title: "Configure Rates",
      description: "Set up exchange rates and pricing",
      code: includeCode ? getRateConfigurationCode() : null
    },
    {
      step: 3,
      title: "Monitor Usage",
      description: "Track asset usage across transactions",
      code: includeCode ? getAssetMonitoringCode() : null
    },
    {
      step: 4,
      title: "Update Rates",
      description: "Periodically update asset rates",
      code: includeCode ? getRateUpdateCode() : null
    }
  ];

  return formatWorkflow(steps, format, "Asset Management");
}

/**
 * Generate reporting workflow
 */
function generateReportingWorkflow(includeCode, format) {
  const steps = [
    {
      step: 1,
      title: "Define Report Parameters",
      description: "Set time range, accounts, and metrics",
      code: includeCode ? getReportParametersCode() : null
    },
    {
      step: 2,
      title: "Aggregate Data",
      description: "Collect and aggregate transaction data",
      code: includeCode ? getDataAggregationCode() : null
    },
    {
      step: 3,
      title: "Calculate Metrics",
      description: "Compute balances, volumes, and trends",
      code: includeCode ? getMetricsCalculationCode() : null
    },
    {
      step: 4,
      title: "Format Output",
      description: "Generate report in requested format",
      code: includeCode ? getReportFormattingCode() : null
    }
  ];

  return formatWorkflow(steps, format, "Reporting");
}

// ===========================================
// EXAMPLE GENERATORS BY USE CASE
// ===========================================

function generateOrganizationExample(language, format, includeErrorHandling) {
  const examples = {
    curl: {
      basic: `curl -X POST https://api.midaz.io/v1/organizations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{
    "name": "ACME Corporation",
    "code": "ACME",
    "metadata": {
      "industry": "Technology",
      "country": "US"
    }
  }'`,
      complete: `# Create Organization with full configuration
curl -X POST https://api.midaz.io/v1/organizations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{
    "name": "ACME Corporation",
    "code": "ACME", 
    "description": "Technology company providing innovative solutions",
    "metadata": {
      "industry": "Technology",
      "country": "US",
      "timezone": "America/New_York",
      "contact": {
        "email": "admin@acme.com",
        "phone": "+1-555-0123"
      }
    },
    "settings": {
      "currency": "USD",
      "fiscalYearStart": "01-01"
    }
  }'`,
      'production-ready': `#!/bin/bash
# Production-ready organization creation script

API_BASE_URL="https://api.midaz.io/v1"
API_TOKEN="\${MIDAZ_API_TOKEN}"

# Validate token
if [ -z "$API_TOKEN" ]; then
  echo "Error: MIDAZ_API_TOKEN environment variable not set"
  exit 1
fi

# Create organization with retry logic
create_organization() {
  local retries=3
  local delay=2
  
  for ((i=1; i<=retries; i++)); do
    response=\$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/organizations" \\\\
      -H "Content-Type: application/json" \\\\
      -H "Authorization: Bearer $API_TOKEN" \\\\
      -d '{
        "name": "ACME Corporation",
        "code": "ACME",
        "description": "Technology company",
        "metadata": {
          "industry": "Technology",
          "country": "US",
          "created_by": "automation-script"
        }
      }')
    
    http_code="\${response: -3}"
    body="\${response%???}"
    
    if [ "$http_code" -eq 201 ]; then
      echo "Success: Organization created"
      echo "$body" | jq '.'
      return 0
    elif [ "$http_code" -eq 409 ]; then
      echo "Warning: Organization already exists"
      return 0
    elif [ "$http_code" -ge 500 ]; then
      echo "Attempt $i failed with server error $http_code, retrying..."
      sleep $delay
      delay=\$((delay * 2))
    else
      echo "Failed with client error $http_code:"
      echo "$body" | jq '.error // .'
      return 1
    fi
  done
  
  echo "Error: Failed after $retries attempts"
  return 1
}

create_organization`
    },
    javascript: {
      basic: `const response = await fetch('https://api.midaz.io/v1/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiToken}\`
  },
  body: JSON.stringify({
    name: 'ACME Corporation',
    code: 'ACME',
    metadata: {
      industry: 'Technology',
      country: 'US'
    }
  })
});

const organization = await response.json();`,
      complete: `import { MidazClient } from '@midaz/sdk';

const client = new MidazClient({
  apiToken: process.env.MIDAZ_API_TOKEN,
  baseUrl: 'https://api.midaz.io/v1'
});

async function createOrganization() {
  try {
    const organization = await client.organizations.create({
      name: 'ACME Corporation',
      code: 'ACME',
      description: 'Technology company providing innovative solutions',
      metadata: {
        industry: 'Technology',
        country: 'US',
        timezone: 'America/New_York',
        contact: {
          email: 'admin@acme.com',
          phone: '+1-555-0123'
        }
      },
      settings: {
        currency: 'USD',
        fiscalYearStart: '01-01'
      }
    });
    
    console.log('Organization created:', organization);
    return organization;
  } catch (error) {
    console.error('Failed to create organization:', error.message);
    throw error;
  }
}`,
      'production-ready': `import { MidazClient, MidazError } from '@midaz/sdk';
import { setTimeout } from 'timers/promises';

const client = new MidazClient({
  apiToken: process.env.MIDAZ_API_TOKEN,
  baseUrl: process.env.MIDAZ_API_URL || 'https://api.midaz.io/v1',
  timeout: 10000,
  retries: 3
});

interface OrganizationConfig {
  name: string;
  code: string;
  description?: string;
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
}

class OrganizationService {
  private client: MidazClient;
  
  constructor(client: MidazClient) {
    this.client = client;
  }
  
  async createOrganization(config: OrganizationConfig) {
    const maxRetries = 3;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Validate configuration
        this.validateConfig(config);
        
        // Check if organization already exists
        const existing = await this.findExistingOrganization(config.code);
        if (existing) {
          console.log(\`Organization \${config.code} already exists\`);
          return existing;
        }
        
        // Create organization
        const organization = await this.client.organizations.create(config);
        
        // Verify creation
        await this.verifyOrganization(organization.id);
        
        console.log(\`Successfully created organization: \${organization.id}\`);
        return organization;
        
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof MidazError) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            // Client error - don't retry
            throw error;
          }
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(\`Attempt \${attempt} failed, retrying in \${delay}ms...\`);
          await setTimeout(delay);
        }
      }
    }
    
    throw new Error(\`Failed to create organization after \${maxRetries} attempts: \${lastError.message}\`);
  }
  
  private validateConfig(config: OrganizationConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Organization name is required');
    }
    
    if (!config.code || !/^[A-Z0-9_-]+$/.test(config.code)) {
      throw new Error('Organization code must contain only uppercase letters, numbers, underscores, and hyphens');
    }
    
    if (config.code.length > 20) {
      throw new Error('Organization code must be 20 characters or less');
    }
  }
  
  private async findExistingOrganization(code: string) {
    try {
      return await this.client.organizations.getByCode(code);
    } catch (error) {
      if (error instanceof MidazError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  
  private async verifyOrganization(id: string) {
    const org = await this.client.organizations.get(id);
    if (!org) {
      throw new Error('Organization creation verification failed');
    }
    return org;
  }
}

// Usage
const orgService = new OrganizationService(client);

const organization = await orgService.createOrganization({
  name: 'ACME Corporation',
  code: 'ACME',
  description: 'Technology company providing innovative solutions',
  metadata: {
    industry: 'Technology',
    country: 'US',
    created_at: new Date().toISOString(),
    created_by: 'api-client'
  }
});`
    }
  };

  return examples[language]?.[format] || examples.curl.basic;
}

function generateTransactionExample(language, format, includeErrorHandling) {
  const examples = {
    curl: {
      basic: `curl -X POST https://api.midaz.io/v1/organizations/org_123/ledgers/led_456/transactions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{
    "description": "Payment processing",
    "operations": [
      {
        "type": "debit",
        "account_id": "acc_789",
        "asset_code": "USD",
        "amount": 100.00
      },
      {
        "type": "credit",
        "account_id": "acc_101", 
        "asset_code": "USD",
        "amount": 100.00
      }
    ]
  }'`,
      complete: `# Complete transaction with metadata and reference
curl -X POST https://api.midaz.io/v1/organizations/org_123/ledgers/led_456/transactions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "description": "Customer payment for order #12345",
    "external_id": "order_12345_payment",
    "metadata": {
      "order_id": "12345",
      "customer_id": "cust_789",
      "payment_method": "credit_card"
    },
    "operations": [
      {
        "type": "debit",
        "account_id": "acc_customer_receivables",
        "asset_code": "USD", 
        "amount": 100.00,
        "description": "Payment received from customer"
      },
      {
        "type": "credit",
        "account_id": "acc_cash",
        "asset_code": "USD",
        "amount": 100.00,
        "description": "Cash account increase"
      }
    ]
  }'`
    }
  };

  return examples[language]?.[format] || examples.curl.basic;
}

// Additional example generators would follow similar patterns...

// ===========================================
// WORKFLOW FORMATTING
// ===========================================

function formatWorkflow(steps, format, title) {
  switch (format) {
    case 'checklist':
      return formatAsWorkflowChecklist(steps, title);
    case 'flowchart':
      return formatAsFlowchart(steps, title);
    case 'tutorial':
    default:
      return formatAsTutorial(steps, title);
  }
}

function formatAsWorkflowChecklist(steps, title) {
  return {
    title,
    checklist: steps.map(step => ({
      item: `☐ ${step.title}`,
      description: step.description,
      prerequisites: step.prerequisites || [],
      hasCode: !!step.code
    })),
    totalSteps: steps.length
  };
}

function formatAsFlowchart(steps, title) {
  const flowchart = steps.map((step, index) => {
    const isLast = index === steps.length - 1;
    return `[${step.step}] ${step.title}${isLast ? '' : ' →'}`;
  }).join('\n');

  return {
    title,
    flowchart,
    steps: steps.map(s => ({ step: s.step, title: s.title, description: s.description }))
  };
}

function formatAsTutorial(steps, title) {
  return {
    title,
    overview: `This tutorial walks through the ${title.toLowerCase()} process step by step.`,
    steps,
    estimatedTime: `${steps.length * 5}-${steps.length * 10} minutes`,
    difficulty: steps.length <= 3 ? 'Beginner' : steps.length <= 5 ? 'Intermediate' : 'Advanced'
  };
}

// ===========================================
// CODE SNIPPETS FOR WORKFLOWS
// ===========================================

function getOrganizationCreationCode() {
  return `curl -X POST https://api.midaz.io/v1/organizations \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "My Company", "code": "MYCO"}'`;
}

function getLedgerCreationCode() {
  return `curl -X POST https://api.midaz.io/v1/organizations/$ORG_ID/ledgers \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "Main Ledger", "code": "MAIN"}'`;
}

function getAccountCreationCode() {
  return `curl -X POST https://api.midaz.io/v1/organizations/$ORG_ID/ledgers/$LEDGER_ID/accounts \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "Cash Account", "code": "CASH", "type": "asset"}'`;
}

function getAssetConfigurationCode() {
  return `curl -X POST https://api.midaz.io/v1/organizations/$ORG_ID/assets \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"code": "USD", "name": "US Dollar", "type": "currency"}'`;
}

function getTestTransactionCode() {
  return `curl -X POST https://api.midaz.io/v1/organizations/$ORG_ID/ledgers/$LEDGER_ID/transactions \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"description": "Test transaction", "operations": [...]}'`;
}

// Additional code snippet functions...
function getValidationCode() { return "// Validation code..."; }
function getBalanceCheckCode() { return "// Balance check code..."; }
function getTransactionCreationCode() { return "// Transaction creation code..."; }
function getStatusMonitoringCode() { return "// Status monitoring code..."; }
function getResultHandlingCode() { return "// Result handling code..."; }
function getAccountIdentificationCode() { return "// Account identification code..."; }
function getCurrentBalanceCode() { return "// Current balance code..."; }
function getHistoricalBalanceCode() { return "// Historical balance code..."; }
function getBalanceFormattingCode() { return "// Balance formatting code..."; }
function getAssetDefinitionCode() { return "// Asset definition code..."; }
function getRateConfigurationCode() { return "// Rate configuration code..."; }
function getAssetMonitoringCode() { return "// Asset monitoring code..."; }
function getRateUpdateCode() { return "// Rate update code..."; }
function getReportParametersCode() { return "// Report parameters code..."; }
function getDataAggregationCode() { return "// Data aggregation code..."; }
function getMetricsCalculationCode() { return "// Metrics calculation code..."; }
function getReportFormattingCode() { return "// Report formatting code..."; }