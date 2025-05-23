#!/usr/bin/env node

/**
 * Test script to demonstrate the MCP server logging functionality
 */

import { createLogger, logLifecycleEvent, logConfigEvent, getLoggingConfig } from '../src/util/mcp-logging.js';

console.log('🔍 Testing Midaz MCP Server Logging');
console.log('=====================================\n');

// Show current logging configuration
const config = getLoggingConfig();
console.log('📋 Current Logging Configuration:');
console.log(`   Log Level: ${config.logLevel}`);
console.log(`   Console Logging: ${config.consoleLogging}`);
console.log(`   Detailed Logging: ${config.detailedLogging}`);
console.log(`   Available Levels: ${config.availableLevels.join(', ')}`);
console.log();

// Create a test logger
const logger = createLogger('test-component');

// Test different log levels
console.log('🔤 Testing different log levels:');
logger.debug('This is a debug message', { component: 'test', action: 'debug' });
logger.info('This is an info message', { component: 'test', action: 'info' });
logger.notice('This is a notice message', { component: 'test', action: 'notice' });
logger.warning('This is a warning message', { component: 'test', action: 'warning' });
logger.error('This is an error message', { component: 'test', action: 'error' });

// Test lifecycle events
console.log('\n🔄 Testing lifecycle events:');
logLifecycleEvent('test_started', { test: 'logging', timestamp: new Date().toISOString() });
logLifecycleEvent('test_completed', { success: true, duration: '5ms' });

// Test config events
console.log('\n⚙️ Testing config events:');
logConfigEvent('test_config_loaded', { setting: 'debug_mode', value: true });
logConfigEvent('test_config_updated', { setting: 'log_level', oldValue: 'info', newValue: 'debug' });

console.log('\n✅ Logging test completed!');
console.log('\n💡 Environment variables to control logging:');
console.log('   MIDAZ_LOG_LEVEL=debug|info|warning|error (default: info)');
console.log('   MIDAZ_CONSOLE_LOGS=true|false (default: true)');
console.log('   MIDAZ_DETAILED_LOGS=true|false (default: false)');
console.log('');
console.log('📁 Configuration files:');
console.log('   Copy .env.example to .env for environment variables');
console.log('   Update midaz-mcp-config.json for JSON-based configuration');
console.log('   Environment variables override JSON configuration');