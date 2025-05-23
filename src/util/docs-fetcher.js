/**
 * Online Documentation Fetcher
 * 
 * This module fetches documentation from docs.lerian.studio
 * instead of reading local markdown files.
 */

import { enhancedFetch } from './http-client.js';
import { createLogger } from './mcp-logging.js';
import config from '../config.js';
import { getResourceUrl, initializeManifest } from './docs-manifest.js';

const logger = createLogger('docs-fetcher');

// Default base URL for documentation
const DEFAULT_DOCS_BASE_URL = 'https://docs.lerian.studio';

// Cache for fetched documentation
const docsCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Documentation URL mappings based on actual docs.lerian.studio structure
const urlMappings = {
  // Models (Core Entities)
  'models/entity-relationships': '/docs/core-entities.md',
  'models/entity-hierarchy': '/docs/core-entities.md',
  'models/organization': '/docs/organizations.md',
  'models/ledger': '/docs/ledgers.md',
  'models/account': '/docs/accounts.md',
  'models/portfolio': '/docs/portfolios.md',
  'models/segment': '/docs/segments.md',
  'models/asset': '/docs/assets.md',
  'models/transaction': '/docs/transactions.md',
  'models/operation': '/docs/operations.md',
  'models/balance': '/reference/list-balances.md',
  
  // Components (Midaz Console and Services)
  'components/onboarding/overview': '/docs/midaz-console-onboarding.md',
  'components/onboarding/architecture': '/docs/architecture.md',
  'components/onboarding/api': '/reference/introduction.md',
  'components/onboarding/setup': '/docs/midaz-console-setup.md',
  'components/transaction/overview': '/docs/managing-transactions.md',
  'components/transaction/api': '/reference/create-a-transaction-using-json.md',
  'components/transaction/setup': '/docs/creating-the-first-transaction.md',
  'components/mdz/overview': '/docs/about-midaz-cli.md',
  'components/mdz/setup': '/docs/midaz-setup.md',
  
  // Infrastructure
  'infra/overview': '/docs/architecture.md',
  'infra/postgres': '/docs/data-model.md',
  'infra/mongodb': '/docs/data-model.md',
  'infra/redis': '/docs/architecture.md',
  'infra/rabbitmq': '/docs/architecture.md',
  'infra/grafana': '/docs/observability-in-midaz.md',
  
  // Documentation
  'docs/overview': '/docs/what-is-midaz.md',
  'docs/getting-started': '/docs/getting-started.md',
  'docs/architecture': '/docs/architecture.md',
  'docs/domain-driven-design': '/docs/core-features.md',
  'docs/cqrs': '/docs/transactions-dsl.md',
  'docs/security': '/docs/security.md',
  'docs/troubleshooting': '/docs/faq.md'
};

/**
 * Get the base URL for documentation
 * @returns {string} Base URL
 */
function getDocsBaseUrl() {
  return config.docsUrl || process.env.MIDAZ_DOCS_URL || DEFAULT_DOCS_BASE_URL;
}

/**
 * Map internal resource path to documentation URL
 * @param {string} resourcePath - Internal resource path (e.g., 'models/account')
 * @returns {Promise<string>} Full documentation URL
 */
async function mapResourceToUrl(resourcePath) {
  // First try to get URL from dynamic manifest
  const manifestUrl = await getResourceUrl(resourcePath);
  if (manifestUrl) {
    return manifestUrl;
  }
  
  // Fall back to static mappings
  const mapping = urlMappings[resourcePath];
  if (!mapping) {
    // If no mapping exists, try to construct a reasonable URL
    const parts = resourcePath.split('/');
    return `/${parts.join('/')}`;
  }
  return mapping;
}

/**
 * Fetch documentation content from online source
 * @param {string} resourcePath - Resource path (e.g., 'models/account')
 * @returns {Promise<string>} Documentation content
 */
export async function fetchDocumentation(resourcePath) {
  const cacheKey = resourcePath;
  const now = Date.now();
  
  // Check cache first
  const cached = docsCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    logger.debug('Returning cached documentation', { resource: resourcePath });
    return cached.content;
  }
  
  const baseUrl = getDocsBaseUrl();
  const docPath = await mapResourceToUrl(resourcePath);
  const fullUrl = `${baseUrl}${docPath}`;
  
  logger.info('Fetching documentation', { resource: resourcePath, url: fullUrl });
  
  try {
    // Fetch the documentation page
    const response = await enhancedFetch(fullUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,text/markdown,text/plain',
        'User-Agent': 'Midaz-MCP-Server/1.0'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let content = await response.text();
    
    // Process the content based on content type
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
      // Extract markdown content from HTML
      content = extractMarkdownFromHtml(content);
    } else if (contentType.includes('application/json')) {
      // Handle JSON response (might be an API response)
      const data = JSON.parse(content);
      content = data.content || data.markdown || JSON.stringify(data, null, 2);
    }
    
    // Cache the result
    docsCache.set(cacheKey, {
      content,
      timestamp: now
    });
    
    logger.debug('Successfully fetched documentation', { resource: resourcePath, size: content.length });
    return content;
    
  } catch (error) {
    logger.error('Failed to fetch documentation', { 
      resource: resourcePath, 
      url: fullUrl,
      error: error.message 
    });
    
    // Return a fallback error message
    return await generateErrorMarkdown(resourcePath, error);
  }
}

