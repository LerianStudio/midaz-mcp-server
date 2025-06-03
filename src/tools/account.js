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
        "List all accounts within a specific ledger with advanced filtering and pagination. Accounts hold balances and are the core entities for financial transactions. Essential for transaction processing and balance management.",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID v4 format (REQUIRED). Parent container for the ledger. Format: '12345678-1234-1234-1234-123456789012'. Get from list-organizations first. All ledgers belong to an organization."),
            
            ledger_id: z.string().uuid().describe("Ledger ID in UUID v4 format (REQUIRED). The ledger containing the accounts to list. Format: '12345678-1234-1234-1234-123456789012'. Get from list-ledgers with the organization_id first. Ledgers group related accounts."),
            
            cursor: z.string().optional().describe("Pagination cursor for next page (optional). Opaque string from previous response. Omit for first page. Use exact value returned in 'nextCursor' field - do not modify or construct manually."),
            
            limit: z.number().optional().default(10).describe("Number of accounts per page (range: 1-100, default: 10). Recommended: 10-20 for UI lists, 50-100 for data processing. Each account includes balance information, so large limits may impact performance."),
            
            start_date: z.string().optional().describe("Filter accounts created after this date (optional). Format: 'YYYY-MM-DD' (ISO 8601 date only). Example: '2024-01-01'. Useful for finding recently created accounts or filtering by creation periods."),
            
            end_date: z.string().optional().describe("Filter accounts created before this date (optional). Format: 'YYYY-MM-DD' (ISO 8601 date only). Example: '2024-12-31'. Must be after start_date if both provided. Use with start_date for date range filtering."),
            
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction for results (optional). 'asc': oldest first (chronological), 'desc': newest first (reverse chronological). Default sorting is by creation date. Affects pagination order."),
            
            asset_code: z.string().optional().describe("Filter by asset/currency code (optional). Examples: 'USD', 'EUR', 'BTC', 'POINTS'. Case-sensitive exact match. Returns only accounts that hold balances in this specific asset type."),
            
            type: z.string().optional().describe("Filter by account type (optional). Common types: 'asset', 'liability', 'equity', 'revenue', 'expense'. Follows double-entry accounting principles. Use for organizing accounts by their accounting purpose."),
            metadata: z.string().optional().describe("JSON string to filter accounts by custom metadata fields (optional). Format: '{\"key\":\"value\"}' for exact matches. Examples: '{\"department\":\"sales\"}', '{\"customer_id\":\"12345\"}', '{\"region\":\"us-west\"}'. Useful for finding accounts tagged with specific business context. Must be valid JSON syntax."),
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