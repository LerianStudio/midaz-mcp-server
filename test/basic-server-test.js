#!/usr/bin/env node

/**
 * This script tests the basic functionality of the Midaz MCP server.
 * It starts the server and verifies it's running correctly.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    bold: '\x1b[1m'
};

const serverPath = path.join(__dirname, '../dist/index.js');
let server;

/**
 * Start the MCP server as a child process
 */
function startServer() {
    console.log(`${colors.blue}Starting MCP server...${colors.reset}`);

    server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', process.stderr]
    });

    // Listen for data from the server
    server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`${colors.yellow}Server output: ${output}${colors.reset}`);

        // Look for initialization messages
        if (output.includes('MCP server started') ||
            output.includes('Server initialized') ||
            output.includes('Midaz MCP server')) {
            console.log(`${colors.green}${colors.bold}✓ Server started successfully!${colors.reset}`);
        }
    });

    server.on('error', (error) => {
        console.error(`${colors.red}Server error: ${error.message}${colors.reset}`);
        process.exit(1);
    });

    // Wait for server to initialize
    return new Promise((resolve) => {
        setTimeout(() => {
            if (server && !server.killed) {
                console.log(`${colors.green}Server is running for 3 seconds without errors${colors.reset}`);
                resolve();
            } else {
                console.error(`${colors.red}Server failed to start or crashed${colors.reset}`);
                process.exit(1);
            }
        }, 3000);
    });
}

/**
 * Shutdown the MCP server
 */
function stopServer() {
    if (server) {
        console.log(`${colors.blue}Stopping MCP server...${colors.reset}`);
        server.kill();
    }
}

/**
 * Main test function
 */
async function runTest() {
    try {
        await startServer();
        console.log(`${colors.green}${colors.bold}Basic server test passed!${colors.reset}`);
        process.exit(0);
    } catch (error) {
        console.error(`${colors.red}Test error: ${error.message}${colors.reset}`);
        process.exit(1);
    } finally {
        stopServer();
    }
}

// Handle script termination
process.on('SIGINT', () => {
    stopServer();
    process.exit();
});

// Run the test
runTest(); 