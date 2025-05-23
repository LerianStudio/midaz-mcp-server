#!/usr/bin/env node
/**
 * Development Server with Hot Reload
 * 
 * This script provides a development server with:
 * - Hot reload on file changes
 * - Schema validation
 * - Enhanced error messages
 * - Debug logging
 */

import { spawn } from 'child_process';
import { watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  watchDirs: [
    join(__dirname),
    join(__dirname, 'tools'),
    join(__dirname, 'resources'),
    join(__dirname, 'util')
  ],
  ignorePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /\.log$/
  ],
  debounceMs: 1000
};

// State
let serverProcess = null;
let restarting = false;
let restartTimer = null;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

// Log with timestamp and color
function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

// Start the MCP server
function startServer() {
  log('Starting MCP server...', 'blue');

  // Set development environment
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    DEBUG: 'midaz:*',
    FORCE_COLOR: '1'
  };

  // Use ts-node for TypeScript files
  serverProcess = spawn('npx', ['ts-node', '--esm', 'src/index.ts'], {
    stdio: 'inherit',
    env
  });

  serverProcess.on('error', (error) => {
    log(`Failed to start server: ${error.message}`, 'red');
  });

  serverProcess.on('exit', (code, signal) => {
    if (!restarting) {
      if (code === 0) {
        log('Server stopped gracefully', 'green');
      } else {
        log(`Server crashed with code ${code} (${signal})`, 'red');
      }
    }
    serverProcess = null;
  });

  log('Server started in development mode', 'green');
}

// Stop the MCP server
function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }

    log('Stopping server...', 'yellow');
    restarting = true;

    // Try graceful shutdown first
    serverProcess.kill('SIGTERM');

    // Force kill after timeout
    const killTimer = setTimeout(() => {
      if (serverProcess) {
        log('Force killing server...', 'red');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);

    serverProcess.on('exit', () => {
      clearTimeout(killTimer);
      restarting = false;
      resolve();
    });
  });
}

// Restart the server
async function restartServer(reason) {
  // Clear any pending restart
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  // Debounce restarts
  restartTimer = setTimeout(async () => {
    log(`Restarting due to ${reason}...`, 'magenta');
    await stopServer();
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    startServer();
  }, config.debounceMs);
}

// Validate TypeScript files
async function validateTypeScript() {
  return new Promise((resolve) => {
    log('Running TypeScript validation...', 'gray');
    
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      stdio: 'pipe'
    });

    let output = '';
    tsc.stdout.on('data', (data) => output += data);
    tsc.stderr.on('data', (data) => output += data);

    tsc.on('exit', (code) => {
      if (code === 0) {
        log('TypeScript validation passed', 'green');
        resolve(true);
      } else {
        log('TypeScript validation failed:', 'red');
        console.log(output);
        resolve(false);
      }
    });
  });
}

// Check if file should be ignored
function shouldIgnore(filePath) {
  return config.ignorePatterns.some(pattern => pattern.test(filePath));
}

// Watch for file changes
function setupWatchers() {
  log('Setting up file watchers...', 'blue');

  config.watchDirs.forEach(dir => {
    watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename || shouldIgnore(filename)) {
        return;
      }

      const fullPath = path.join(dir, filename);
      const ext = path.extname(filename);

      // Only watch relevant files
      if (!['.js', '.ts', '.json', '.md'].includes(ext)) {
        return;
      }

      log(`File ${eventType}: ${filename}`, 'yellow');

      // Different actions based on file type
      if (ext === '.md') {
        // Markdown changes don't require restart (lazy loaded)
        log('Markdown file changed - will be reloaded on next access', 'gray');
      } else {
        // Code changes require restart
        restartServer(`${filename} ${eventType}`);
      }
    });
  });

  log(`Watching ${config.watchDirs.length} directories`, 'green');
}

// Handle process signals
function setupSignalHandlers() {
  process.on('SIGINT', async () => {
    log('\nReceived SIGINT, shutting down...', 'yellow');
    await stopServer();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('\nReceived SIGTERM, shutting down...', 'yellow');
    await stopServer();
    process.exit(0);
  });
}

// Main function
async function main() {
  console.clear();
  log('=== Midaz MCP Development Server ===', 'magenta');
  log('Hot reload enabled - watching for changes', 'blue');
  
  // Initial TypeScript validation
  const valid = await validateTypeScript();
  if (!valid) {
    log('Fix TypeScript errors before continuing', 'red');
    process.exit(1);
  }

  // Setup
  setupSignalHandlers();
  setupWatchers();

  // Start server
  startServer();

  // Keep process alive
  process.stdin.resume();
}

// Run
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});