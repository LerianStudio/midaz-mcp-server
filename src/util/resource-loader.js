/**
 * Resource Loader with Online Fetching
 * 
 * This module provides loading capabilities for markdown resources
 * from online documentation.
 */

import { fetchDocumentation } from './docs-fetcher.js';
import { createLogger } from './mcp-logging.js';

const logger = createLogger('resource-loader');

/**
 * Load a markdown resource
 * @param {string} resourcePath - Resource path
 * @returns {Promise<string>} Resource content
 */
export async function loadMarkdownFile(resourcePath) {
  // Convert file path to resource path if needed
  const normalizedPath = normalizeResourcePath(resourcePath);
  
  try {
    // Fetch from online documentation
    return await fetchDocumentation(normalizedPath);
  } catch (error) {
    logger.error('Failed to load resource', { path: normalizedPath, error: error.message });
    throw error;
  }
}

/**
 * Convert file path to resource path
 * @param {string} filePath - File path
 * @returns {string} Resource path
 */
function normalizeResourcePath(filePath) {
  // If already a resource path, return as-is
  if (!filePath.includes('/') || !filePath.endsWith('.md')) {
    return filePath;
  }
  
  // Extract resource type and name from file path
  const parts = filePath.split('/');
  
  // Look for known resource directories
  const markdownIndex = parts.indexOf('markdown');
  if (markdownIndex !== -1 && parts.length > markdownIndex + 2) {
    // Format: .../markdown/category/subcategory/file.md
    const category = parts[markdownIndex + 1];
    const remaining = parts.slice(markdownIndex + 2);
    const fileName = remaining[remaining.length - 1].replace('.md', '');
    
    if (remaining.length > 1) {
      // Has subcategory
      const subcategory = remaining.slice(0, -1).join('/');
      return `${category}/${subcategory}/${fileName}`;
    } else {
      return `${category}/${fileName}`;
    }
  }
  
  // Fallback: try to extract meaningful path
  const fileName = parts[parts.length - 1].replace('.md', '');
  const category = parts[parts.length - 2] || 'docs';
  return `${category}/${fileName}`;
}

/**
 * Clear the resource cache
 */
export function clearResourceCache() {
  // Delegate to docs-fetcher
  const { clearDocumentationCache } = require('./docs-fetcher.js');
  clearDocumentationCache();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  // Delegate to docs-fetcher
  const { getDocsCacheStats } = require('./docs-fetcher.js');
  return getDocsCacheStats();
}

/**
 * Preload specific resources
 * @param {string[]} paths - Array of resource paths to preload
 */
export function preloadResources(paths) {
  // Delegate to docs-fetcher
  const { prefetchDocumentation } = require('./docs-fetcher.js');
  return prefetchDocumentation(paths);
}

/**
 * Clean up expired cache entries
 */
export function cleanupCache() {
  // This is now handled internally by docs-fetcher
  logger.info('Cache cleanup delegated to docs-fetcher');
}