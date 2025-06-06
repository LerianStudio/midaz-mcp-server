/**
 * Configuration management for the Lerian MCP server
 * Handles environment variables, config files, and default settings
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateConfig, buildConfigFromEnv, mergeConfigs } from './util/config-validator.js';
import { loadSecureConfiguration, sanitizeConfig } from './util/config-security.js';

/**
 * Default configuration for the Lerian MCP server
 */
const defaultConfig = {
    backend: {
        onboarding: {
            baseUrl: 'http://localhost:3000',
            apiKey: null,
        },
        transaction: {
            baseUrl: 'http://localhost:3001',
            apiKey: null,
        },
        timeout: 10000, // 10 seconds
        retries: 3,
    },
    server: {
        name: 'lerian-mcp-server',
        version: '3.0.0',
        description: 'Lerian MCP Server for financial ledger operations'
    },
    useStubs: true, // Default to using stub data if no real connection is available
    logLevel: 'info', // Default log level
    autoDetect: true, // Automatically detect local services
    localOnly: true, // Only accept connections from localhost
    docsUrl: 'https://docs.lerian.studio', // Base URL for online documentation
};

// Config file locations to try (in order of preference)
const configLocations = [
    // Current working directory
    path.join(process.cwd(), 'midaz-mcp-config.json'),

    // User's home directory
    path.join(os.homedir(), '.midaz', 'mcp-config.json'),

    // User's config directory (platform specific)
    path.join(os.homedir(), '.config', 'midaz', 'mcp-config.json'),

    // Global config (platform specific)
    ...(process.platform === 'win32'
        ? [path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Midaz', 'mcp-config.json')]
        : ['/etc/midaz/mcp-config.json']),
];

/**
 * Parse command line arguments
 * @returns {Object} Config values from command line arguments
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const parsedArgs = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        // Handle --key=value format
        if (arg.startsWith('--') && arg.includes('=')) {
            const [key, value] = arg.substring(2).split('=');
            parsedArgs[key] = value;
            continue;
        }

        // Handle --key value format
        if (arg.startsWith('--') && i + 1 < args.length && !args[i + 1].startsWith('--')) {
            const key = arg.substring(2);
            const value = args[i + 1];
            parsedArgs[key] = value;
            i++; // Skip the next arg since we've used it as a value
            continue;
        }

        // Handle --flag format (boolean flags)
        if (arg.startsWith('--')) {
            const key = arg.substring(2);
            parsedArgs[key] = true;
        }
    }

    // Transform parsed arguments into config structure
    const configFromArgs = {};

    // Handle onboarding URL
    if (parsedArgs['onboarding-url']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.onboarding = configFromArgs.backend.onboarding || {};
        configFromArgs.backend.onboarding.baseUrl = parsedArgs['onboarding-url'];
    }

    // Handle transaction URL
    if (parsedArgs['transaction-url']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.transaction = configFromArgs.backend.transaction || {};
        configFromArgs.backend.transaction.baseUrl = parsedArgs['transaction-url'];
    }

    // For backward compatibility, support the old backend-url parameter
    if (parsedArgs['backend-url']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.onboarding = configFromArgs.backend.onboarding || {};
        configFromArgs.backend.transaction = configFromArgs.backend.transaction || {};
        configFromArgs.backend.onboarding.baseUrl = parsedArgs['backend-url'];
        configFromArgs.backend.transaction.baseUrl = parsedArgs['backend-url'];
    }

    // Handle API key (shared between both backends)
    if (parsedArgs['api-key']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.onboarding = configFromArgs.backend.onboarding || {};
        configFromArgs.backend.transaction = configFromArgs.backend.transaction || {};
        configFromArgs.backend.onboarding.apiKey = parsedArgs['api-key'];
        configFromArgs.backend.transaction.apiKey = parsedArgs['api-key'];
    }

    if (parsedArgs['timeout']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.timeout = parseInt(parsedArgs['timeout'], 10);
    }

    if (parsedArgs['retries']) {
        configFromArgs.backend = configFromArgs.backend || {};
        configFromArgs.backend.retries = parseInt(parsedArgs['retries'], 10);
    }

    if (parsedArgs['stub-mode'] !== undefined) {
        configFromArgs.useStubs = parsedArgs['stub-mode'] === 'true' || parsedArgs['stub-mode'] === true;
    }

    if (parsedArgs['log-level']) {
        configFromArgs.logLevel = parsedArgs['log-level'];
    }

    if (parsedArgs['config-file']) {
        // This doesn't directly affect the config object,
        // but will be used to load configuration from a specific file
        configFromArgs._configFile = parsedArgs['config-file'];
    }

    return configFromArgs;
}

/**
 * Auto-detect local services and update configuration
 * @param {Object} config - Configuration object to update
 */
async function autoDetectServices(config) {
    const services = [
        {
            name: 'onboarding',
            url: config.backend.onboarding.baseUrl,
            healthPath: '/health',
            apiPath: '/v1/organizations'
        },
        {
            name: 'transaction',
            url: config.backend.transaction.baseUrl,
            healthPath: '/health',
            apiPath: '/v1/health'
        }
    ];

    for (const service of services) {
        try {
            // Validate service URL to prevent file content exposure
            if (!service.url || !service.url.startsWith('http')) {
                console.warn(`Invalid service URL for ${service.name}: ${service.url}`);
                continue;
            }

            // Try health endpoint first
            const healthUrl = `${service.url}${service.healthPath}`;
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });

            if (response.ok) {
                // Auto-detected service (silent for MCP protocol)
                config.useStubs = false; // Disable stubs if any service is available
            } else {
                // Service status error (silent for MCP protocol)
            }
        } catch (error) {
            // Try API endpoint as fallback
            try {
                // Additional URL validation for API endpoint
                const apiUrl = `${service.url}${service.apiPath}`;
                if (!apiUrl.startsWith('http')) {
                    console.warn(`Invalid API URL for ${service.name}: ${apiUrl}`);
                    continue;
                }

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(2000)
                });

                if (response.ok || response.status === 404 || response.status === 401) {
                    // Auto-detected service API endpoint (silent for MCP protocol)
                    config.useStubs = false; // Disable stubs if any service is available
                } else {
                    throw new Error(`Status ${response.status}`);
                }
            } catch (apiError) {
                // Service not available (silent for MCP protocol)
            }
        }
    }

    if (config.useStubs) {
        // Using stub data mode (silent for MCP protocol)
    } else {
        // Connected to live Lerian services (silent for MCP protocol)
    }
}

