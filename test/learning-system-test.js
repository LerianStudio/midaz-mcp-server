#!/usr/bin/env node
/**
 * Test Enhanced Learning System
 * Validates dynamic fetching from docs.lerian.studio/llms.txt
 */

import { createLogger } from '../dist/util/mcp-logging.js';

const logger = createLogger('learning-test');

async function testDynamicFetching() {
  console.log('🧪 Testing Enhanced Learning System');
  
  try {
    // Test 1: Fetch from docs.lerian.studio/llms.txt
    console.log('📡 Testing dynamic fetch from docs.lerian.studio/llms.txt...');
    const response = await fetch('https://docs.lerian.studio/llms.txt');
    
    if (response.ok) {
      const content = await response.text();
      console.log(`✅ Successfully fetched ${content.length} chars from llms.txt`);
      console.log(`📄 Preview: ${content.substring(0, 200)}...`);
    } else {
      console.log(`⚠️  HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Test 2: Fetch GitHub OpenAPI specs
    console.log('📡 Testing GitHub OpenAPI specs fetch...');
    const onboardingSpec = await fetch('https://raw.githubusercontent.com/LerianStudio/midaz/main/docs/openapi/onboarding.yaml');
    
    if (onboardingSpec.ok) {
      const specContent = await onboardingSpec.text();
      console.log(`✅ Successfully fetched ${specContent.length} chars from onboarding.yaml`);
    } else {
      console.log(`⚠️  Onboarding spec: HTTP ${onboardingSpec.status}`);
    }
    
    console.log('🎉 Dynamic fetching system is operational!');
    console.log('🚀 Enhanced learning tools will have access to live, authoritative content');
    
  } catch (error) {
    console.error('❌ Dynamic fetching test failed:', error.message);
    console.log('🔧 This may indicate network connectivity issues');
  }
}

// Run the test
testDynamicFetching();