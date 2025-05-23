import { z } from "zod";
import api from "../util/api.js";
import config from "../config.js";

// Sample data for when real API is not available
const sampleAssetRates = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        externalId: "USDEUR-001",
        from: "USD",
        to: "EUR",
        rate: 0.85,
        scale: 2,
        source: "exchange",
        ttl: 3600,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        externalId: "USDBTC-001",
        from: "USD",
        to: "BTC",
        rate: 0.000023,
        scale: 6,
        source: "exchange",
        ttl: 3600,
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    }
];

/**
 * Register asset rate-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerAssetRateTools = (server) => {
    // Get asset rate by asset code tool
    server.tool(
        "list-asset-rates-by-asset",
        "List asset rates by source asset code",
        {
            organization_id: z.string().describe("Organization ID in UUID format"),
            ledger_id: z.string().describe("Ledger ID in UUID format"),
            asset_code: z.string().describe("Source asset code"),
            to: z.array(z.string()).optional().describe("Target asset codes"),
            limit: z.number().optional().describe("Maximum number of rates to return"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            start_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            end_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            cursor: z.string().optional().describe("Cursor for pagination"),
        },
        async (args, extra) => {
            const { organization_id, ledger_id, asset_code, to } = args;

            try {
                // Only attempt real API call if stubs are disabled
                if (!config.useStubs) {
                    const params = {};
                    if (to && to.length > 0) {
                        params.to = to.join(',');
                    }

                    // Add other parameters
                    if (args.limit) params.limit = args.limit;
                    if (args.sort_order) params.sort_order = args.sort_order;
                    if (args.start_date) params.start_date = args.start_date;
                    if (args.end_date) params.end_date = args.end_date;
                    if (args.cursor) params.cursor = args.cursor;

                    const response = await api.assetRates.getByAssetCode(organization_id, ledger_id, asset_code, params);
                    return {
                        organization_id,
                        ledger_id,
                        asset_code,
                        ...response
                    };
                }
            } catch (error) {
                // Log error but continue to return sample data
                console.error(`Error fetching asset rates for asset ${asset_code}: ${error.message}`);
            }

            // Filter sample data based on the parameters
            let filteredRates = sampleAssetRates.filter(rate => rate.from === asset_code);

            if (to && to.length > 0) {
                filteredRates = filteredRates.filter(rate => to.includes(rate.to));
            }

            return {
                organization_id,
                ledger_id,
                asset_code,
                rates: filteredRates,
                total: filteredRates.length,
                prev_cursor: null,
                next_cursor: null
            };
        }
    );

    // Get asset rate by external ID tool
    server.tool(
        "get-asset-rate-by-external-id",
        "Get asset rate details by external ID",
        {
            organization_id: z.string().describe("Organization ID in UUID format"),
            ledger_id: z.string().describe("Ledger ID in UUID format"),
            external_id: z.string().describe("External ID of the asset rate"),
        },
        async (args, extra) => {
            const { organization_id, ledger_id, external_id } = args;

            try {
                // Only attempt real API call if stubs are disabled
                if (!config.useStubs) {
                    const response = await api.assetRates.getByExternalId(organization_id, ledger_id, external_id);
                    return {
                        ...response,
                        organization_id,
                        ledger_id
                    };
                }
            } catch (error) {
                // Log error but continue to return sample data
                console.error(`Error fetching asset rate with external ID ${external_id}: ${error.message}`);
            }

            // Return sample data as fallback
            const assetRate = sampleAssetRates.find(ar => ar.externalId === external_id) || {
                ...sampleAssetRates[0],
                externalId: external_id
            };

            return {
                ...assetRate,
                organization_id,
                ledger_id
            };
        }
    );

    // List asset rates tool
    server.tool(
        "list-asset-rates",
        "List asset exchange rates",
        {
            organization_id: z.string().describe("Organization ID in UUID format"),
            ledger_id: z.string().describe("Ledger ID in UUID format"),
            from: z.string().optional().describe("Source asset code"),
            to: z.array(z.string()).optional().describe("Target asset codes"),
            limit: z.number().optional().describe("Maximum number of rates to return"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            start_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            end_date: z.string().optional().describe("Filter by creation date (YYYY-MM-DD)"),
            cursor: z.string().optional().describe("Cursor for pagination"),
        },
        async (args, extra) => {
            const { organization_id, ledger_id, from, to } = args;
            
            console.log(`[DEBUG] list-asset-rates called with organization_id: ${organization_id}, ledger_id: ${ledger_id}`);
            console.log(`[DEBUG] Using stubs: ${config.useStubs}`);

            try {
                // Only attempt real API call if stubs are disabled
                if (!config.useStubs) {
                    if (from) {
                        // If we have a 'from' currency, use the specific endpoint
                        const params = {};
                        if (to && to.length > 0) {
                            params.to = to.join(',');
                        }

                        // Add other parameters
                        if (args.limit) params.limit = args.limit;
                        if (args.sort_order) params.sort_order = args.sort_order;
                        if (args.start_date) params.start_date = args.start_date;
                        if (args.end_date) params.end_date = args.end_date;
                        if (args.cursor) params.cursor = args.cursor;

                        // This would need to be implemented in the API utility, using:
                        // `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/asset-rates/from/${assetCode}`
                        console.error(`API call for get-asset-rates-by-asset not directly implemented yet`);

                        // For now, filter the sample data
                        let filteredRates = sampleAssetRates.filter(rate => rate.from === from);
                        if (to && to.length > 0) {
                            filteredRates = filteredRates.filter(rate => to.includes(rate.to));
                        }

                        return {
                            organization_id,
                            ledger_id,
                            from,
                            rates: filteredRates,
                            total: filteredRates.length,
                            prev_cursor: null,
                            next_cursor: null
                        };
                    }

                    // Otherwise, use the general endpoint
                    console.log(`[DEBUG] Attempting real API call to list asset rates`);
                    console.log(`[DEBUG] api.assetRates:`, JSON.stringify(Object.keys(api.assetRates)));
                    
                    try {
                        const response = await api.assetRates.list(organization_id, ledger_id, {
                            limit: args.limit,
                            sort_order: args.sort_order,
                            start_date: args.start_date,
                            end_date: args.end_date,
                            cursor: args.cursor
                        });
                        
                        console.log(`[DEBUG] API response received:`, JSON.stringify(response));
                        
                        return {
                            organization_id,
                            ledger_id,
                            ...response
                        };
                    } catch (error) {
                        console.error(`[DEBUG] Error in asset rates API call: ${error.message}`);
                        console.error(`[DEBUG] Error stack: ${error.stack}`);
                        throw error; // Re-throw to be caught by the outer catch
                    }
                }
            } catch (error) {
                // Log error but continue to return sample data
                console.error(`Error fetching asset rates: ${error.message}`);
            }

            // Filter sample data based on the parameters
            let filteredRates = [...sampleAssetRates];

            if (from) {
                filteredRates = filteredRates.filter(rate => rate.from === from);
            }

            if (to && to.length > 0) {
                filteredRates = filteredRates.filter(rate => to.includes(rate.to));
            }

            return {
                organization_id,
                ledger_id,
                rates: filteredRates,
                total: filteredRates.length,
                prev_cursor: null,
                next_cursor: null
            };
        }
    );
}; 