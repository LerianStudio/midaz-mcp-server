#!/usr/bin/env node
/**
 * MCP Inspector Tests
 * 
 * This script provides automated testing of MCP tools
 * for development and debugging purposes.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test scenarios
const testScenarios = [
  {
    name: 'List Resources',
    command: 'resources',
    expected: ['models', 'components', 'infra', 'docs']
  },
  {
    name: 'List Tools',
    command: 'tools',
    expected: ['list-organizations', 'get-organization', 'list-ledgers']
  },
  {
    name: 'Test Organization List',
    command: 'call list-organizations',
    args: { limit: 5 },
    validateResponse: (response) => {
      return response && response.items && Array.isArray(response.items);
    }
  },
  {
    name: 'Test Organization Get',
    command: 'call get-organization',
    args: { id: '00000000-0000-0000-0000-000000000001' },
    validateResponse: (response) => {
      return response && response.id && response.legalName;
    }
  },
  {
    name: 'Test Pagination',
    command: 'call list-accounts',
    args: { 
      organizationId: '00000000-0000-0000-0000-000000000001',
      ledgerId: '00000000-0000-0000-0000-000000000001',
      limit: 2 
    },
    validateResponse: (response) => {
      return response && response.items && response.items.length <= 2;
    }
  },
  {
    name: 'Test Error Handling',
    command: 'call get-organization',
    args: { id: 'invalid-uuid' },
    expectError: true,
    validateError: (error) => {
      return error && error.code === -32602; // Invalid params
    }
  },
  {
    name: 'Test Resource Loading',
    command: 'read midaz://models/account',
    validateResponse: (response) => {
      return response && response.includes('Account Model');
    }
  }
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Run a single test scenario
async function runTest(scenario) {
  console.log(`\n${colors.blue}Running: ${scenario.name}${colors.reset}`);
  console.log(`${colors.gray}Command: ${scenario.command}${colors.reset}`);
  
  if (scenario.args) {
    console.log(`${colors.gray}Args: ${JSON.stringify(scenario.args)}${colors.reset}`);
  }

  return new Promise((resolve) => {
    const serverPath = join(__dirname, '..', 'dist', 'index.js');
    const inspectorPath = join(__dirname, 'mcp-inspector-esm.js');
    
    // Build command
    let fullCommand = scenario.command;
    if (scenario.args) {
      fullCommand += ' ' + JSON.stringify(scenario.args);
    }

    // Spawn inspector process
    const inspector = spawn('node', [
      inspectorPath,
      serverPath,
      fullCommand
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    inspector.stdout.on('data', (data) => {
      output += data.toString();
    });

    inspector.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    inspector.on('close', (code) => {
      try {
        // Parse response
        const lines = output.split('\n').filter(line => line.trim());
        const lastLine = lines[lines.length - 1];
        
        let result;
        if (lastLine && (lastLine.startsWith('{') || lastLine.startsWith('['))) {
          result = JSON.parse(lastLine);
        } else {
          result = output.trim();
        }

        // Validate response
        let passed = false;
        let message = '';

        if (scenario.expectError) {
          // Check if error occurred
          const hasError = code !== 0 || errorOutput.includes('Error');
          if (hasError && scenario.validateError) {
            // Try to parse error from output
            try {
              const errorMatch = errorOutput.match(/\{.*"code".*\}/);
              if (errorMatch) {
                const error = JSON.parse(errorMatch[0]);
                passed = scenario.validateError(error);
                message = passed ? 'Error handled correctly' : 'Unexpected error format';
              }
            } catch (e) {
              passed = false;
              message = 'Could not parse error response';
            }
          } else {
            passed = hasError;
            message = hasError ? 'Error occurred as expected' : 'Expected error but got success';
          }
        } else if (scenario.validateResponse) {
          passed = scenario.validateResponse(result);
          message = passed ? 'Response validated successfully' : 'Response validation failed';
        } else if (scenario.expected) {
          // Check if expected values are present
          const resultStr = JSON.stringify(result);
          passed = scenario.expected.every(exp => resultStr.includes(exp));
          message = passed ? 'All expected values found' : 'Some expected values missing';
        } else {
          passed = code === 0;
          message = passed ? 'Command executed successfully' : 'Command failed';
        }

        // Print result
        if (passed) {
          console.log(`${colors.green}✓ PASSED${colors.reset} - ${message}`);
        } else {
          console.log(`${colors.red}✗ FAILED${colors.reset} - ${message}`);
          if (!scenario.expectError) {
            console.log(`${colors.gray}Output: ${output.substring(0, 200)}...${colors.reset}`);
            if (errorOutput) {
              console.log(`${colors.red}Error: ${errorOutput.substring(0, 200)}...${colors.reset}`);
            }
          }
        }

        resolve(passed);
      } catch (error) {
        console.log(`${colors.red}✗ FAILED${colors.reset} - ${error.message}`);
        resolve(false);
      }
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.yellow}=== MCP Inspector Test Suite ===${colors.reset}`);
  console.log(`Running ${testScenarios.length} test scenarios...\n`);

  let passed = 0;
  let failed = 0;

  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.yellow}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});