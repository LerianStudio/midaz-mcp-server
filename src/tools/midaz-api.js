/**
 * Midaz API Tool
 * Real API interaction with authentication, test/execute modes, and dynamic CRUD operations
 * Replaces individual API tools with unified interface
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";
import config from "../config.js";

const logger = createLogger('midaz-api');

// Exponential backoff configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  jitterMs: 200
};

// Response cache (5 min TTL)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Register unified API tool
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerMidazApiTools = (server) => {

  server.tool(
    "midaz_api",
    "Unified Midaz API interface with real authentication and CRUD operations. Supports test (dry-run) and execute modes with proper error context and exponential backoff.",
    {
      operation: z.enum(['list', 'get', 'create', 'update', 'delete']).describe("CRUD operation to perform"),
      resource: z.enum(['organizations', 'ledgers', 'accounts', 'transactions', 'balances', 'portfolios', 'assets']).describe("Resource type to operate on"),
      mode: z.enum(['test', 'execute']).default('test').describe("test = dry-run with validation, execute = real API call"),
      params: z.object({
        organizationId: z.string().optional(),
        ledgerId: z.string().optional(),
        accountId: z.string().optional(),
        id: z.string().optional(),
        data: z.record(z.any()).optional(),
        filters: z.record(z.any()).optional(),
        pagination: z.object({
          limit: z.number().min(1).max(100).default(10),
          cursor: z.string().optional()
        }).optional()
      }).describe("Operation parameters including IDs, data payload, filters, and pagination")
    },
    wrapToolHandler(async (args, extra) => {
      const { operation, resource, mode, params } = validateArgs(args, z.object({
        operation: z.enum(['list', 'get', 'create', 'update', 'delete']),
        resource: z.enum(['organizations', 'ledgers', 'accounts', 'transactions', 'balances', 'portfolios', 'assets']),
        mode: z.enum(['test', 'execute']).default('test'),
        params: z.object({
          organizationId: z.string().optional(),
          ledgerId: z.string().optional(),
          accountId: z.string().optional(),
          id: z.string().optional(),
          data: z.record(z.any()).optional(),
          filters: z.record(z.any()).optional(),
          pagination: z.object({
            limit: z.number().min(1).max(100).default(10),
            cursor: z.string().optional()
          }).optional()
        })
      }));

      const startTime = Date.now();

      try {
        // Validate operation parameters
        const validation = validateOperationParams(operation, resource, params);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
            operation,
            resource,
            mode,
            timestamp: new Date().toISOString()
          };
        }

        // Test mode: validate and return expected response
        if (mode === 'test') {
          return {
            success: true,
            mode: 'test',
            operation,
            resource,
            validation: validation.details,
            expectedResponse: generateExpectedResponse(operation, resource, params),
            note: "This is a dry-run. Use mode='execute' for real API call.",
            timestamp: new Date().toISOString()
          };
        }

        // Execute mode: real API call
        const auth = await getAuthToken();
        if (!auth.success) {
          return {
            success: false,
            error: "Authentication failed",
            details: auth.error,
            operation,
            resource,
            timestamp: new Date().toISOString()
          };
        }

        const result = await executeApiCall(operation, resource, params, auth.token);

        return {
          success: result.success,
          operation,
          resource,
          mode: 'execute',
          data: result.data,
          error: result.error,
          responseTime: Date.now() - startTime,
          statusCode: result.statusCode,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('API operation failed', { operation, resource, error: error.message });
        return {
          success: false,
          error: error.message,
          operation,
          resource,
          mode,
          troubleshooting: generateTroubleshootingTips(error),
          timestamp: new Date().toISOString()
        };
      }
    })
  );
};

// ===========================================
// API EXECUTION FUNCTIONS
// ===========================================

/**
 * Encrypt sensitive data for cache storage using AES-256-GCM
 */
function encryptCacheData(data) {
  const crypto = require('crypto');

  // Generate a secure key from environment or create a random one
  let key = process.env.CACHE_ENCRYPTION_KEY;
  if (!key) {
    // Generate a random key and warn user
    key = crypto.randomBytes(32).toString('hex');
    logger.warn('No CACHE_ENCRYPTION_KEY set, using temporary key. Set CACHE_ENCRYPTION_KEY for persistent caching.');
  } else if (key.length < 32) {
    // Derive a proper key from the provided key
    key = crypto.createHash('sha256').update(key).digest('hex');
  }

  const keyBuffer = Buffer.from(key.slice(0, 64), 'hex'); // Use first 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  cipher.setAAD(Buffer.from('midaz-cache'));

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
}

