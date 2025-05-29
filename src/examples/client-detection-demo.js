/**
 * Client Detection System Demo
 * Demonstrates comprehensive client detection, adaptation, and configuration
 */

import { createLogger } from '../util/mcp-logging.js';
import { detectClient, ClientPatterns } from '../util/client-detection.js';
import { adaptationManager } from '../util/client-adaptation.js';
import { configManager } from '../util/client-config.js';
import { toolRegistry } from '../util/tool-registry.js';
import { ResponseFormatter } from '../util/response-formatter.js';

const logger = createLogger('client-demo');

/**
 * Demo function to showcase client detection capabilities
 */
export async function runClientDetectionDemo() {
  console.log('\n🎯 Midaz MCP Client Detection System Demo\n');
  
  // Demo 1: Client Detection
  await demoClientDetection();
  
  // Demo 2: Tool Filtering
  await demoToolFiltering();
  
  // Demo 3: Response Formatting
  await demoResponseFormatting();
  
  // Demo 4: Adaptive Configuration
  await demoAdaptiveConfiguration();
  
  // Demo 5: Configuration Management
  await demoConfigurationManagement();
  
  console.log('\n✅ Client Detection Demo Complete\n');
}

/**
 * Demo client detection with various scenarios
 */
async function demoClientDetection() {
  console.log('📱 Demo 1: Client Detection\n');
  
  const testCases = [
    {
      name: 'Claude Desktop',
      connectionInfo: {
        userAgent: 'Claude Desktop/1.0.0',
        headers: { 'x-client-name': 'claude-desktop' }
      }
    },
    {
      name: 'VS Code Extension',
      connectionInfo: {
        userAgent: 'Visual Studio Code/1.85.0',
        environment: { VSCODE_PID: '12345' }
      }
    },
    {
      name: 'Cursor Editor',
      connectionInfo: {
        clientName: 'Cursor',
        userAgent: 'Cursor/0.29.0'
      }
    },
    {
      name: 'Unknown Client',
      connectionInfo: {
        userAgent: 'CustomMCP/1.0.0'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    const client = detectClient(testCase.connectionInfo);
    console.log(`  - Detected: ${client.client.name}`);
    console.log(`  - Method: ${client.detectionMethod}`);
    console.log(`  - Complexity: ${client.capabilities.toolComplexity}`);
    console.log(`  - Max Tools: ${client.capabilities.maxToolsPerCall}`);
    console.log(`  - Max Response: ${client.capabilities.maxResponseSize}\n`);
  }
}

/**
 * Demo tool filtering based on client capabilities
 */
async function demoToolFiltering() {
  console.log('🔧 Demo 2: Tool Filtering\n');
  
  // Register some demo tools
  const demoTools = [
    { name: 'simple-balance', complexity: 'low', requiresBinaryContent: false },
    { name: 'complex-analysis', complexity: 'high', requiresBinaryContent: true },
    { name: 'portfolio-report', complexity: 'medium', requiresImages: true },
    { name: 'account-search', complexity: 'medium', requiresBinaryContent: false }
  ];
  
  demoTools.forEach(tool => {
    toolRegistry.register(
      tool.name,
      { name: tool.name, description: `Demo tool: ${tool.name}` },
      async () => ({ result: 'demo' }),
      tool
    );
  });
  
  // Test with different clients
  const clients = [
    detectClient({ userAgent: 'ZeroCode/1.0.0' }), // Low complexity
    detectClient({ userAgent: 'Cursor/1.0.0' }),    // Medium complexity
    detectClient({ userAgent: 'Claude Desktop/1.0.0' }) // High complexity
  ];
  
  for (const client of clients) {
    console.log(`Client: ${client.client.name}`);
    adaptationManager.setClientContext(client);
    
    const filteredTools = toolRegistry.getFilteredTools(client);
    console.log(`  - Available tools: ${filteredTools.map(t => t.name).join(', ')}`);
    console.log(`  - Filtered: ${demoTools.length - filteredTools.length} tools removed\n`);
  }
}

/**
 * Demo response formatting for different clients
 */
async function demoResponseFormatting() {
  console.log('📄 Demo 3: Response Formatting\n');
  
  const sampleData = {
    accounts: [
      { id: 'acc1', name: 'Checking', balance: 1250.75, currency: 'USD' },
      { id: 'acc2', name: 'Savings', balance: 5000.00, currency: 'USD' }
    ],
    total: 6250.75,
    lastUpdated: new Date().toISOString()
  };
  
  const clients = [
    { client: detectClient({ userAgent: 'Continue/1.0.0' }), format: 'minimal' },
    { client: detectClient({ userAgent: 'Cursor/1.0.0' }), format: 'concise' },
    { client: detectClient({ userAgent: 'VS Code/1.0.0' }), format: 'developer' }
  ];
  
  for (const { client, format } of clients) {
    console.log(`Client: ${client.client.name} (${format} format)`);
    
    const formatter = new ResponseFormatter(client);
    const formatted = formatter.format(sampleData, { type: 'json' });
    
    console.log('  Response preview:');
    const preview = JSON.stringify(formatted.content[0].text, null, 2);
    console.log(`    ${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}\n`);
  }
}

/**
 * Demo adaptive configuration based on behavior
 */
async function demoAdaptiveConfiguration() {
  console.log('⚡ Demo 4: Adaptive Configuration\n');
  
  const client = detectClient({ userAgent: 'Cursor/1.0.0' });
  const clientId = client.client.id;
  
  console.log(`Initial configuration for ${client.client.name}:`);
  const initialConfig = configManager.getConfig(clientId);
  console.log(`  - Max tools: ${initialConfig.maxToolsPerCall}`);
  console.log(`  - Timeout: ${initialConfig.timeoutMs}ms`);
  console.log(`  - Output format: ${initialConfig.outputFormat}\n`);
  
  // Simulate high error rate behavior
  console.log('Simulating high error rate behavior...');
  const behaviorData = {
    errorRate: 0.25,
    avgResponseTime: 8000,
    avgResponseSize: 60000
  };
  
  configManager.updateAdaptiveSettings(clientId, behaviorData);
  
  console.log('Updated configuration:');
  const updatedConfig = configManager.getConfig(clientId);
  console.log(`  - Max tools: ${updatedConfig.maxToolsPerCall}`);
  console.log(`  - Timeout: ${updatedConfig.timeoutMs}ms`);
  console.log(`  - Output format: ${updatedConfig.outputFormat}\n`);
}

/**
 * Demo configuration management features
 */
async function demoConfigurationManagement() {
  console.log('⚙️ Demo 5: Configuration Management\n');
  
  // Demo configuration templates
  console.log('Available configuration templates:');
  const templates = ['minimal', 'standard', 'advanced', 'mobile', 'enterprise'];
  
  for (const template of templates) {
    const config = configManager.getTemplate(template);
    console.log(`  - ${template}: ${config.maxToolsPerCall} tools, ${config.toolComplexity} complexity`);
  }
  
  console.log('\nConfiguration Statistics:');
  const stats = configManager.getStats();
  console.log(`  - Total configurations: ${stats.totalConfigs}`);
  console.log(`  - Active overrides: ${stats.totalOverrides}`);
  console.log(`  - Adaptive clients: ${stats.adaptiveClients}`);
  console.log('  - Complexity distribution:', stats.configsByComplexity);
  
  // Demo custom client registration
  console.log('\nRegistering custom client configuration...');
  const customConfig = {
    id: 'custom-client',
    name: 'Custom MCP Client',
    maxToolsPerCall: 15,
    toolComplexity: 'high',
    outputFormat: 'structured',
    features: { analytics: true }
  };
  
  try {
    configManager.registerClient(customConfig);
    console.log('✅ Custom client registered successfully');
  } catch (error) {
    console.log(`❌ Registration failed: ${error.message}`);
  }
  
  // Demo export/import
  console.log('\nExporting configuration...');
  const exported = configManager.exportConfig('cursor');
  console.log(`✅ Configuration exported (${Object.keys(exported.config).length} properties)`);
}

/**
 * Interactive demo runner
 */
export async function runInteractiveDemo() {
  console.log('🎮 Interactive Client Detection Demo');
  console.log('Test your own user agent strings!\n');
  
  // This would typically be called from a CLI or test environment
  const testUserAgents = [
    'Claude Desktop/1.2.0 (macOS)',
    'Mozilla/5.0 Cursor/0.30.0',
    'Visual Studio Code/1.85.0',
    'Windsurf/1.0.0',
    'CustomApp/2.1.0'
  ];
  
  for (const userAgent of testUserAgents) {
    console.log(`Testing: "${userAgent}"`);
    const client = detectClient({ userAgent });
    console.log(`  Result: ${client.client.name} (${client.detectionMethod})`);
    console.log(`  Capabilities: ${JSON.stringify({
      complexity: client.capabilities.toolComplexity,
      maxTools: client.capabilities.maxToolsPerCall,
      binary: client.capabilities.supportsBinaryContent,
      images: client.capabilities.supportsImages
    })}\n`);
  }
}

// Export for use in tests or development
export default {
  runClientDetectionDemo,
  runInteractiveDemo
};

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runClientDetectionDemo().catch(console.error);
}