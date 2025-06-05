import { z } from "zod";
import api from "../util/api.js";
import config from "../config.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    createPaginatedResponse,
    wrapToolHandler,
    validateArgs,
    logToolInvocation
} from "../util/mcp-helpers.js";

// Get package.json version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

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
 * 
 * Provides tools for listing and retrieving organization information from the Lerian system.
 * Organizations are the top-level entities in the Lerian hierarchy: Organization → Ledger → Portfolio → Account.
 * 
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 * @since 3.0.0 - Updated for Lerian branding with backward compatibility
 */
export const registerOrganizationTools = (server) => {
    // List organizations tool
    server.tool(
        "list-organizations",
        "List all organizations with cursor-based pagination. Returns organization IDs, names, status, and metadata. Use this as the starting point for exploring the Midaz hierarchy: Organization → Ledger → Portfolio → Account.",
        {
            cursor: z.string().optional().describe("Pagination cursor for next page of results (optional). Format: opaque string returned from previous response. Omit for first page. Example: 'eyJpZCI6IjEyMyJ9'. Use exact cursor value from previous response - do not modify."),
            limit: z.number().optional().default(10).describe("Number of organizations to return per page (range: 1-100, default: 10). Recommended: 10-20 for UI display, 50-100 for data processing. Large limits may impact performance. Each organization includes full details (name, status, metadata, timestamps).")
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
        "Get detailed information for a specific organization by ID. Returns complete organization profile including legal details, address, status, metadata, and timestamps. Required for accessing organization-specific ledgers and accounts.",
        {
            id: z.string().uuid().describe("Organization ID in UUID v4 format (REQUIRED). Format: '12345678-1234-1234-1234-123456789012'. Get valid IDs from list-organizations first. Example: '00000000-0000-0000-0000-000000000001'. Must be exact UUID - partial IDs or names will not work."),
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

    // Version tool for debugging MCP server status
    server.tool(
        "midaz-mcp-version",
        "Get the current version and status of the Midaz MCP server. Useful for debugging and ensuring you're connected to the right server instance.",
        {},
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("midaz-mcp-version", args, extra);

            const versionInfo = {
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description,
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                uptime: process.uptime(),
                pid: process.pid,
                memoryUsage: process.memoryUsage(),
                config: {
                    useStubs: config.useStubs,
                    baseURL: config.baseURL,
                    environment: process.env.NODE_ENV || 'development'
                },
                capabilities: {
                    prompts: true,
                    tools: true,
                    resources: false
                },
                serverStatus: "running",
                buildInfo: {
                    builtAt: packageJson.version,
                    main: packageJson.main,
                    type: packageJson.type
                }
            };

            return versionInfo;
        })
    );
}; 