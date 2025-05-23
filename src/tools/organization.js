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
const sampleOrganizations = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        legalName: "Example Corp",
        legalDocument: "12345678901",
        doingBusinessAs: "Example",
        status: {
            code: "ACTIVE",
            description: "Organization is currently active"
        },
        metadata: {},
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        legalName: "Test Organization",
        legalDocument: "98765432109",
        doingBusinessAs: "TestOrg",
        status: {
            code: "ACTIVE",
            description: "Organization is currently active"
        },
        metadata: {},
        createdAt: "2023-02-15T00:00:00Z",
        updatedAt: "2023-02-15T00:00:00Z",
    },
];

const sampleOrganizationDetails = {
    id: "00000000-0000-0000-0000-000000000001",
    legalName: "Example Corp",
    legalDocument: "12345678901",
    doingBusinessAs: "Example",
    address: {
        street: "123 Main St",
        number: "100",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        zipCode: "94105",
    },
    status: {
        code: "ACTIVE",
        description: "Organization is currently active",
    },
    metadata: {},
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
};

/**
 * Register organization-related tools with the MCP server
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerOrganizationTools = (server) => {
    // List organizations tool
    server.tool(
        "list-organizations",
        "List all organizations with optional pagination",
        {
            cursor: z.string().optional().describe("Pagination cursor for next page"),
            limit: z.number().optional().default(10).describe("Number of items to return (max 100)")
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("list-organizations", args, extra);
            const validatedArgs = validateArgs(args, z.object({
                cursor: z.string().optional(),
                limit: z.number().min(1).max(100).optional().default(10)
            }));

            let organizations = sampleOrganizations;

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.organizations.list();
                    if (response && response.items) {
                        organizations = response.items;
                    }
                } catch (error) {
                    console.error(`Error fetching organizations: ${error.message}`);
                    // Fall back to sample data
                }
            }

            // Return paginated response
            return createPaginatedResponse(organizations, validatedArgs);
        })
    );

    // Get organization by ID tool
    server.tool(
        "get-organization",
        "Get organization details by ID",
        {
            id: z.string().uuid().describe("Organization ID in UUID format"),
        },
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("get-organization", args, extra);
            const { id } = validateArgs(args, z.object({
                id: z.string().uuid()
            }));

            let organizationData = { ...sampleOrganizationDetails, id };

            // Only attempt real API call if stubs are disabled
            if (!config.useStubs) {
                try {
                    const response = await api.organizations.get(id);
                    if (response) {
                        organizationData = response;
                    }
                } catch (error) {
                    console.error(`Error fetching organization ${id}: ${error.message}`);
                    // Fall back to sample data
                }
            }

            return organizationData;
        })
    );
}; 