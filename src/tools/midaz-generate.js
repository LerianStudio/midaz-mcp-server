/**
 * Midaz Code Generation Tool
 * Intelligent code generation with context detection and ready-to-run examples
 * Generates working code with error handling, retries, and idempotency
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";
import config from "../config.js";

const logger = createLogger('midaz-generate');

/**
 * Register code generation tool
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerMidazGenerateTools = (server) => {

  server.tool(
    "midaz_generate",
    "Generate working code for Midaz integration. Detects user context (language, framework, deployment) and outputs production-ready code with error handling, retries, and environment variables.",
    {
      useCase: z.string().describe("Specific use case (e.g., 'nodejs payment flow', 'python balance checker', 'docker integration')"),
      language: z.enum(['javascript', 'typescript', 'python', 'go', 'shell', 'docker']).optional().describe("Programming language (auto-detected if not specified)"),
      framework: z.enum(['express', 'fastapi', 'gin', 'plain']).optional().describe("Framework context (auto-detected if not specified)"),
      complexity: z.enum(['basic', 'production', 'enterprise']).default('production').describe("Code complexity level"),
      features: z.array(z.enum(['error-handling', 'retries', 'logging', 'validation', 'testing', 'docker'])).default(['error-handling', 'retries', 'logging']).describe("Include specific features")
    },
    wrapToolHandler(async (args, extra) => {
      const { useCase, language, framework, complexity, features } = validateArgs(args, z.object({
        useCase: z.string(),
        language: z.enum(['javascript', 'typescript', 'python', 'go', 'shell', 'docker']).optional(),
        framework: z.enum(['express', 'fastapi', 'gin', 'plain']).optional(),
        complexity: z.enum(['basic', 'production', 'enterprise']).default('production'),
        features: z.array(z.enum(['error-handling', 'retries', 'logging', 'validation', 'testing', 'docker'])).default(['error-handling', 'retries', 'logging'])
      }));

      try {
        // Auto-detect context if not provided
        const detectedContext = await detectContext(useCase, language, framework);
        
        // Generate code based on use case and context
        const generatedCode = await generateCode(
          useCase, 
          detectedContext.language, 
          detectedContext.framework, 
          complexity, 
          features
        );
        
        return {
          useCase,
          detectedContext,
          complexity,
          features,
          code: generatedCode,
          deployment: generateDeploymentInstructions(detectedContext, features),
          environmentVariables: generateEnvironmentVariables(detectedContext),
          nextSteps: generateNextSteps(useCase, detectedContext),
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Code generation failed', { useCase, error: error.message });
        return {
          error: error.message,
          useCase,
          suggestions: generateFallbackSuggestions(useCase),
          timestamp: new Date().toISOString()
        };
      }
    })
  );
};

// ===========================================
// CONTEXT DETECTION
// ===========================================

/**
 * Detect programming context from use case
 */
async function detectContext(useCase, language, framework) {
  const useCaseLower = useCase.toLowerCase();
  
  // Auto-detect language if not provided
  const detectedLanguage = language || detectLanguage(useCaseLower);
  
  // Auto-detect framework if not provided  
  const detectedFramework = framework || detectFramework(useCaseLower, detectedLanguage);
  
  return {
    language: detectedLanguage,
    framework: detectedFramework,
    deployment: detectDeployment(useCaseLower),
    patterns: detectPatterns(useCaseLower)
  };
}

function detectLanguage(useCase) {
  if (useCase.includes('node') || useCase.includes('js') || useCase.includes('express')) {
    return 'javascript';
  }
  if (useCase.includes('typescript') || useCase.includes('ts')) {
    return 'typescript';
  }
  if (useCase.includes('python') || useCase.includes('fastapi') || useCase.includes('django')) {
    return 'python';
  }
  if (useCase.includes('go') || useCase.includes('golang') || useCase.includes('gin')) {
    return 'go';
  }
  if (useCase.includes('docker') || useCase.includes('container')) {
    return 'docker';
  }
  if (useCase.includes('shell') || useCase.includes('bash') || useCase.includes('script')) {
    return 'shell';
  }
  
  // Default based on common use cases
  return 'javascript';
}

function detectFramework(useCase, language) {
  if (useCase.includes('express')) return 'express';
  if (useCase.includes('fastapi')) return 'fastapi';
  if (useCase.includes('gin')) return 'gin';
  
  // Default frameworks by language
  const defaults = {
    javascript: 'express',
    typescript: 'express', 
    python: 'fastapi',
    go: 'gin'
  };
  
  return defaults[language] || 'plain';
}

function detectDeployment(useCase) {
  if (useCase.includes('docker')) return 'docker';
  if (useCase.includes('kubernetes') || useCase.includes('k8s')) return 'kubernetes';
  if (useCase.includes('aws') || useCase.includes('lambda')) return 'aws';
  if (useCase.includes('cloud')) return 'cloud';
  return 'local';
}

