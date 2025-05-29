/**
 * User-facing documentation tools
 * Provides tools for searching and reading documentation
 */

import { z } from "zod";
import { 
  getAvailableResources, 
  searchResources,
  getResourcesByCategory 
} from "../util/docs-manifest.js";
import { fetchDocumentation } from "../util/docs-fetcher.js";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";

/**
 * Register user-facing documentation tools
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerDocsUserTools = (server) => {
  // Note: search-documentation tool is provided by docs-comprehensive.js to avoid duplicates

  // Read documentation content
  server.tool(
    "read-documentation",
    "Read the full content of a specific documentation page. Use this after finding a page with search-documentation to get the complete content including API payloads, examples, etc.",
    {
      path: z.string().describe("The documentation path from search results (e.g., '/reference/create-an-asset.md' or 'models/asset')")
    },
    wrapToolHandler(async (args, extra) => {
      const { path } = validateArgs(args, z.object({
        path: z.string()
      }));

      try {
        // Fetch the documentation content
        const content = await fetchDocumentation(path);
        
        // Get metadata about the resource
        const resources = await getAvailableResources();
        const resource = resources.find(r => r.path === path || r.url === path);
        
        return {
          path,
          content,
          metadata: resource || null,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          path,
          content: null,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  // Browse documentation by category
  server.tool(
    "browse-documentation",
    "Browse available documentation by category. Use this to explore what documentation is available for models, APIs, components, etc.",
    {
      category: z.string().optional().describe("Filter by category: 'models', 'api', 'components', 'infra', 'docs'. Leave empty to see all categories.")
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
          url: resource.url,
          description: resource.description
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
};