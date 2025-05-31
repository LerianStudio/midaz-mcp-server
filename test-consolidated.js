/**
 * Test script for consolidated Midaz MCP tools
 * Tests the 4 scenarios specified in the requirements
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the tools for testing
const testServer = {
  tool: (name, description, schema, handler) => {
    console.log(`✅ Tool registered: ${name}`);
    console.log(`   Description: ${description}`);
    return {
      name,
      handler,
      test: async (args) => {
        console.log(`\n🧪 Testing ${name} with args:`, JSON.stringify(args, null, 2));
        try {
          const result = await handler(args, {});
          console.log(`✅ ${name} result:`, JSON.stringify(result, null, 2));
          return result;
        } catch (error) {
          console.log(`❌ ${name} error:`, error.message);
          return { error: error.message };
        }
      }
    };
  }
};

// Test scenarios
async function runTests() {
  console.log('🚀 Testing Consolidated Midaz MCP Tools\n');
  
  try {
    // Import and register tools
    const { registerMidazDocsTools } = await import('./src/tools/midaz-docs.js');
    const { registerMidazApiTools } = await import('./src/tools/midaz-api.js');
    const { registerMidazGenerateTools } = await import('./src/tools/midaz-generate.js');
    const { registerMidazStatusTools } = await import('./src/tools/midaz-status.js');
    
    console.log('📚 Registering tools...');
    registerMidazDocsTools(testServer);
    registerMidazApiTools(testServer);
    registerMidazGenerateTools(testServer);
    registerMidazStatusTools(testServer);
    
    console.log('\n🎯 Running test scenarios...\n');
    
    // Scenario 1: "how do i create a transaction?" - should return guide + code
    console.log('📖 SCENARIO 1: Documentation search for transaction creation');
    await testServer.tools?.find(t => t.name === 'midaz_docs')?.test({
      query: 'how do i create a transaction',
      section: 'guides',
      format: 'detailed'
    });
    
    // Scenario 2: "list my organizations" - should make real api call  
    console.log('\n🌐 SCENARIO 2: Real API call to list organizations');
    await testServer.tools?.find(t => t.name === 'midaz_api')?.test({
      operation: 'list',
      resource: 'organizations',
      mode: 'test', // Use test mode for safety
      params: {}
    });
    
    // Scenario 3: "generate nodejs payment flow" - should output complete implementation
    console.log('\n⚡ SCENARIO 3: Generate Node.js payment flow code');
    await testServer.tools?.find(t => t.name === 'midaz_generate')?.test({
      useCase: 'nodejs payment flow',
      language: 'javascript',
      complexity: 'production',
      features: ['error-handling', 'retries', 'logging']
    });
    
    // Scenario 4: "what's wrong with midaz?" - should show actual metrics
    console.log('\n🔍 SCENARIO 4: Health and status monitoring');
    await testServer.tools?.find(t => t.name === 'midaz_status')?.test({
      check: 'all',
      includeMetrics: true,
      timeWindow: '15m'
    });
    
    console.log('\n✅ All scenario tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Store tools for testing
testServer.tools = [];
const originalTool = testServer.tool;
testServer.tool = (name, description, schema, handler) => {
  const tool = originalTool(name, description, schema, handler);
  testServer.tools.push(tool);
  return tool;
};

runTests();
