#!/usr/bin/env node

import { createInterface } from 'readline';
import { stdin as input, stdout as output, stderr } from 'process';

// Create readline interface for parsing line-by-line JSON responses
const rl = createInterface({ input, output, crlfDelay: Infinity });

// Function to send a request to the MCP server and wait for response
function sendRequest(request) {
    // Log what we're sending for debugging
    stderr.write(`Sending request: ${JSON.stringify(request)}\n`);

    // Check if this is a notification (no "id" field)
    const isNotification = !request.id;

    // Send to stdout (which is connected to the server's stdin)
    output.write(JSON.stringify(request) + '\n');

    // For notifications, resolve immediately without waiting for response
    if (isNotification) {
        return Promise.resolve({ notification: true });
    }

    // For regular requests, wait for the response with matching ID
    return new Promise((resolve, reject) => {
        const requestId = request.id;

        // Set a timeout to avoid hanging indefinitely
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error(`Timeout waiting for response to request with ID: ${requestId}`));
        }, 5000);

        // Set up a line listener for responses
        const lineListener = (line) => {
            if (!line.trim()) return;

            try {
                const response = JSON.parse(line);

                // Check if this response matches our request ID
                if (response.id === requestId) {
                    cleanup();
                    resolve(response);
                }
                // Otherwise, log it but keep waiting
                else {
                    stderr.write(`Received response for different request ID: ${JSON.stringify(response)}\n`);
                }
            } catch (e) {
                stderr.write(`Error parsing response: ${e}\nRaw data: ${line}\n`);
                // Don't reject, continue waiting
            }
        };

        // Add the listener
        rl.on('line', lineListener);

        // Cleanup function
        function cleanup() {
            clearTimeout(timeout);
            rl.removeListener('line', lineListener);
        }
    });
}

// Sample requests
const requests = {
    // Initialize request (required first)
    initialize: {
        jsonrpc: "2.0",
        id: "init-request",
        method: "initialize",
        params: {
            protocolVersion: "0.1.0",
            clientInfo: {
                name: "midaz-test-client",
                version: "0.1.0"
            },
            capabilities: {
                tools: true
            }
        }
    },

    // Initialized notification (required after initialization)
    initialized: {
        jsonrpc: "2.0",
        method: "initialized"
    },

    // Organization-related requests
    listOrganizations: {
        jsonrpc: "2.0",
        id: "list-organizations",
        method: "tools/call",
        params: {
            name: "list-organizations",
            arguments: {}
        }
    },

    // Account-related requests
    listAccounts: {
        jsonrpc: "2.0",
        id: "list-accounts",
        method: "tools/call",
        params: {
            name: "list-accounts",
            arguments: {}
        }
    },

    // Transaction-related requests
    listTransactions: {
        jsonrpc: "2.0",
        id: "list-transactions",
        method: "tools/call",
        params: {
            name: "list-transactions",
            arguments: {}
        }
    },

    // Asset-related requests
    listAssets: {
        jsonrpc: "2.0",
        id: "list-assets",
        method: "tools/call",
        params: {
            name: "list-assets",
            arguments: {}
        }
    },

    // Portfolio-related requests
    listPortfolios: {
        jsonrpc: "2.0",
        id: "list-portfolios",
        method: "tools/call",
        params: {
            name: "list-portfolios",
            arguments: {}
        }
    },

    // Segment-related requests
    listSegments: {
        jsonrpc: "2.0",
        id: "list-segments",
        method: "tools/call",
        params: {
            name: "list-segments",
            arguments: {}
        }
    }
};

// Main function to run tests
async function runTests() {
    stderr.write('Starting MCP test requests...\n');

    try {
        // Initialize the connection
        stderr.write('\n=== Initializing MCP Session ===\n');
        const initResponse = await sendRequest(requests.initialize);
        stderr.write(`Initialize Response: ${JSON.stringify(initResponse, null, 2)}\n`);

        // Send initialized notification
        stderr.write('\n=== Sending Initialized Notification ===\n');
        await sendRequest(requests.initialized);
        stderr.write('Initialized notification sent\n');

        // Test organization endpoints
        stderr.write('\n=== Testing Organization Tools ===\n');
        const orgResponse = await sendRequest(requests.listOrganizations);
        stderr.write(`Response: ${JSON.stringify(orgResponse, null, 2)}\n`);

        // Test account endpoints
        stderr.write('\n=== Testing Account Tools ===\n');
        const accountsResponse = await sendRequest(requests.listAccounts);
        stderr.write(`Response: ${JSON.stringify(accountsResponse, null, 2)}\n`);

        // Test transaction endpoints
        stderr.write('\n=== Testing Transaction Tools ===\n');
        const transactionsResponse = await sendRequest(requests.listTransactions);
        stderr.write(`Response: ${JSON.stringify(transactionsResponse, null, 2)}\n`);

        // Test asset endpoints
        stderr.write('\n=== Testing Asset Tools ===\n');
        const assetsResponse = await sendRequest(requests.listAssets);
        stderr.write(`Response: ${JSON.stringify(assetsResponse, null, 2)}\n`);

        // Test portfolio endpoints
        stderr.write('\n=== Testing Portfolio Tools ===\n');
        const portfoliosResponse = await sendRequest(requests.listPortfolios);
        stderr.write(`Response: ${JSON.stringify(portfoliosResponse, null, 2)}\n`);

        // Test segment endpoints
        stderr.write('\n=== Testing Segment Tools ===\n');
        const segmentsResponse = await sendRequest(requests.listSegments);
        stderr.write(`Response: ${JSON.stringify(segmentsResponse, null, 2)}\n`);

    } catch (error) {
        stderr.write(`Error during tests: ${error}\n`);
    } finally {
        stderr.write('Tests completed\n');
        process.exit(0);
    }
}

// Run the tests
runTests(); 