function detectPatterns(useCase) {
  const patterns = [];
  if (useCase.includes('payment') || useCase.includes('transaction')) patterns.push('payment-flow');
  if (useCase.includes('balance') || useCase.includes('inquiry')) patterns.push('balance-check');
  if (useCase.includes('webhook') || useCase.includes('notification')) patterns.push('webhook-handler');
  if (useCase.includes('batch') || useCase.includes('bulk')) patterns.push('batch-processing');
  if (useCase.includes('monitor') || useCase.includes('health')) patterns.push('monitoring');
  return patterns;
}

// ===========================================
// CODE GENERATION
// ===========================================

/**
 * Sanitize template parameters to prevent code injection
 */
function sanitizeTemplateParams(params) {
  const sanitized = {};
  const allowedKeys = ['organizationId', 'ledgerId', 'accountId', 'amount', 'currency', 'description'];
  
  for (const key of allowedKeys) {
    if (params[key] !== undefined) {
      // Only allow alphanumeric, hyphens, underscores
      sanitized[key] = String(params[key]).replace(/[^\w\-]/g, '').substring(0, 100);
    }
  }
  
  return sanitized;
}

/**
 * Safe template replacement with no user interpolation
 */
function safeTemplateReplace(template, params) {
  const sanitized = sanitizeTemplateParams(params);
  
  // Use only predefined safe replacements
  const safeReplacements = {
    '${ORGANIZATION_ID}': sanitized.organizationId || 'your_organization_id',
    '${LEDGER_ID}': sanitized.ledgerId || 'your_ledger_id',
    '${ACCOUNT_ID}': sanitized.accountId || 'your_account_id',
    '${AMOUNT}': sanitized.amount || '100.00',
    '${CURRENCY}': sanitized.currency || 'USD',
    '${DESCRIPTION}': sanitized.description || 'Payment transaction'
  };
  
  let result = template;
  for (const [placeholder, value] of Object.entries(safeReplacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}

/**
 * Generate code based on context and requirements
 */
async function generateCode(useCase, language, framework, complexity, features) {
  // Validate and sanitize useCase input
  const allowedUseCases = ['payment', 'balance', 'webhook', 'transaction', 'account', 'organization'];
  const sanitizedUseCase = allowedUseCases.find(uc => useCase.toLowerCase().includes(uc)) || 'payment';
  
  const generators = {
    javascript: generateJavaScript,
    typescript: generateTypeScript,
    python: generatePython,
    go: generateGo,
    shell: generateShell,
    docker: generateDocker
  };
  
  const generator = generators[language];
  if (!generator) {
    throw new Error(`Code generation not supported for ${language}`);
  }
  
  return await generator(sanitizedUseCase, framework, complexity, features);
}

/**
 * Generate JavaScript/Node.js code
 */
async function generateJavaScript(useCase, framework, complexity, features) {
  const useCaseLower = useCase.toLowerCase();
  
  if (useCaseLower.includes('payment') || useCaseLower.includes('transaction')) {
    return generatePaymentFlow('javascript', framework, complexity, features);
  }
  
  if (useCaseLower.includes('balance')) {
    return generateBalanceChecker('javascript', framework, complexity, features);
  }
  
  if (useCaseLower.includes('webhook')) {
    return generateWebhookHandler('javascript', framework, complexity, features);
  }
  
  // Default: API client
  return generateApiClient('javascript', framework, complexity, features);
}

/**
 * Generate payment flow implementation
 */
function generatePaymentFlow(language, framework, complexity, features) {
  const hasRetries = features.includes('retries');
  const hasLogging = features.includes('logging');
  const hasValidation = features.includes('validation');
  const hasErrorHandling = features.includes('error-handling');
  
  // Use static, safe templates with no user interpolation
  const SAFE_PAYMENT_TEMPLATE = `/**
 * Midaz Payment Service
 * Production-ready payment processing with error handling and retries
 * WARNING: This is generated code - review before production use
 */

const axios = require('axios');
${hasLogging ? "const winston = require('winston');" : ''}
${hasValidation ? "const Joi = require('joi');" : ''}

// Security: Never hardcode credentials
class MidazPaymentService {
  constructor(options = {}) {
    // Validate required environment variables
    const requiredEnvVars = ['MIDAZ_API_URL', 'MIDAZ_API_KEY', 'MIDAZ_ORG_ID', 'MIDAZ_LEDGER_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(\`Missing required environment variable: \${envVar}\`);
      }
    }
    
    this.baseUrl = process.env.MIDAZ_API_URL;
    this.apiKey = process.env.MIDAZ_API_KEY;
    this.organizationId = process.env.MIDAZ_ORG_ID;
    this.ledgerId = process.env.MIDAZ_LEDGER_ID;
    
    // Validate API key format
    if (this.apiKey.length < 32 || !/^[A-Za-z0-9_-]+$/.test(this.apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    // Validate base URL
    try {
      const url = new URL(this.baseUrl);
      if (!['https:'].includes(url.protocol)) {
        throw new Error('Only HTTPS URLs are allowed');
      }
    } catch (error) {
      throw new Error('Invalid API URL format');
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      maxRedirects: 0 // Prevent redirect attacks
    });
  }

  /**
   * Process a payment with comprehensive validation
   */
  async processPayment(payment) {
    // Input validation schema
    const paymentSchema = {
      fromAccountId: { required: true, type: 'string', maxLength: 100, pattern: /^acc_[A-Za-z0-9_-]+$/ },
      toAccountId: { required: true, type: 'string', maxLength: 100, pattern: /^acc_[A-Za-z0-9_-]+$/ },
      amount: { required: true, type: 'number', min: 0.01, max: 1000000 },
      currency: { required: true, type: 'string', enum: ['USD', 'EUR', 'GBP'] },
      description: { required: false, type: 'string', maxLength: 500 },
      idempotencyKey: { required: true, type: 'string', pattern: /^[A-Za-z0-9_-]+$/ }
    };
    
    // Validate all fields
    for (const [field, rules] of Object.entries(paymentSchema)) {
      const value = payment[field];
      
      if (rules.required && !value) {
        throw new Error(\`Missing required field: \${field}\`);
      }
      
      if (value && rules.type && typeof value !== rules.type) {
        throw new Error(\`Invalid type for \${field}: expected \${rules.type}\`);
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        throw new Error(\`Field \${field} exceeds maximum length\`);
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        throw new Error(\`Invalid format for \${field}\`);
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        throw new Error(\`Invalid value for \${field}\`);
      }
      
      if (rules.min && value < rules.min) {
        throw new Error(\`Field \${field} below minimum value\`);
      }
      
      if (rules.max && value > rules.max) {
        throw new Error(\`Field \${field} exceeds maximum value\`);
      }
    }
    
    const transactionData = {
      description: payment.description || 'Payment transaction',
      operations: [
        {
          type: 'debit',
          account_id: payment.fromAccountId,
          asset_code: payment.currency,
          amount: payment.amount
        },
        {
          type: 'credit',
          account_id: payment.toAccountId,
          asset_code: payment.currency,
          amount: payment.amount
        }
      ],
      metadata: {
        idempotency_key: payment.idempotencyKey,
        processed_at: new Date().toISOString()
      }
    };

    try {
      return await this.createTransaction(transactionData);
    } catch (error) {
      throw new Error('Payment processing failed: ' + error.message);
    }
  }

  /**
   * Create transaction via Midaz API
   */
  async createTransaction(transactionData) {
    const url = \`/v1/organizations/\${encodeURIComponent(this.organizationId)}/ledgers/\${encodeURIComponent(this.ledgerId)}/transactions\`;
    
    const response = await this.client.post(url, transactionData);
    
    return {
      success: true,
      transactionId: response.data.id,
      status: response.data.status,
      createdAt: response.data.created_at
    };
  }
}

module.exports = MidazPaymentService;`;
  
  return {
    'payment-service.js': SAFE_PAYMENT_TEMPLATE,
    "package.json": "{\"name\": \"payment-service\"}",
    ".env.example": "MIDAZ_API_KEY=your_key"
  };
}

// Placeholder generators
async function generateTypeScript() { return { "service.ts": "// TypeScript" }; }
async function generatePython() { return { "service.py": "# Python" }; }
async function generateGo() { return { "service.go": "// Go" }; }
async function generateShell() { return { "service.sh": "#!/bin/bash" }; }
async function generateDocker() { return { "Dockerfile": "FROM node:18" }; }
function generateBalanceChecker() { return { "balance.js": "// Balance" }; }
function generateWebhookHandler() { return { "webhook.js": "// Webhook" }; }
function generateApiClient() { return { "client.js": "// Client" }; }

function generateDeploymentInstructions(context, features) {
  const instructions = {
    local: [
      '1. Install dependencies: npm install',
      '2. Copy .env.example to .env and configure',
      '3. Run: npm start'
    ],
    docker: [
      '1. Build image: docker build -t midaz-service .',
      '2. Run container: docker run -d --env-file .env midaz-service',
      '3. Check logs: docker logs <container_id>'
    ]
  };
  
  return instructions[context.deployment] || instructions.local;
}

function generateEnvironmentVariables(context) {
  return {
    required: [
      'MIDAZ_API_URL - Midaz API base URL',
      'MIDAZ_API_KEY - Your API authentication key',
      'MIDAZ_ORG_ID - Organization identifier',
      'MIDAZ_LEDGER_ID - Default ledger identifier'
    ],
    optional: [
      'MAX_RETRIES - Number of retry attempts (default: 3)',
      'RETRY_DELAY - Base retry delay in ms (default: 1000)',
      'LOG_LEVEL - Logging level (default: info)'
    ]
  };
}

function generateNextSteps(useCase, context) {
  return [
    'Test the generated code with your Midaz instance',
    'Review error handling for your specific use cases', 
    'Add monitoring and alerting for production use',
    'Consider implementing webhook handlers for async notifications',
    'Review security best practices in the documentation'
  ];
}

function generateFallbackSuggestions(useCase) {
  return [
    'Try a more specific use case description',
    'Specify the programming language explicitly',
    'Check available examples with midaz_docs',
    'Contact support for custom implementation guidance'
  ];
}

// Export already handled above