/**
 * Extract markdown content from HTML
 * @param {string} html - HTML content
 * @returns {string} Extracted markdown content
 */
function extractMarkdownFromHtml(html) {
  // Try to find markdown content in the HTML
  // This is a simple extraction - might need to be adjusted based on actual HTML structure
  
  // Look for content in markdown code blocks
  const markdownMatch = html.match(/<pre[^>]*>.*?```markdown([\s\S]*?)```.*?<\/pre>/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  // Look for content in article or main tags
  const articleMatch = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/(article|main)>/);
  if (articleMatch) {
    // Simple HTML to markdown conversion
    let content = articleMatch[2];
    
    // Remove script and style tags
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Convert headers
    content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
    
    // Convert paragraphs
    content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Convert lists
    content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    
    // Convert code blocks
    content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n');
    content = content.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Convert links
    content = content.replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Remove remaining HTML tags
    content = content.replace(/<[^>]+>/g, '');
    
    // Clean up extra whitespace
    content = content.replace(/\n{3,}/g, '\n\n');
    
    return content.trim();
  }
  
  // Fallback: return a message indicating we couldn't extract content
  return '# Documentation\n\nThis documentation is available at ' + getDocsBaseUrl();
}

/**
 * Generate error markdown for failed fetches
 * @param {string} resourcePath - Resource path
 * @param {Error} error - The error that occurred
 * @returns {string} Error markdown
 */
async function generateErrorMarkdown(resourcePath, error) {
  const baseUrl = getDocsBaseUrl();
  const docPath = await mapResourceToUrl(resourcePath);
  const fullUrl = `${baseUrl}${docPath}`;
  
  return `# Documentation Temporarily Unavailable

The documentation for **${resourcePath}** could not be fetched at this time.

## Error Details
- **Error**: ${error.message}
- **Resource**: ${resourcePath}
- **URL**: ${fullUrl}

## Fallback Information

This documentation is typically available at [${fullUrl}](${fullUrl}).

### About This Resource

${getFallbackDescription(resourcePath)}

## Troubleshooting

1. Check your internet connection
2. Verify the documentation site is accessible: ${baseUrl}
3. Try again in a few moments

If the problem persists, you can:
- Visit the documentation directly at ${fullUrl}
- Check the [Midaz documentation](${baseUrl}) for more information
`;
}

/**
 * Get fallback description for a resource
 * @param {string} resourcePath - Resource path
 * @returns {string} Fallback description
 */
function getFallbackDescription(resourcePath) {
  const descriptions = {
    // Models
    'models/organization': 'Organizations are the top-level entities in Midaz, representing companies or business units.',
    'models/ledger': 'Ledgers are collections of accounts that track financial transactions.',
    'models/account': 'Accounts represent individual financial accounts within a ledger.',
    'models/transaction': 'Transactions represent financial movements between accounts.',
    'models/operation': 'Operations are the individual debit/credit entries within a transaction.',
    'models/balance': 'Balances track the current state of an account for each asset.',
    'models/asset': 'Assets represent different types of value (currencies, commodities, etc.).',
    'models/portfolio': 'Portfolios group related accounts for organizational purposes.',
    'models/segment': 'Segments categorize accounts for reporting and analysis.',
    
    // Components
    'components/onboarding/overview': 'The Onboarding service manages organizations, ledgers, and accounts.',
    'components/transaction/overview': 'The Transaction service handles financial transactions and balances.',
    'components/mdz/overview': 'MDZ is the command-line interface for interacting with Midaz.',
    
    // Infrastructure
    'infra/postgres': 'PostgreSQL is used as the primary database for Midaz.',
    'infra/mongodb': 'MongoDB stores document-based data and audit logs.',
    'infra/redis': 'Redis provides caching and session management.',
    'infra/rabbitmq': 'RabbitMQ handles asynchronous messaging between services.',
    'infra/grafana': 'Grafana provides monitoring and visualization dashboards.',
    
    // Documentation
    'docs/overview': 'Overview of the Midaz financial ledger system.',
    'docs/getting-started': 'Quick start guide for using Midaz.',
    'docs/architecture': 'System architecture and design principles.',
    'docs/security': 'Security features and best practices.'
  };
  
  return descriptions[resourcePath] || 'This resource provides important information about the Midaz system.';
}

/**
 * Prefetch multiple documentation resources
 * @param {string[]} resourcePaths - Array of resource paths
 * @returns {Promise<Object>} Results of prefetch operation
 */
export async function prefetchDocumentation(resourcePaths) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  logger.info('Prefetching documentation', { count: resourcePaths.length });
  
  // Fetch in parallel with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < resourcePaths.length; i += concurrency) {
    const batch = resourcePaths.slice(i, i + concurrency);
    const promises = batch.map(async (path) => {
      try {
        await fetchDocumentation(path);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ path, error: error.message });
      }
    });
    
    await Promise.all(promises);
  }
  
  logger.info('Prefetch complete', results);
  return results;
}

/**
 * Clear documentation cache
 */
export function clearDocumentationCache() {
  const size = docsCache.size;
  docsCache.clear();
  logger.info('Documentation cache cleared', { entries: size });
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getDocsCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;
  
  for (const [key, value] of docsCache.entries()) {
    if ((now - value.timestamp) < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
    totalSize += value.content.length;
  }
  
  return {
    totalEntries: docsCache.size,
    validEntries,
    expiredEntries,
    totalSizeBytes: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
  };
}