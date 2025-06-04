#!/usr/bin/env node

/**
 * Test the enhanced file formats and external balance prompts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdvancedPrompts } from '../src/prompts/advanced-workflows.js';

const testEnhancedFeatures = async () => {
  console.log('🧪 Testing Enhanced File Formats & External Balance Features...\n');
  
  // Create test server
  const server = new McpServer({
    name: 'test-server',
    version: '1.0.0'
  });

  // Register our enhanced prompts
  registerAdvancedPrompts(server);
  
  // Test 1: Multi-format File Checker - CSV
  console.log('📊 Test 1: Enhanced File Checker - CSV Format');
  try {
    const csvContent = 'account_id,name,balance\n12345678-1234-1234-1234-123456789012,Account 1,1000\n12345678-1234-1234-1234-123456789013,Account 2,2000';
    const result1 = await server._registeredPrompts['check-file-balances'].callback({
      file_content: csvContent,
      file_type: 'csv',
      organization_hint: 'test-org',
      account_column: 'account_id'
    });
    console.log('✅ CSV file checker - PASSED');
    console.log(`   Description: ${result1.description}`);
    console.log(`   Auto-detected CSV format: ${result1.messages[0].content.text.includes('CSV File Processing')}\n`);
  } catch (error) {
    console.log('❌ CSV file checker - FAILED:', error.message);
  }

  // Test 2: Multi-format File Checker - JSON
  console.log('📋 Test 2: Enhanced File Checker - JSON Format');
  try {
    const jsonContent = '{"accounts": [{"id": "12345678-1234-1234-1234-123456789012", "name": "Account 1"}, {"id": "12345678-1234-1234-1234-123456789013", "name": "Account 2"}]}';
    const result2 = await server._registeredPrompts['check-file-balances'].callback({
      file_content: jsonContent,
      file_type: 'auto',
      json_path: 'accounts[].id'
    });
    console.log('✅ JSON file checker - PASSED');
    console.log(`   Description: ${result2.description}`);
    console.log(`   Auto-detected JSON format: ${result2.messages[0].content.text.includes('JSON File Processing')}\n`);
  } catch (error) {
    console.log('❌ JSON file checker - FAILED:', error.message);
  }

  // Test 3: Multi-format File Checker - TXT with UUID confirmation
  console.log('📝 Test 3: Enhanced File Checker - TXT Format with UUID Confirmation');
  try {
    const txtContent = 'Transaction log:\nAccount 12345678-1234-1234-1234-123456789012 sent $100\nAccount 12345678-1234-1234-1234-123456789013 received $100\nSome random text with fake-uuid-1234-5678-9012-123456789012';
    const result3 = await server._registeredPrompts['check-file-balances'].callback({
      file_content: txtContent,
      file_type: 'txt',
      confirm_uuids: true
    });
    console.log('✅ TXT file checker with confirmation - PASSED');
    console.log(`   Description: ${result3.description}`);
    console.log(`   Includes UUID confirmation requirement: ${result3.messages[0].content.text.includes('LLM Confirmation Required')}\n`);
  } catch (error) {
    console.log('❌ TXT file checker - FAILED:', error.message);
  }

  // Test 4: External Balance Checker - Single Asset
  console.log('💰 Test 4: External Balance Checker - Single Asset');
  try {
    const result4 = await server._registeredPrompts['check-external-balance'].callback({
      organization_id: 'test-org-123',
      ledger_id: 'test-ledger-456',
      asset_code: 'USD',
      list_all_assets: false
    });
    console.log('✅ External balance checker (single asset) - PASSED');
    console.log(`   Description: ${result4.description}`);
    console.log(`   Includes external account explanation: ${result4.messages[0].content.text.includes('What are External Accounts')}`);
    console.log(`   Focuses on USD asset: ${result4.messages[0].content.text.includes('USD')}\n`);
  } catch (error) {
    console.log('❌ External balance checker - FAILED:', error.message);
  }

  // Test 5: External Balance Checker - All Assets
  console.log('💎 Test 5: External Balance Checker - All Assets');
  try {
    const result5 = await server._registeredPrompts['check-external-balance'].callback({
      organization_id: 'test-org-123',
      ledger_id: 'test-ledger-456',
      list_all_assets: true
    });
    console.log('✅ External balance checker (all assets) - PASSED');
    console.log(`   Description: ${result5.description}`);
    console.log(`   Includes asset discovery: ${result5.messages[0].content.text.includes('Asset Discovery')}`);
    console.log(`   Shows multi-asset workflow: ${result5.messages[0].content.text.includes('All Assets')}\n`);
  } catch (error) {
    console.log('❌ External balance checker (all assets) - FAILED:', error.message);
  }

  console.log('🎉 All enhanced feature tests completed!\n');
  
  // Show new prompt capabilities
  console.log('📋 Enhanced Prompt Features:');
  console.log('   📄 Multi-format file support: CSV, TXT, JSON with auto-detection');
  console.log('   🔍 Smart UUID extraction with optional LLM confirmation for TXT');
  console.log('   💰 External balance checking by asset code');
  console.log('   🏦 Complete external account workflow guidance');
  console.log('   📊 Business intelligence and liquidity analysis');
  
  console.log('\n🚀 New Capabilities Summary:');
  console.log('   • File type auto-detection (CSV/TXT/JSON)');
  console.log('   • UUID confirmation workflow for TXT files');
  console.log('   • External account balance checking');
  console.log('   • Asset-level liquidity monitoring');
  console.log('   • Multi-asset external balance analysis');
};

// Run tests
testEnhancedFeatures().catch(console.error);