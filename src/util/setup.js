/**
 * Setup utilities for the Midaz MCP server
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Create a default configuration file
 * @param {string} configPath - Path to create the config file
 */
export function createDefaultConfigFile(configPath) {
    const defaultConfig = {
        backend: {
            onboarding: {
                baseUrl: 'http://localhost:3000',
                apiKey: 'your-api-key-here'
            },
            transaction: {
                baseUrl: 'http://localhost:3001',
                apiKey: 'your-api-key-here'
            },
            timeout: 10000,
            retries: 3,
        },
        server: {
            name: 'lerian-mcp-server',
            version: '0.1.0'
        },
        useStubs: false,
        logLevel: 'info'
    };

    // Create directory if it doesn't exist
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf8'
    );

    console.log(`Created default config file at: ${configPath}`);
}

/**
 * Create user config directory and default config file
 */
export function setupUserConfig() {
    let configPath;

    // Determine config path based on platform
    if (process.platform === 'win32') {
        configPath = path.join(os.homedir(), 'AppData', 'Local', 'Midaz', 'mcp-config.json');
    } else if (process.platform === 'darwin') {
        configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Midaz', 'mcp-config.json');
    } else {
        configPath = path.join(os.homedir(), '.config', 'midaz', 'mcp-config.json');
    }

    // Skip if config already exists
    if (fs.existsSync(configPath)) {
        console.log(`Config file already exists at: ${configPath}`);
        return configPath;
    }

    createDefaultConfigFile(configPath);
    return configPath;
}

/**
 * Create a local configuration file in the current directory
 */
export function setupLocalConfig() {
    const configPath = path.join(process.cwd(), 'midaz-mcp-config.json');

    // Skip if config already exists
    if (fs.existsSync(configPath)) {
        console.log(`Local config file already exists at: ${configPath}`);
        return configPath;
    }

    createDefaultConfigFile(configPath);
    return configPath;
}

export default {
    setupUserConfig,
    setupLocalConfig,
    createDefaultConfigFile,
}; 