import { z } from "zod";
import api from "../util/api.js";
import config from "../config.js";
import { 
    createToolResponse, 
    createPaginatedResponse, 
    wrapToolHandler, 
    validateArgs,
    logToolInvocation 
} from "../util/mcp-helpers.js";

// Sample data for when real API is not available
const sampleAssets = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        type: "currency",
        scale: 2,
        isActive: true,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        code: "EUR",
        name: "Euro",
        symbol: "€",
        type: "currency",
        scale: 2,
        isActive: true,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000003",
        code: "BTC",
        name: "Bitcoin",
        symbol: "₿",
        type: "cryptocurrency",
        scale: 8,
        isActive: true,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    }
];

/**
 * Register asset-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerAssetTools = (server) => {
    // List assets tool
    server.tool(
        "list-assets",
        "List assets in a ledger with optional pagination",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            metadata: z.string().optional().describe("JSON string to filter assets by metadata fields"),
            type: z.string().optional().describe("Filter by asset type"),
            code: z.string().optional().describe("Filter by asset code"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-assets", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10),
                sort_order: z.enum(["asc", "desc"]).optional(),
                metadata: z.string().optional(),
                type: z.string().optional(),
                code: z.string().optional()
            }));

            // Filter sample data based on the query parameters
            let assets = [...sampleAssets];

            if (validatedArgs.type) {
                assets = assets.filter(asset => asset.type === validatedArgs.type);
            }

            if (validatedArgs.code) {
                assets = assets.filter(asset => asset.code.includes(validatedArgs.code));
            }

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.assets.list(validatedArgs.organization_id, validatedArgs.ledger_id, {
                        limit: validatedArgs.limit,
                        sort_order: validatedArgs.sort_order,
                        metadata: validatedArgs.metadata,
                        type: validatedArgs.type,
                        code: validatedArgs.code
                    });
                    if (response && response.items) {
                        assets = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching assets for ledger ${validatedArgs.ledger_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(assets, validatedArgs);
        })
    );

    // Get asset by ID tool
    server.tool(
        "get-asset",
        "Get asset details by ID",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            id: z.string().uuid().describe("Asset ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-asset", args, extra);
            const { organization_id, ledger_id, id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                id: z.string().uuid()
            }));

            // Find asset in sample data
            const asset = sampleAssets.find(a => a.id === id) || {
                ...sampleAssets[0],
                id
            };

            let assetData = {
                ...asset,
                organization_id,
                ledger_id
            };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.assets.get(organization_id, ledger_id, id);
                    if (response) {
                        assetData = {
                            ...response,
                            organization_id,
                            ledger_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching asset ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return assetData;
        })
    );
}; 