function decryptCacheData(encryptedData) {
  const crypto = require('crypto');

  try {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);

    let key = process.env.CACHE_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('No encryption key available for decryption');
    }
    if (key.length < 32) {
      key = crypto.createHash('sha256').update(key).digest('hex');
    }

    const keyBuffer = Buffer.from(key.slice(0, 64), 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    
    // Verify auth tag length (GCM uses 128-bit/16-byte tags by default)
    if (authTagBuffer.length !== 16) {
      throw new Error('Invalid authentication tag length');
    }
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('midaz-cache'));
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.warn('Failed to decrypt cache data, clearing cache', { error: error.message });
    throw error;
  }
}

/**
 * Get authentication token using client credentials flow
 */
async function getAuthToken() {
  const cacheKey = 'auth_token';
  const cached = responseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    try {
      const decryptedToken = decryptCacheData(cached.data);
      return { success: true, token: decryptedToken };
    } catch (error) {
      responseCache.delete(cacheKey); // Clear corrupted cache
    }
  }

  try {
    const authConfig = config.auth || {};

    if (!authConfig.clientId || !authConfig.clientSecret) {
      // Check if API key is available
      if (config.apiKey) {
        return { success: true, token: config.apiKey };
      }

      return {
        success: false,
        error: "No authentication configured. Set MIDAZ_CLIENT_ID/MIDAZ_CLIENT_SECRET or MIDAZ_API_KEY"
      };
    }

    const tokenResponse = await fetch(`${config.backend.auth.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret
      })
    });

    if (!tokenResponse.ok) {
      logger.error('Token request failed', { status: tokenResponse.status });
      throw new Error(`Authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Cache encrypted token
    const encryptedToken = encryptCacheData(token);
    responseCache.set(cacheKey, {
      data: encryptedToken,
      timestamp: Date.now()
    });

    return { success: true, token };

  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Execute API call with exponential backoff
 */
async function executeApiCall(operation, resource, params, token) {
  const endpoint = buildEndpoint(operation, resource, params);
  const method = mapOperationToMethod(operation);
  const body = ['create', 'update'].includes(operation) ? params.data : null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : null
      });

      const responseData = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (response.ok) {
        return {
          success: true,
          data: responseData,
          statusCode: response.status
        };
      }

      // Handle client errors (4xx) - don't retry
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: `Client error: ${response.status}`,
          details: responseData,
          statusCode: response.status
        };
      }

      // Server errors (5xx) - retry with backoff
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        logger.warn(`API call failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          endpoint,
          status: response.status
        });
        await sleep(delay);
        continue;
      }

      return {
        success: false,
        error: `Server error after ${RETRY_CONFIG.maxRetries} retries: ${response.status}`,
        details: responseData,
        statusCode: response.status
      };

    } catch (error) {
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        logger.warn(`Network error, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          error: error.message
        });
        await sleep(delay);
        continue;
      }

      return {
        success: false,
        error: `Network error after ${RETRY_CONFIG.maxRetries} retries: ${error.message}`,
        statusCode: 0
      };
    }
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Validate and sanitize operation parameters
 */
function validateOperationParams(operation, resource, params) {
  const errors = [];

  // Sanitize and validate IDs to prevent injection
  if (params.organizationId) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(params.organizationId)) {
      errors.push('Invalid organizationId format');
    }
  }

  if (params.ledgerId) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(params.ledgerId)) {
      errors.push('Invalid ledgerId format');
    }
  }

  if (params.accountId) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(params.accountId)) {
      errors.push('Invalid accountId format');
    }
  }

  if (params.id) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(params.id)) {
      errors.push('Invalid id format');
    }
  }

  // Check required IDs based on resource hierarchy
  if (['ledgers', 'accounts', 'transactions', 'balances'].includes(resource)) {
    if (!params.organizationId) {
      errors.push('organizationId is required for this resource');
    }
  }

  if (['accounts', 'transactions', 'balances'].includes(resource)) {
    if (!params.ledgerId) {
      errors.push('ledgerId is required for this resource');
    }
  }

  if (['balances'].includes(resource)) {
    if (!params.accountId) {
      errors.push('accountId is required for balance operations');
    }
  }

  if (['get', 'update', 'delete'].includes(operation) && !params.id) {
    errors.push('id is required for get/update/delete operations');
  }

  if (['create', 'update'].includes(operation) && !params.data) {
    errors.push('data payload is required for create/update operations');
  }

  return {
    valid: errors.length === 0,
    error: errors.join('; '),
    details: {
      checkedRequirements: [
        'Resource hierarchy IDs',
        'Operation-specific parameters',
        'Data payload validation'
      ],
      passedValidation: errors.length === 0
    }
  };
}

