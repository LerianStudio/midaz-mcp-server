/**
 * Documentation Manifest Management
 * Dynamically discovers available documentation from llms.txt
 */

import fetch from 'node-fetch';
import config from '../config.js';
import { createLogger } from './mcp-logging.js';
import { fuzzySearch, scoreText } from './fuzzy-search.js';

const logger = createLogger('docs-manifest');

const LLMS_TXT_URL = `${config.docsUrl || 'https://docs.lerian.studio'}/llms.txt`;
const MANIFEST_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const FALLBACK_TO_STATIC = true;

let manifestCache = null;
let manifestCacheTime = 0;

/**
 * Static fallback mappings (current hardcoded mappings)
 */
const staticMappings = {
  // Models (Core Entities)
  'models/organization': '/docs/organizations.md',
  'models/ledger': '/docs/ledgers.md',
  'models/account': '/docs/accounts.md',
  'models/transaction': '/docs/transactions.md',
  'models/operation': '/docs/operations.md',
  'models/balance': '/docs/balances.md',
  'models/portfolio': '/docs/portfolios.md',
  'models/segment': '/docs/segments.md',
  'models/asset': '/docs/assets.md',
  'models/entity-hierarchy': '/concepts/entity-hierarchy.md',
  'models/entity-relationships': '/concepts/entity-hierarchy.md',
  
  // Components
  'components/onboarding': '/docs/onboarding/overview.md',
  'components/onboarding/setup': '/docs/onboarding/setup.md',
  'components/onboarding/api': '/docs/onboarding/api.md',
  'components/onboarding/architecture': '/docs/onboarding/architecture.md',
  'components/transaction': '/docs/transaction/overview.md',
  'components/transaction/setup': '/docs/transaction/setup.md',
  'components/transaction/api': '/docs/transaction/api.md',
  'components/mdz': '/docs/mdz/overview.md',
  'components/mdz/setup': '/docs/mdz/setup.md',
  
  // Infrastructure
  'infra/overview': '/docs/infrastructure/overview.md',
  'infra/postgres': '/docs/infrastructure/postgres.md',
  'infra/mongodb': '/docs/infrastructure/mongodb.md',
  'infra/redis': '/docs/infrastructure/redis.md',
  'infra/rabbitmq': '/docs/infrastructure/rabbitmq.md',
  'infra/grafana': '/docs/infrastructure/grafana.md',
  
  // Documentation
  'docs/overview': '/docs/overview.md',
  'docs/architecture': '/docs/architecture.md',
  'docs/getting-started': '/docs/getting-started.md',
  'docs/security': '/docs/security.md',
  'docs/troubleshooting': '/docs/troubleshooting.md',
  'docs/domain-driven-design': '/concepts/domain-driven-design.md',
  'docs/cqrs': '/concepts/cqrs.md'
};

/**
 * Parse llms.txt content into a manifest structure
 */
