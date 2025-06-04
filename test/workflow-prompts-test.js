#!/usr/bin/env node

/**
 * Test the enhanced workflow prompts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWorkflowPrompts } from '../src/prompts/midaz-workflows.js';

const testPrompts = async () => {
  console.log('🧪 Testing Enhanced Workflow Prompts...\n');
  
  // Create test server
  const server = new McpServer({
    name: 'test-server',
    version: '1.0.0'
  });

  // Register our workflow prompts
  registerWorkflowPrompts(server);
  
  // Test 1: Transaction Wizard - Step 1
  console.log('📝 Test 1: Transaction Creation Wizard (Step 1)');
  try {
    const result1 = await server._registeredPrompts['create-transaction-wizard'].callback({
      transaction_type: 'transfer',
      step: 1
    });
    console.log('✅ Transaction wizard step 1 - PASSED');
    console.log(`   Description: ${result1.description}`);
    console.log(`   Content length: ${result1.messages[0].content.text.length} chars\n`);
  } catch (error) {
    console.log('❌ Transaction wizard step 1 - FAILED:', error.message);
  }

  // Test 2: Balance Debugging
  console.log('🔍 Test 2: Balance Debugging Assistant');
  try {
    const result2 = await server._registeredPrompts['debug-my-balance'].callback({
      organization_id: 'test-org-123',
      ledger_id: 'test-ledger-456',
      issue_type: 'wrong_balance'
    });
    console.log('✅ Balance debugging - PASSED');
    console.log(`   Description: ${result2.description}`);
    console.log(`   Content includes diagnostic steps: ${result2.messages[0].content.text.includes('Diagnostic Steps')}\n`);
  } catch (error) {
    console.log('❌ Balance debugging - FAILED:', error.message);
  }

  // Test 3: Organization Setup
  console.log('🏗️ Test 3: Organization Setup Wizard');
  try {
    const result3 = await server._registeredPrompts['setup-my-org'].callback({
      org_name: 'Test Fintech Co',
      business_type: 'fintech',
      setup_stage: 'planning'
    });
    console.log('✅ Organization setup - PASSED');
    console.log(`   Description: ${result3.description}`);
    console.log(`   Content includes fintech recommendations: ${result3.messages[0].content.text.includes('Fintech Setup')}\n`);
  } catch (error) {
    console.log('❌ Organization setup - FAILED:', error.message);
  }

  // Test 4: Data Explanation
  console.log('📊 Test 4: Data Explanation Assistant');
  try {
    const result4 = await server._registeredPrompts['explain-my-data'].callback({
      organization_id: 'test-org-123',
      analysis_type: 'overview',
      time_period: 'month'
    });
    console.log('✅ Data explanation - PASSED');
    console.log(`   Description: ${result4.description}`);
    console.log(`   Content includes analysis steps: ${result4.messages[0].content.text.includes('Analysis Steps')}\n`);
  } catch (error) {
    console.log('❌ Data explanation - FAILED:', error.message);
  }

  console.log('🎉 All prompt tests completed!\n');
  
  // Show registered prompts
  console.log('📋 Registered Prompts:');
  Object.keys(server._registeredPrompts).forEach(promptName => {
    const prompt = server._registeredPrompts[promptName];
    console.log(`   • ${promptName}: ${prompt.description || 'No description'}`);
  });
};

// Run tests
testPrompts().catch(console.error);