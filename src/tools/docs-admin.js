/**
 * Documentation administration tools
 * Provides tools for managing the documentation system
 */

import { z } from "zod";
import { 
  refreshManifest, 
  getAvailableResources, 
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
    "[ADMIN] Refresh the documentation manifest to discover new documentation",
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


  // Clear documentation cache
  server.tool(
    "clear-docs-cache",
    "[ADMIN] Clear the documentation cache to force fresh fetches",
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
    "[ADMIN] Get statistics about the documentation cache",
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
    "[ADMIN] Prefetch multiple documentation resources to populate the cache",
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