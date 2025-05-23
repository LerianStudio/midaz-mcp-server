/**
 * Documentation administration tools
 * Provides tools for managing the documentation system
 */

import { z } from "zod";
import { 
  refreshManifest, 
  getAvailableResources, 
  searchResources,
  getResourcesByCategory 
} from "../util/docs-manifest.js";
import { 
  clearDocumentationCache, 
  getDocsCacheStats,
  prefetchDocumentation 
} from "../util/docs-fetcher.js";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";

/**
 * Register documentation administration tools
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerDocsAdminTools = (server) => {
  // Refresh documentation manifest
  server.tool(
    "refresh-docs-manifest",
    "Refresh the documentation manifest to discover new documentation",
    {},
    wrapToolHandler(async (args, extra) => {
      refreshManifest();
      
      // Wait a moment for refresh to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated resources
      const resources = await getAvailableResources();
      
      return {
        success: true,
        message: "Documentation manifest refreshed",
        resourceCount: resources.length,
        timestamp: new Date().toISOString()
      };
    })
  );

  // List all available documentation
  server.tool(
    "list-all-documentation",
    "Get a list of all available documentation resources",
    {
      category: z.string().optional().describe("Filter by category (e.g., 'models', 'components', 'infra', 'docs')")
    },
    wrapToolHandler(async (args, extra) => {
      const { category } = validateArgs(args, z.object({
        category: z.string().optional()
      }));

      let resources;
      if (category) {
        resources = await getResourcesByCategory(category);
      } else {
        resources = await getAvailableResources();
      }

      // Group by category for better organization
      const grouped = resources.reduce((acc, resource) => {
        if (!acc[resource.category]) {
          acc[resource.category] = [];
        }
        acc[resource.category].push({
          path: resource.path,
          title: resource.title,
          url: resource.url
        });
        return acc;
      }, {});

      return {
        totalResources: resources.length,
        categories: Object.keys(grouped),
        resources: grouped,
        lastUpdated: new Date().toISOString()
      };
    })
  );

  // Search documentation
  server.tool(
    "search-documentation",
    "Search for documentation by keyword",
    {
      keyword: z.string().min(2).describe("Search keyword (minimum 2 characters)")
    },
    wrapToolHandler(async (args, extra) => {
      const { keyword } = validateArgs(args, z.object({
        keyword: z.string().min(2)
      }));

      const results = await searchResources(keyword);

      return {
        keyword,
        resultCount: results.length,
        results: results.map(r => ({
          path: r.path,
          title: r.title,
          category: r.category,
          url: r.url,
          description: r.description
        }))
      };
    })
  );

  // Clear documentation cache
  server.tool(
    "clear-docs-cache",
    "Clear the documentation cache to force fresh fetches",
    {},
    wrapToolHandler(async (args, extra) => {
      const statsBefore = getDocsCacheStats();
      clearDocumentationCache();
      const statsAfter = getDocsCacheStats();

      return {
        success: true,
        message: "Documentation cache cleared",
        before: statsBefore,
        after: statsAfter,
        timestamp: new Date().toISOString()
      };
    })
  );

  // Get cache statistics
  server.tool(
    "get-docs-cache-stats",
    "Get statistics about the documentation cache",
    {},
    wrapToolHandler(async (args, extra) => {
      const stats = getDocsCacheStats();

      return {
        ...stats,
        cacheEnabled: true,
        cacheTTL: "15 minutes",
        timestamp: new Date().toISOString()
      };
    })
  );

  // Prefetch documentation
  server.tool(
    "prefetch-documentation",
    "Prefetch multiple documentation resources to populate the cache",
    {
      paths: z.array(z.string()).describe("Array of resource paths to prefetch"),
      category: z.string().optional().describe("Prefetch all resources in a category")
    },
    wrapToolHandler(async (args, extra) => {
      const validated = validateArgs(args, z.object({
        paths: z.array(z.string()).optional(),
        category: z.string().optional()
      }));

      let pathsToFetch = validated.paths || [];

      // If category is specified, add all resources from that category
      if (validated.category) {
        const categoryResources = await getResourcesByCategory(validated.category);
        pathsToFetch = [...pathsToFetch, ...categoryResources.map(r => r.path)];
      }

      // Remove duplicates
      pathsToFetch = [...new Set(pathsToFetch)];

      if (pathsToFetch.length === 0) {
        return {
          success: false,
          message: "No paths specified for prefetching"
        };
      }

      const results = await prefetchDocumentation(pathsToFetch);

      return {
        ...results,
        pathsRequested: pathsToFetch.length,
        timestamp: new Date().toISOString()
      };
    })
  );
};