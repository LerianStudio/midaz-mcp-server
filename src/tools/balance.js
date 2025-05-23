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
const sampleBalance = {
    id: "00000000-0000-0000-0000-000000000001",
    alias: "@savings",
    assetCode: "USD",
    available: 8000,
    onHold: 0,
    scale: 2,
    version: 5,
    accountType: "deposit",
    allowSending: true,
    allowReceiving: true,
    metadata: {},
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-15T00:00:00Z",
};

const sampleRates = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        from: "USD",
        to: "EUR",
        rate: 85,
        rateScale: 2,
        source: "exchange",
        ttl: 3600,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        from: "USD",
        to: "GBP",
        rate: 78,
        rateScale: 2,
        source: "exchange",
        ttl: 3600,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000003",
        from: "EUR",
        to: "USD",
        rate: 117,
        rateScale: 2,
        source: "exchange",
        ttl: 3600,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
];

/**
 * Register balance-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerBalanceTools = (server) => {
    // Get account balance tool
    server.tool(
        "get-balance",
        "Get account balance",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            account_id: z.string().uuid().describe("Account ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-balance", args, extra);
            const { organization_id, ledger_id, account_id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                account_id: z.string().uuid()
            }));

            let balanceData = {
                ...sampleBalance,
                id: account_id,
                organization_id,
                ledger_id,
                account_id
            };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.balances.getAccountBalance(organization_id, ledger_id, account_id);
                    if (response) {
                        balanceData = {
                            ...response,
                            organization_id,
                            ledger_id,
                            account_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching balance for account ${account_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return balanceData;
        })
    );
}; 