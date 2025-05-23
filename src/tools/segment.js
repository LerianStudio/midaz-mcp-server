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
const sampleSegments = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Department",
        description: "Organizational department segmentation",
        values: ["Sales", "Marketing", "Finance", "IT"],
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Region",
        description: "Geographic region segmentation",
        values: ["North America", "Europe", "Asia", "Latin America"],
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    }
];

/**
 * Register segment-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerSegmentTools = (server) => {
    // List segments tool
    server.tool(
        "list-segments",
        "List segments in a ledger with optional pagination",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)"),
            sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
            metadata: z.string().optional().describe("JSON string to filter segments by metadata fields"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-segments", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10),
                sort_order: z.enum(["asc", "desc"]).optional(),
                metadata: z.string().optional()
            }));

            let segments = sampleSegments;

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.segments.list(validatedArgs.organization_id, validatedArgs.ledger_id, {
                        limit: validatedArgs.limit,
                        sort_order: validatedArgs.sort_order,
                        metadata: validatedArgs.metadata
                    });
                    if (response && response.items) {
                        segments = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching segments for ledger ${validatedArgs.ledger_id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(segments, validatedArgs);
        })
    );

    // Get segment by ID tool
    server.tool(
        "get-segment",
        "Get segment details by ID",
        {
            organization_id: z.string().uuid().describe("Organization ID in UUID format"),
            ledger_id: z.string().uuid().describe("Ledger ID in UUID format"),
            id: z.string().uuid().describe("Segment ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-segment", args, extra);
            const { organization_id, ledger_id, id } = validateArgs(args, z.object({
                organization_id: z.string().uuid(),
                ledger_id: z.string().uuid(),
                id: z.string().uuid()
            }));

            // Find segment in sample data
            const segment = sampleSegments.find(s => s.id === id) || {
                ...sampleSegments[0],
                id
            };

            let segmentData = {
                ...segment,
                organization_id,
                ledger_id
            };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.segments.get(organization_id, ledger_id, id);
                    if (response) {
                        segmentData = {
                            ...response,
                            organization_id,
                            ledger_id
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching segment ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return segmentData;
        })
    );
}; 