function parseLLMSContent(content) {
  const lines = content.split('\n');
  const resources = [];
  const baseUrl = config.docsUrl || 'https://docs.lerian.studio';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Look for markdown links format: [Title](URL)
    const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
    
    if (linkMatch) {
      const docTitle = linkMatch[1];
      const docUrl = linkMatch[2];
      
      try {
        const urlObj = new URL(docUrl);
        const pathname = urlObj.pathname;
        
        // Extract resource info from URL
        const pathParts = pathname.split('/').filter(p => p);
        
        // Determine category based on path
        let category = 'docs';
        let resourcePath = pathname;
        
        if (pathname.includes('/docs/')) {
          if (pathname.includes('organizations') || pathname.includes('ledgers') || 
              pathname.includes('accounts') || pathname.includes('assets') ||
              pathname.includes('transactions') || pathname.includes('operations') ||
              pathname.includes('balances') || pathname.includes('portfolios') ||
              pathname.includes('segments')) {
            category = 'models';
          } else if (pathname.includes('onboarding') || pathname.includes('transaction') || 
                     pathname.includes('mdz') || pathname.includes('midaz-console')) {
            category = 'components';
          } else if (pathname.includes('infrastructure') || pathname.includes('postgres') ||
                     pathname.includes('mongodb') || pathname.includes('redis') ||
                     pathname.includes('rabbitmq') || pathname.includes('grafana')) {
            category = 'infra';
          }
        } else if (pathname.includes('/reference/')) {
          category = 'api';
        } else if (pathname.includes('/concepts/')) {
          category = 'concepts';
        }
        
        // Create a friendly name from the last part of the path
        const name = pathParts[pathParts.length - 1]?.replace('.md', '').replace(/-/g, ' ');
        
        // Generate a resource path for internal use
        if (category === 'models' && pathname.includes('organizations')) {
          resourcePath = 'models/organization';
        } else if (category === 'models' && pathname.includes('ledgers')) {
          resourcePath = 'models/ledger';
        } else if (category === 'models' && pathname.includes('accounts')) {
          resourcePath = 'models/account';
        } else if (category === 'models' && pathname.includes('transactions')) {
          resourcePath = 'models/transaction';
        } else if (category === 'models' && pathname.includes('operations')) {
          resourcePath = 'models/operation';
        } else if (category === 'models' && pathname.includes('balances')) {
          resourcePath = 'models/balance';
        } else if (category === 'models' && pathname.includes('assets')) {
          resourcePath = 'models/asset';
        } else if (category === 'models' && pathname.includes('portfolios')) {
          resourcePath = 'models/portfolio';
        } else if (category === 'models' && pathname.includes('segments')) {
          resourcePath = 'models/segment';
        }
        
        resources.push({
          path: resourcePath,
          url: pathname,
          category,
          name: name || 'Document',
          title: docTitle || (name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Document'),
          description: docTitle,
          source: docUrl
        });
      } catch (error) {
        logger.warn('Failed to parse URL from llms.txt', { line: trimmed, error: error.message });
      }
    } else if (trimmed.startsWith('http')) {
      // Handle plain URLs (backward compatibility)
      try {
        const url = new URL(trimmed);
        const pathname = url.pathname;
        
        // Extract resource info from URL
        const pathParts = pathname.split('/').filter(p => p);
        
        // Determine category based on path
        let category = 'docs';
        let resourcePath = pathname;
        
        if (pathname.includes('/docs/')) {
          if (pathname.includes('organizations') || pathname.includes('ledgers') || 
              pathname.includes('accounts') || pathname.includes('assets') ||
              pathname.includes('transactions') || pathname.includes('operations') ||
              pathname.includes('balances') || pathname.includes('portfolios') ||
              pathname.includes('segments')) {
            category = 'models';
          } else if (pathname.includes('onboarding') || pathname.includes('transaction') || 
                     pathname.includes('mdz') || pathname.includes('midaz-console')) {
            category = 'components';
          } else if (pathname.includes('infrastructure') || pathname.includes('postgres') ||
                     pathname.includes('mongodb') || pathname.includes('redis') ||
                     pathname.includes('rabbitmq') || pathname.includes('grafana')) {
            category = 'infra';
          }
        } else if (pathname.includes('/reference/')) {
          category = 'api';
        } else if (pathname.includes('/concepts/')) {
          category = 'concepts';
        }
        
        // Create a friendly name from the last part of the path
        const name = pathParts[pathParts.length - 1]?.replace('.md', '').replace(/-/g, ' ');
        
        // Generate a resource path for internal use based on content
        if (category === 'models') {
          if (pathname.includes('organizations')) resourcePath = 'models/organization';
          else if (pathname.includes('ledgers')) resourcePath = 'models/ledger';
          else if (pathname.includes('accounts')) resourcePath = 'models/account';
          else if (pathname.includes('transactions')) resourcePath = 'models/transaction';
          else if (pathname.includes('operations')) resourcePath = 'models/operation';
          else if (pathname.includes('balances')) resourcePath = 'models/balance';
          else if (pathname.includes('assets')) resourcePath = 'models/asset';
          else if (pathname.includes('portfolios')) resourcePath = 'models/portfolio';
          else if (pathname.includes('segments')) resourcePath = 'models/segment';
        }
        
        resources.push({
          path: resourcePath,
          url: pathname,
          category,
          name: name || 'Document',
          title: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Document',
          source: trimmed
        });
      } catch (error) {
        logger.warn('Failed to parse URL from llms.txt', { line: trimmed, error: error.message });
      }
    }
  }
  
  return {
    version: '1.0.0-llms',
    generated: new Date().toISOString(),
    source: 'llms.txt',
    resources
  };
}

/**
 * Fetch documentation manifest from llms.txt
 */
