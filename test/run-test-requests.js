#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to MCP server and test file
const SERVER_PATH = resolve(__dirname, '../dist/index.js');
const TEST_PATH = resolve(__dirname, './requests/basic-tests.js');

console.log('Starting MCP server...');

// Start the MCP server
const server = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'inherit']
});

// Create readline interface to properly handle line-by-line JSON parsing
const serverOutput = createInterface({
    input: server.stdout,
    crlfDelay: Infinity
});

// Set up test process
let testProcess = null;

// Handle server output with proper line handling
serverOutput.on('line', (line) => {
    if (!line.trim()) return;

    console.log(`Server → Test: ${line}`);

    // Forward to test process if it exists
    if (testProcess && !testProcess.killed) {
        testProcess.stdin.write(line + '\n');
    } else {
        console.log('No test process to receive server output');
    }
});

// Wait for server to start up
setTimeout(() => {
    console.log('Starting test process...');

    // Start the test process
    testProcess = spawn('node', [TEST_PATH], {
        stdio: ['pipe', 'pipe', 'inherit']
    });

    // Create readline interface for test output
    const testOutput = createInterface({
        input: testProcess.stdout,
        crlfDelay: Infinity
    });

    // Handle test output with proper line handling
    testOutput.on('line', (line) => {
        if (!line.trim()) return;

        console.log(`Test → Server: ${line}`);

        // Forward to server
        server.stdin.write(line + '\n');
    });

    // Handle test process completion
    testProcess.on('close', (code) => {
        console.log(`Test process completed with code ${code}`);
        cleanup();
    });

    testProcess.on('error', (error) => {
        console.error(`Test process error: ${error.message}`);
        cleanup(1);
    });

}, 2000); // Give server more time to initialize (2 seconds)

// Cleanup function
function cleanup(exitCode = 0) {
    console.log('Cleaning up processes...');

    if (testProcess && !testProcess.killed) {
        testProcess.kill();
    }

    if (server && !server.killed) {
        server.kill();
    }

    process.exit(exitCode);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT, cleaning up...');
    cleanup();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`Uncaught exception: ${error.message}`);
    cleanup(1);
}); 