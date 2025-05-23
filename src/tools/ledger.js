import { z } from "zod";
import api from "../util/api.js";
import config from "../config.js";
import { 
    createPaginatedResponse, 
    wrapToolHandler, 
    validateArgs,
    logToolInvocation 
} from "../util/mcp-helpers.js";

// Sample data for when real API is not available
const sampleLedgers = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Main Ledger",
        status: {
            code: "ACTIVE",
            description: "Ledger is currently active"
        },
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Secondary Ledger",
        status: {
            code: "ACTIVE",
            description: "Ledger is currently active"
        },
        metadata: {},
        createdAt: "2023-02-15T00:00:00Z",
        updatedAt: "2023-02-15T00:00:00Z",
    },
];

const sampleLedgerDetails = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Main Ledger",
    status: {
        code: "ACTIVE",
        description: "Ledger is currently active",
    },
    metadata: {},
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
};

/**
 * Register ledger-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerLedgerTools = (server) => {
    // List ledgers tool
    server.tool(
        "list-ledgers",
        "List ledgers for an organization with optional pagination",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)"),
            start_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            end_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            metadata: z.string().optional().describe("JSON string to filter ledgers by metadata fields"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-ledgers", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10),
                start_date: z.string().optional(),
                end_date: z.string().optional(),
                sort_order: z.enum(["asc", "desc"]).optional(),
                metadata: z.string().optional()
            }));

            let ledgers = sampleLedgers;

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.ledgers.list(validatedArgs.organization_id, {
                        limit: validatedArgs.limit,
                        start_date: validatedArgs.start_date,
                        end_date: validatedArgs.end_date,
                        sort_order: validatedArgs.sort_order,
                        metadata: validatedArgs.metadata
                    });
                    if (response && response.items) {
                        ledgers = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching ledgers for organization ${validatedArgs.organization_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(ledgers, validatedArgs);
        })
    );

    // Get ledger by ID tool
    server.tool(
        "get-ledger",
        "Get ledger details by ID",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            id: z.string().uuid().describe("Ledger ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-ledger", args, extra);
            const { organization_id, id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                id: z.string().uuid()
            }));

            let ledgerData = { ...sampleLedgerDetails, id, organization_id };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.ledgers.get(organization_id, id);
                    if (response) {
                        ledgerData = {
                            ...response,
                            organization_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching ledger ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return ledgerData;
        })
    );
}; 