async function fetchManifest() {
  try {
    // Check cache first
    const now = Date.now();
    if (manifestCache && (now - manifestCacheTime) < MANIFEST_CACHE_TTL) {
      return manifestCache;
    }

    // Validate URL to prevent file content exposure
    if (!LLMS_TXT_URL || !LLMS_TXT_URL.startsWith('http')) {
      throw new Error(`Invalid documentation URL: ${LLMS_TXT_URL}`);
    }

    logger.info('Fetching documentation from llms.txt', { url: LLMS_TXT_URL });
    
    const response = await fetch(LLMS_TXT_URL, {
      timeout: 10000, // Increase timeout to 10 seconds
      headers: {
        'User-Agent': 'Lerian-MCP-Server/2.2.0',
        'Accept': 'text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch llms.txt: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    const manifest = parseLLMSContent(content);

    // Cache the manifest
    manifestCache = manifest;
    manifestCacheTime = now;

    logger.info('Documentation manifest created from llms.txt', {
      version: manifest.version,
      resourceCount: manifest.resources.length
    });

    return manifest;
  } catch (error) {
    logger.error('Failed to fetch llms.txt', { error: error.message });
    
    if (FALLBACK_TO_STATIC) {
      // Return a manifest constructed from static mappings
      return createStaticManifest();
    }
    
    throw error;
  }
}

/**
 * Create a manifest from static mappings
 */
function createStaticManifest() {
  const resources = [];
  
  for (const [path, url] of Object.entries(staticMappings)) {
    const parts = path.split('/');
    const category = parts[0];
    const name = parts.slice(1).join('/');
    
    resources.push({
      path,
      url,
      category,
      name,
      title: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    });
  }

  return {
    version: '1.0.0-static',
    generated: new Date().toISOString(),
    resources
  };
}

/**
 * Get URL mapping for a resource path
 */
export async function getResourceUrl(resourcePath) {
  try {
    const manifest = await fetchManifest();
    
    // Look for exact match in manifest
    const resource = manifest.resources.find(r => r.path === resourcePath);
    if (resource) {
      return resource.url;
    }
    
    // Try partial match (for nested paths)
    const partialMatch = manifest.resources.find(r => resourcePath.startsWith(r.path));
    if (partialMatch) {
      return partialMatch.url;
    }
  } catch (error) {
    logger.warn('Failed to get resource from manifest, using static mapping', {
      path: resourcePath,
      error: error.message
    });
  }

  // Fall back to static mappings
  return staticMappings[resourcePath] || null;
}

/**
 * Get all available resources
 */
export async function getAvailableResources() {
  try {
    const manifest = await fetchManifest();
    return manifest.resources;
  } catch (error) {
    // Return resources from static mappings
    return createStaticManifest().resources;
  }
}

/**
 * Get resources by category
 */
export async function getResourcesByCategory(category) {
  const resources = await getAvailableResources();
  return resources.filter(r => r.category === category);
}

/**
 * Score a resource based on fuzzy matching
 */
function scoreResource(resource, searchWords) {
  let score = 0;
  
  // Score each field with different weights
  score += scoreText(resource.title, searchWords, 5);
  score += scoreText(resource.description, searchWords, 4);
  score += scoreText(resource.name, searchWords, 3);
  score += scoreText(resource.path, searchWords, 2);
  score += scoreText(resource.url, searchWords, 1);
  score += scoreText(resource.source, searchWords, 1);
  
  return score;
}

/**
 * Search resources by keyword with fuzzy matching
 */
export async function searchResources(keyword) {
  const resources = await getAvailableResources();
  // Use a minimum score of 3 to filter out weak matches
  return fuzzySearch(resources, keyword, scoreResource, 3);
}

/**
 * Force refresh the manifest cache
 */
export function refreshManifest() {
  manifestCache = null;
  manifestCacheTime = 0;
  logger.info('Documentation manifest cache cleared');
}

/**
 * Initialize manifest fetching
 */
export async function initializeManifest() {
  try {
    // Pre-fetch manifest on startup
    await fetchManifest();
    
    // Set up periodic refresh
    setInterval(() => {
      fetchManifest().catch(error => {
        logger.error('Failed to refresh manifest', { error: error.message });
      });
    }, MANIFEST_CACHE_TTL);
    
    logger.info('Documentation manifest system initialized');
  } catch (error) {
    logger.warn('Failed to initialize manifest, using static mappings', {
      error: error.message
    });
  }
}