/**
 * Build API endpoint URL
 */
function buildEndpoint(operation, resource, params) {
  const backend = getBackendForResource(resource);
  let path = '/v1';

  // Build hierarchical path
  if (params.organizationId) {
    path += `/organizations/${params.organizationId}`;
  }
  if (params.ledgerId) {
    path += `/ledgers/${params.ledgerId}`;
  }
  if (params.accountId) {
    path += `/accounts/${params.accountId}`;
  }

  // Add resource
  path += `/${resource}`;

  // Add specific ID for get/update/delete
  if (params.id && ['get', 'update', 'delete'].includes(operation)) {
    path += `/${params.id}`;
  }

  // Add query parameters for list operations
  if (operation === 'list' && (params.filters || params.pagination)) {
    const queryParams = new URLSearchParams();

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        // Sanitize query parameters to prevent injection\n        const sanitizedKey = encodeURIComponent(String(key));\n        const sanitizedValue = encodeURIComponent(String(value));\n        queryParams.append(sanitizedKey, sanitizedValue);
      });
    }

    if (params.pagination) {
      if (params.pagination.limit) {
        queryParams.append('limit', params.pagination.limit);
      }
      if (params.pagination.cursor) {
        queryParams.append('cursor', params.pagination.cursor);
      }
    }

    if (queryParams.toString()) {
      path += `?${queryParams.toString()}`;
    }
  }

  return `${backend}${path}`;
}

/**
 * Get backend URL for resource type
 */
function getBackendForResource(resource) {
  const transactionResources = ['transactions', 'balances', 'operations'];
  return transactionResources.includes(resource)
    ? config.backend.transaction.baseUrl
    : config.backend.onboarding.baseUrl;
}

/**
 * Map operation to HTTP method
 */
function mapOperationToMethod(operation) {
  const mapping = {
    'list': 'GET',
    'get': 'GET',
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE'
  };
  return mapping[operation];
}

/**
 * Generate expected response for test mode
 */
function generateExpectedResponse(operation, resource, params) {
  const baseResponse = {
    operation,
    resource,
    endpoint: buildEndpoint(operation, resource, params),
    method: mapOperationToMethod(operation)
  };

  switch (operation) {
    case 'list':
      return {
        ...baseResponse,
        expectedStructure: {
          data: `Array of ${resource}`,
          pagination: 'Pagination metadata',
          total: 'Total count'
        }
      };
    case 'get':
      return {
        ...baseResponse,
        expectedStructure: `Single ${resource.slice(0, -1)} object`
      };
    case 'create':
      return {
        ...baseResponse,
        expectedStructure: `Created ${resource.slice(0, -1)} with generated ID`,
        payload: params.data
      };
    case 'update':
      return {
        ...baseResponse,
        expectedStructure: `Updated ${resource.slice(0, -1)} object`,
        payload: params.data
      };
    case 'delete':
      return {
        ...baseResponse,
        expectedStructure: 'Deletion confirmation'
      };
    default:
      return baseResponse;
  }
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt) {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );

  const jitter = Math.random() * RETRY_CONFIG.jitterMs;
  return exponentialDelay + jitter;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate troubleshooting tips based on error
 */
function generateTroubleshootingTips(error) {
  const tips = [];
  const errorMsg = error.message.toLowerCase();

  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    tips.push('Check network connectivity and API endpoints');
    tips.push('Verify backend services are running');
  }

  if (errorMsg.includes('auth') || errorMsg.includes('401')) {
    tips.push('Check authentication credentials');
    tips.push('Verify API key or client credentials are set');
  }

  if (errorMsg.includes('404')) {
    tips.push('Verify resource IDs exist');
    tips.push('Check if organization/ledger/account hierarchy is correct');
  }

  if (errorMsg.includes('400')) {
    tips.push('Validate request payload structure');
    tips.push('Check required fields and data types');
  }

  return tips.length > 0 ? tips : [
    'Check API documentation with midaz_docs',
    'Verify service status with midaz_status',
    'Try test mode first to validate parameters'
  ];
}

// Export already handled above