/**
 * Load configuration from the first available config file
 * or return default config if no config file is found
 */
async function loadConfig() {
    let loadedConfig = null;
    let configSource = 'default';

    // Parse command line arguments first (highest priority)
    const argsConfig = parseCommandLineArgs();

    // If a specific config file is provided via command line, try to load it
    if (argsConfig._configFile) {
        try {
            if (fs.existsSync(argsConfig._configFile)) {
                const fileContent = fs.readFileSync(argsConfig._configFile, 'utf8');
                const fileConfig = JSON.parse(fileContent);

                loadedConfig = {
                    ...defaultConfig,
                    ...fileConfig,
                    backend: {
                        ...defaultConfig.backend,
                        ...(fileConfig.backend || {}),
                        onboarding: {
                            ...defaultConfig.backend.onboarding,
                            ...(fileConfig.backend?.onboarding || {}),
                        },
                        transaction: {
                            ...defaultConfig.backend.transaction,
                            ...(fileConfig.backend?.transaction || {}),
                        },
                    },
                    ...argsConfig, // Command line args override file config
                    _source: argsConfig._configFile,
                };
                configSource = argsConfig._configFile;

                // Remove the internal _configFile property
                delete loadedConfig._configFile;
                return loadedConfig;
            }
        } catch (err) {
            // Error loading config file (silent for MCP protocol)
        }
    }

    // Try to load from environment variables next
    const envConfig = {
        backend: {
            onboarding: {
                ...(process.env.MIDAZ_ONBOARDING_URL && { baseUrl: process.env.MIDAZ_ONBOARDING_URL }),
                ...(process.env.MIDAZ_API_KEY && { apiKey: process.env.MIDAZ_API_KEY }),
            },
            transaction: {
                ...(process.env.MIDAZ_TRANSACTION_URL && { baseUrl: process.env.MIDAZ_TRANSACTION_URL }),
                ...(process.env.MIDAZ_API_KEY && { apiKey: process.env.MIDAZ_API_KEY }),
            },
            ...(process.env.MIDAZ_BACKEND_TIMEOUT && { timeout: parseInt(process.env.MIDAZ_BACKEND_TIMEOUT, 10) }),
            ...(process.env.MIDAZ_BACKEND_RETRIES && { retries: parseInt(process.env.MIDAZ_BACKEND_RETRIES, 10) }),
        },
        ...(process.env.MIDAZ_USE_STUBS !== undefined && { useStubs: process.env.MIDAZ_USE_STUBS === 'true' }),
        ...(process.env.MIDAZ_LOG_LEVEL && { logLevel: process.env.MIDAZ_LOG_LEVEL }),
    };

    // For backward compatibility, check for the old MIDAZ_BACKEND_URL
    if (process.env.MIDAZ_BACKEND_URL) {
        envConfig.backend.onboarding.baseUrl = process.env.MIDAZ_BACKEND_URL;
        envConfig.backend.transaction.baseUrl = process.env.MIDAZ_BACKEND_URL;
    }

    // Only use environment config if at least one value is set
    const hasEnvConfig =
        (envConfig.backend.onboarding.baseUrl !== undefined ||
            envConfig.backend.onboarding.apiKey !== undefined ||
            envConfig.backend.transaction.baseUrl !== undefined ||
            envConfig.backend.transaction.apiKey !== undefined ||
            envConfig.backend.timeout !== undefined ||
            envConfig.backend.retries !== undefined) ||
        Object.keys(envConfig).filter(key => key !== 'backend').length > 0;

    if (hasEnvConfig) {
        loadedConfig = {
            ...defaultConfig,
            ...envConfig,
            backend: {
                ...defaultConfig.backend,
                ...(envConfig.backend || {}),
                onboarding: {
                    ...defaultConfig.backend.onboarding,
                    ...(envConfig.backend?.onboarding || {}),
                },
                transaction: {
                    ...defaultConfig.backend.transaction,
                    ...(envConfig.backend?.transaction || {}),
                },
            },
            ...argsConfig, // Command line args override environment variables
            _source: 'environment',
        };
        configSource = 'environment';
    }

    // If no config from env vars or a specific file, try to load from config files
    if (!loadedConfig) {
        for (const configPath of configLocations) {
            try {
                if (fs.existsSync(configPath)) {
                    const fileContent = fs.readFileSync(configPath, 'utf8');
                    const fileConfig = JSON.parse(fileContent);

                    loadedConfig = {
                        ...defaultConfig,
                        ...fileConfig,
                        backend: {
                            ...defaultConfig.backend,
                            ...(fileConfig.backend || {}),
                            onboarding: {
                                ...defaultConfig.backend.onboarding,
                                ...(fileConfig.backend?.onboarding || {}),
                            },
                            transaction: {
                                ...defaultConfig.backend.transaction,
                                ...(fileConfig.backend?.transaction || {}),
                            },
                        },
                        ...argsConfig, // Command line args override file config
                        _source: configPath,
                    };
                    configSource = configPath;
                    break;
                }
            } catch (err) {
                // Continue to next config location on error
                // Error loading config from path (silent for MCP protocol)
            }
        }
    }

    // Fall back to default config if nothing was loaded
    if (!loadedConfig) {
        loadedConfig = {
            ...defaultConfig,
            ...argsConfig, // Apply any command line args over defaults
            _source: 'default',
        };
    }

    // MCP server config source (silent for MCP protocol)

    // Auto-detect local services if enabled
    if (loadedConfig.autoDetect) {
        await autoDetectServices(loadedConfig);
    }

    // Remove the internal _configFile property if it exists
    if (loadedConfig._configFile) {
        delete loadedConfig._configFile;
    }

    return loadedConfig;
}

// Export the loadConfig function and a promise for the loaded config
export const configPromise = loadConfig();
export { loadConfig };

// For backward compatibility, export a default that will be resolved
/**
 * Validate config file path to prevent path traversal attacks
 */
function validateConfigPath(configPath) {
    if (!configPath || typeof configPath !== 'string') {
        return true;
    }

    import('path').then(path => {
        // Sanitize input to prevent path traversal
        const sanitizedPath = configPath.replace(/\.\./g, '').replace(/\/\//g, '/');
        const resolvedPath = path.resolve(sanitizedPath);
        const allowedDirs = [process.cwd(), '/etc/lerian', '/etc/midaz']; // backward compatibility
        const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(path.resolve(dir)));

        if (!isAllowed) {
            throw new Error(`Config path not allowed: ${configPath}`);
        }
    });

    return true;
}

export default await configPromise; 