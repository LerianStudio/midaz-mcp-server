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
const samplePortfolios = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Investment Portfolio",
        description: "Long-term investment portfolio",
        status: {
            code: "ACTIVE",
            description: "Portfolio is active"
        },
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Trading Portfolio",
        description: "Short-term trading portfolio",
        status: {
            code: "ACTIVE",
            description: "Portfolio is active"
        },
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    }
];

/**
 * Register portfolio-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerPortfolioTools = (server) => {
    // List portfolios tool
    server.tool(
        "list-portfolios",
        "List portfolios in a ledger with optional pagination",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            metadata: z.string().optional().describe("JSON string to filter portfolios by metadata fields"),
            status: z.string().optional().describe("Filter by portfolio status"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-portfolios", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10),
                sort_order: z.enum(["asc", "desc"]).optional(),
                metadata: z.string().optional(),
                status: z.string().optional()
            }));

            // Filter sample data based on the query parameters
            let portfolios = [...samplePortfolios];

            if (validatedArgs.status) {
                portfolios = portfolios.filter(
                    portfolio => portfolio.status && portfolio.status.code === validatedArgs.status
                );
            }

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.portfolios.list(validatedArgs.organization_id, validatedArgs.ledger_id, {
                        limit: validatedArgs.limit,
                        sort_order: validatedArgs.sort_order,
                        metadata: validatedArgs.metadata,
                        status: validatedArgs.status
                    });
                    if (response && response.items) {
                        portfolios = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching portfolios for ledger ${validatedArgs.ledger_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(portfolios, validatedArgs);
        })
    );

    // Get portfolio by ID tool
    server.tool(
        "get-portfolio",
        "Get portfolio details by ID",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            id: z.string().uuid().describe("Portfolio ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-portfolio", args, extra);
            const { organization_id, ledger_id, id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                id: z.string().uuid()
            }));

            // Find portfolio in sample data
            const portfolio = samplePortfolios.find(p => p.id === id) || {
                ...samplePortfolios[0],
                id
            };

            let portfolioData = {
                ...portfolio,
                organization_id,
                ledger_id
            };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.portfolios.get(organization_id, ledger_id, id);
                    if (response) {
                        portfolioData = {
                            ...response,
                            organization_id,
                            ledger_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching portfolio ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return portfolioData;
        })
    );
}; 