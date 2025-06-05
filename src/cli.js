#!/usr/bin/env node

/**
 * Command-line interface for managing the Lerian MCP server
 * Provides interactive configuration setup and management tools
 * 
 * @since 3.0.0 - Rebranded from Midaz to Lerian with full backward compatibility
 */

import { setupUserConfig, setupLocalConfig } from './util/setup.js';
import { maskSensitiveData } from './util/security-utils.js';
import config from './config.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User input
 */
function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

/**
 * Print a section header
 * @param {string} title - Section title
 */
function printSection(title) {
    console.log('');
    console.log(`📋 ${title}`);
    console.log('─'.repeat(title.length + 4));
}

/**
 * Display main menu and handle user selection
 */
async function mainMenu() {
    printSection('Lerian MCP Server Configuration');
    console.log('Please select an option:');
    console.log('1. Create local configuration file');
    console.log('2. Create user configuration file');
    console.log('3. Update backend connection settings');
    console.log('4. Toggle stub mode');
    console.log('5. Show current configuration');
    console.log('0. Exit');

    const choice = await ask('\nEnter your choice (0-5): ');

    switch (choice) {
        case '1':
            await createLocalConfig();
            break;
        case '2':
            await createUserConfig();
            break;
        case '3':
            await updateBackendSettings();
            break;
        case '4':
            await toggleStubMode();
            break;
        case '5':
            showCurrentConfig();
            break;
        case '0':
            console.log('\nExiting...');
            rl.close();
            return;
        default:
            console.log('\nInvalid choice. Please try again.');
    }

    // Return to main menu
    await mainMenu();
}

/**
 * Create a local configuration file
 */
async function createLocalConfig() {
    printSection('Create Local Configuration');

    const configPath = setupLocalConfig();
    console.log(`\nLocal configuration file created at: ${configPath}`);

    const proceed = await ask('\nWould you like to configure the connection settings now? (y/n): ');

    if (proceed.toLowerCase() === 'y') {
        await updateBackendSettings(configPath);
    }
}

/**
 * Create a user configuration file
 */
async function createUserConfig() {
    printSection('Create User Configuration');

    const configPath = setupUserConfig();
    console.log(`\nUser configuration file created at: ${configPath}`);

    const proceed = await ask('\nWould you like to configure the connection settings now? (y/n): ');

    if (proceed.toLowerCase() === 'y') {
        await updateBackendSettings(configPath);
    }
}

/**
 * Update backend connection settings
 * @param {string} configPath - Path to config file (optional)
 */
async function updateBackendSettings(configPath) {
    printSection('Update Backend Connection Settings');

    // If no config path provided, ask user which config to update
    if (!configPath) {
        console.log('Please select which configuration file to update:');

        // Determine available config files
        const { local, legacyLocal, user, legacyUser } = getConfigPaths();
        let options = [];

        if (fs.existsSync(local)) {
            console.log(`1. Local configuration (${local})`);
            options.push(local);
        }

        if (fs.existsSync(user)) {
            console.log(`${options.length + 1}. User configuration (${user})`);
            options.push(user);
        }

        if (fs.existsSync(legacyLocal)) {
            console.log(`${options.length + 1}. Legacy local configuration (${legacyLocal})`);
            options.push(legacyLocal);
        }

        if (fs.existsSync(legacyUser)) {
            console.log(`${options.length + 1}. Legacy user configuration (${legacyUser})`);
            options.push(legacyUser);
        }

        if (options.length === 0) {
            console.log('No configuration files found. Please create one first.');
            return;
        }

        const choice = await ask(`\nEnter your choice (1-${options.length}): `);
        const index = parseInt(choice) - 1;

        if (index < 0 || index >= options.length) {
            console.log('Invalid choice. Please try again.');
            return;
        }

        configPath = options[index];
    }

    // Read existing config
    let configData;
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(configContent);
    } catch (error) {
        console.log(`Error reading config file: ${error.message}`);
        return;
    }

    // Get new settings
    console.log('\nEnter new backend connection settings (press Enter to keep current value):');

    // Onboarding backend settings
    console.log('\nOnboarding Backend:');
    const onboardingBaseUrl = await ask(`Base URL [${configData.backend.onboarding.baseUrl}]: `);
    if (onboardingBaseUrl) configData.backend.onboarding.baseUrl = onboardingBaseUrl;

    const onboardingApiKey = await ask(`API Key [${configData.backend.onboarding.apiKey || 'none'}]: `);
    if (onboardingApiKey) configData.backend.onboarding.apiKey = onboardingApiKey;

    // Transaction backend settings
    console.log('\nTransaction Backend:');
    const transactionBaseUrl = await ask(`Base URL [${configData.backend.transaction.baseUrl}]: `);
    if (transactionBaseUrl) configData.backend.transaction.baseUrl = transactionBaseUrl;

    const transactionApiKey = await ask(`API Key [${configData.backend.transaction.apiKey || 'none'}]: `);
    if (transactionApiKey) configData.backend.transaction.apiKey = transactionApiKey;

    // Shared backend settings
    console.log('\nShared Backend Settings:');
    const timeout = await ask(`Timeout in ms [${configData.backend.timeout}]: `);
    if (timeout) configData.backend.timeout = parseInt(timeout);

    const retries = await ask(`Max retries [${configData.backend.retries}]: `);
    if (retries) configData.backend.retries = parseInt(retries);

    // Log Level
    const logLevel = await ask(`Log Level [${configData.logLevel}]: `);
    if (logLevel) configData.logLevel = logLevel;

    // Save config
    try {
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
        console.log(`\nConfiguration updated successfully at: ${configPath}`);
    } catch (error) {
        console.log(`Error writing config file: ${error.message}`);
    }
}

