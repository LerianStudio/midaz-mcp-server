#!/usr/bin/env node

/**
 * Test the advanced workflow prompts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdvancedPrompts } from '../src/prompts/advanced-workflows.js';

const testAdvancedPrompts = async () => {
  console.log('🧪 Testing Advanced Workflow Prompts...\n');
  
  // Create test server
  const server = new McpServer({
    name: 'test-server',
    version: '1.0.0'
  });

  // Register our advanced prompts
  registerAdvancedPrompts(server);
  
  // Test 1: File Balance Checker
  console.log('📊 Test 1: File Balance Checker');
  try {
    const result1 = await server._registeredPrompts['check-file-balances'].callback({
      file_content: 'account_id,name,type\n12345678-1234-1234-1234-123456789012,Customer Account,asset\n12345678-1234-1234-1234-123456789013,Merchant Account,asset',
      organization_hint: 'test-org',
      account_column: 'account_id'
    });
    console.log('✅ File balance checker - PASSED');
    console.log(`   Description: ${result1.description}`);
    console.log(`   Content includes CSV analysis: ${result1.messages[0].content.text.includes('CSV Analysis')}\n`);
  } catch (error) {
    console.log('❌ File balance checker - FAILED:', error.message);
  }

  // Test 2: Hierarchy Discovery
  console.log('🔍 Test 2: Midaz Hierarchy Discovery');
  try {
    const result2 = await server._registeredPrompts['discover-midaz-hierarchy'].callback({
      discovery_level: 'full',
      show_counts: true,
      include_metadata: false
    });
    console.log('✅ Hierarchy discovery - PASSED');
    console.log(`   Description: ${result2.description}`);
    console.log(`   Content includes discovery workflow: ${result2.messages[0].content.text.includes('Discovery Workflow')}\n`);
  } catch (error) {
    console.log('❌ Hierarchy discovery - FAILED:', error.message);
  }

  // Test 3: Tools Catalog
  console.log('🛠️ Test 3: Complete Tools Catalog');
  try {
    const result3 = await server._registeredPrompts['show-all-tools'].callback({
      category_filter: 'all',
      detail_level: 'detailed',
      show_parameters: true,
      show_examples: false
    });
    console.log('✅ Tools catalog - PASSED');
    console.log(`   Description: ${result3.description}`);
    console.log(`   Content includes financial tools: ${result3.messages[0].content.text.includes('Financial API Tools')}`);
    console.log(`   Content includes workflow prompts: ${result3.messages[0].content.text.includes('Workflow Prompts')}\n`);
  } catch (error) {
    console.log('❌ Tools catalog - FAILED:', error.message);
  }

  // Test 4: Focused Discovery
  console.log('🎯 Test 4: Focused Organization Discovery');
  try {
    const result4 = await server._registeredPrompts['discover-midaz-hierarchy'].callback({
      discovery_level: 'ledgers',
      organization_id: 'test-org-123',
      show_counts: false
    });
    console.log('✅ Focused discovery - PASSED');
    console.log(`   Description: ${result4.description}`);
    console.log(`   Content focused on ledgers: ${result4.messages[0].content.text.includes('Ledgers Discovery')}\n`);
  } catch (error) {
    console.log('❌ Focused discovery - FAILED:', error.message);
  }

  console.log('🎉 All advanced prompt tests completed!\n');
  
  // Show all registered prompts
  console.log('📋 Registered Advanced Prompts:');
  Object.keys(server._registeredPrompts).forEach(promptName => {
    const prompt = server._registeredPrompts[promptName];
    console.log(`   • ${promptName}: ${prompt.description || 'No description'}`);
  });
  
  console.log('\n🚀 Advanced Features Summary:');
  console.log('   • CSV file analysis with intelligent UUID extraction');
  console.log('   • Hierarchical discovery with chained operations');
  console.log('   • Comprehensive tools documentation');
  console.log('   • Smart organization/ledger auto-detection');
  console.log('   • Multi-level filtering and analysis options');
};

// Run tests
testAdvancedPrompts().catch(console.error);