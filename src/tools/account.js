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
const sampleAccounts = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Checking Account",
        alias: "@checking",
        type: "deposit",
        assetCode: "USD",
        status: {
            code: "ACTIVE",
            description: "Account is currently active"
        },
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Savings Account",
        alias: "@savings",
        type: "deposit",
        assetCode: "USD",
        status: {
            code: "ACTIVE",
            description: "Account is currently active"
        },
        metadata: {},
        createdAt: "2023-02-15T00:00:00Z",
        updatedAt: "2023-02-15T00:00:00Z",
    },
];

const sampleAccountDetails = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Checking Account",
    alias: "@checking",
    type: "deposit",
    assetCode: "USD",
    status: {
        code: "ACTIVE",
        description: "Account is currently active",
    },
    parentAccountId: null,
    portfolioId: null,
    segmentId: null,
    metadata: {},
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
};

/**
 * Register account-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerAccountTools = (server) => {
    // List accounts tool
    server.tool(
        "list-accounts",
        "List accounts in a ledger with optional pagination",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)"),
            start_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            end_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            asset_code: z.string().optional().describe("Filter by asset code"),
            type: z.string().optional().describe("Filter by account type"),
            metadata: z.string().optional().describe("JSON string to filter accounts by metadata fields"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-accounts", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10),
                start_date: z.string().optional(),
                end_date: z.string().optional(),
                sort_order: z.enum(["asc", "desc"]).optional(),
                asset_code: z.string().optional(),
                type: z.string().optional(),
                metadata: z.string().optional()
            }));

            let accounts = sampleAccounts;

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.accounts.list(validatedArgs.organization_id, validatedArgs.ledger_id, {
                        limit: validatedArgs.limit,
                        start_date: validatedArgs.start_date,
                        end_date: validatedArgs.end_date,
                        sort_order: validatedArgs.sort_order,
                        asset_code: validatedArgs.asset_code,
                        type: validatedArgs.type,
                        metadata: validatedArgs.metadata
                    });
                    if (response && response.items) {
                        accounts = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching accounts for ledger ${validatedArgs.ledger_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(accounts, validatedArgs);
        })
    );

    // Get account by ID tool
    server.tool(
        "get-account",
        "Get account details by ID",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            id: z.string().uuid().describe("Account ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-account", args, extra);
            const { organization_id, ledger_id, id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                id: z.string().uuid()
            }));

            let accountData = { ...sampleAccountDetails, id, organization_id, ledger_id };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.accounts.get(organization_id, ledger_id, id);
                    if (response) {
                        accountData = {
                            ...response,
                            organization_id,
                            ledger_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching account ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return accountData;
        })
    );
}; 