/**
 * Toggle stub mode
 */
async function toggleStubMode() {
    printSection('Toggle Stub Mode');

    // Determine available config files
    const { local, legacyLocal, user, legacyUser } = getConfigPaths();
    let options = [];

    if (fs.existsSync(local)) {
        console.log(`1. Local configuration (${local})`);
        options.push(local);
    }

    if (fs.existsSync(user)) {
        console.log(`${options.length + 1}. User configuration (${user})`);
        options.push(user);
    }

    if (fs.existsSync(legacyLocal)) {
        console.log(`${options.length + 1}. Legacy local configuration (${legacyLocal})`);
        options.push(legacyLocal);
    }

    if (fs.existsSync(legacyUser)) {
        console.log(`${options.length + 1}. Legacy user configuration (${legacyUser})`);
        options.push(legacyUser);
    }

    if (options.length === 0) {
        console.log('No configuration files found. Please create one first.');
        return;
    }

    const choice = await ask(`\nEnter your choice (1-${options.length}): `);
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= options.length) {
        console.log('Invalid choice. Please try again.');
        return;
    }

    const configPath = options[index];

    // Read existing config
    let configData;
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(configContent);
    } catch (error) {
        console.log(`Error reading config file: ${error.message}`);
        return;
    }

    // Toggle stub mode
    const currentMode = configData.useStubs;
    configData.useStubs = !currentMode;

    // Save config
    try {
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
        console.log(`\nStub mode ${configData.useStubs ? 'enabled' : 'disabled'} in: ${configPath}`);
    } catch (error) {
        console.log(`Error writing config file: ${error.message}`);
    }
}

/**
 * Show current configuration
 */
function showCurrentConfig() {
    printSection('Current Configuration');

    console.log('Currently using configuration from:', config._source || 'default');
    console.log('\nOnboarding Backend Settings:');
    console.log(`  Base URL: ${config.backend.onboarding.baseUrl}`);
    console.log(`  API Key: ${maskSensitiveData(config.backend.onboarding.apiKey)}`);

    console.log('\nTransaction Backend Settings:');
    console.log(`  Base URL: ${config.backend.transaction.baseUrl}`);
    console.log(`  API Key: ${maskSensitiveData(config.backend.transaction.apiKey)}`);

    console.log('\nShared Backend Settings:');
    console.log(`  Timeout: ${config.backend.timeout}ms`);
    console.log(`  Max Retries: ${config.backend.retries}`);

    console.log(`\nStub Mode: ${config.useStubs ? 'Enabled' : 'Disabled'}`);
    console.log(`Log Level: ${config.logLevel}`);

    console.log('\nPress Enter to continue...');

    // Wait for user to press Enter
    rl.once('line', () => { });
}

function getConfigPaths() {
    // Primary config paths (new Lerian branding)
    const localConfigPath = path.join(process.cwd(), 'lerian-mcp-config.json');
    const legacyLocalConfigPath = path.join(process.cwd(), 'midaz-mcp-config.json'); // backward compatibility

    let userConfigPath;
    let legacyUserConfigPath;

    if (process.platform === 'win32') {
        userConfigPath = path.join(os.homedir(), 'AppData', 'Local', 'Lerian', 'mcp-config.json');
        legacyUserConfigPath = path.join(os.homedir(), 'AppData', 'Local', 'Midaz', 'mcp-config.json'); // backward compatibility
    } else if (process.platform === 'darwin') {
        userConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Lerian', 'mcp-config.json');
        legacyUserConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Midaz', 'mcp-config.json'); // backward compatibility
    } else {
        userConfigPath = path.join(os.homedir(), '.config', 'lerian', 'mcp-config.json');
        legacyUserConfigPath = path.join(os.homedir(), '.config', 'midaz', 'mcp-config.json'); // backward compatibility
    }

    return {
        local: localConfigPath,
        user: userConfigPath,
        legacyLocal: legacyLocalConfigPath,
        legacyUser: legacyUserConfigPath
    };
}

function saveConfigPaths() {
    // Primary config paths (new Lerian branding)
    const localConfigPath = path.join(process.cwd(), 'lerian-mcp-config.json');

    let userConfigPath;

    if (process.platform === 'win32') {
        userConfigPath = path.join(os.homedir(), 'AppData', 'Local', 'Lerian', 'mcp-config.json');
    } else if (process.platform === 'darwin') {
        userConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Lerian', 'mcp-config.json');
    } else {
        userConfigPath = path.join(os.homedir(), '.config', 'lerian', 'mcp-config.json');
    }

    return {
        local: localConfigPath,
        user: userConfigPath
    };
}

// Start the CLI
mainMenu(); 