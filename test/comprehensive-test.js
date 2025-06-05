#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Lerian MCP Server
 * Tests all tools and prompts to ensure everything is working correctly
 */

import { spawn } from 'child_process';

const TIMEOUT = 10000; // 10 seconds timeout for each test

/**
 * Send a JSON-RPC request to the MCP server
 */
async function sendMcpRequest(request) {
    return new Promise((resolve, reject) => {
        const server = spawn('npx', ['lerian-mcp-server'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';
        let responseReceived = false;

        // Set timeout
        const timeout = global.setTimeout(() => {
            if (!responseReceived) {
                server.kill();
                reject(new Error(`Request timeout after ${TIMEOUT}ms`));
            }
        }, TIMEOUT);

        server.stdout.on('data', (data) => {
            output += data.toString();

            // Look for the JSON response after the separator
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.startsWith('{"result":') || line.startsWith('{"error":')) {
                    responseReceived = true;
                    global.clearTimeout(timeout);
                    server.kill();

                    try {
                        const response = JSON.parse(line);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON response: ${error.message}`));
                    }
                    return;
                }
            }
        });

        server.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        server.on('close', (code) => {
            if (!responseReceived) {
                global.clearTimeout(timeout);
                reject(new Error(`Server exited with code ${code}. Error: ${errorOutput}`));
            }
        });

        server.on('error', (error) => {
            global.clearTimeout(timeout);
            reject(error);
        });

        // Send the request
        server.stdin.write(JSON.stringify(request) + '\n');
        server.stdin.end();
    });
}

/**
 * Test suite definitions
 */
const tests = [
    // Core functionality tests
    {
        name: 'List Tools',
        request: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.tools) throw new Error('No tools found');
            if (response.result.tools.length < 20) throw new Error(`Expected 20+ tools, got ${response.result.tools.length}`);
            return `✅ Found ${response.result.tools.length} tools`;
        }
    },

    {
        name: 'List Prompts',
        request: { jsonrpc: '2.0', id: 2, method: 'prompts/list' },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.prompts) throw new Error('No prompts found');
            if (response.result.prompts.length < 8) throw new Error(`Expected 8+ prompts, got ${response.result.prompts.length}`);
            return `✅ Found ${response.result.prompts.length} prompts`;
        }
    },

    // Documentation tool tests
    {
        name: 'Docs - Getting Started',
        request: {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'midaz-docs',
                arguments: { operation: 'getting-started' }
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No content returned');
            if (!response.result.content[0].text.includes('Getting Started')) throw new Error('Invalid getting started content');
            return '✅ Getting started documentation working';
        }
    },

    {
        name: 'Docs - Sitemap',
        request: {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'midaz-docs',
                arguments: { operation: 'sitemap' }
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No sitemap content returned');
            const content = response.result.content[0].text;
            if (!content.includes('docs') && !content.includes('api')) throw new Error('Invalid sitemap structure');
            return '✅ Sitemap generation working';
        }
    },

    // Learning tool tests
    {
        name: 'Learn - Developer Path',
        request: {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
                name: 'midaz-learn',
                arguments: {
                    type: 'path',
                    userRole: 'developer',
                    experienceLevel: 'beginner'
                }
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No learning path content returned');
            const content = response.result.content[0].text;
            if (!content.includes('developer') || !content.includes('beginner')) throw new Error('Invalid learning path content');
            return '✅ Learning path generation working';
        }
    },

    // API tools tests
    {
        name: 'List Organizations',
        request: {
            jsonrpc: '2.0',
            id: 6,
            method: 'tools/call',
            params: {
                name: 'list-organizations',
                arguments: {}
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No organizations content returned');
            return '✅ List organizations working';
        }
    },

    {
        name: 'MCP Version',
        request: {
            jsonrpc: '2.0',
            id: 7,
            method: 'tools/call',
            params: {
                name: 'midaz-mcp-version',
                arguments: {}
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No version content returned');
            const content = JSON.parse(response.result.content[0].text);
            if (!content.version || !content.name) throw new Error('Invalid version response');
            return `✅ Version check working - ${content.name} v${content.version}`;
        }
    },

    // Monitoring tools tests
    {
        name: 'Health Status',
        request: {
            jsonrpc: '2.0',
            id: 8,
            method: 'tools/call',
            params: {
                name: 'lerian-health-status',
                arguments: {}
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.content?.[0]?.text) throw new Error('No health status content returned');
            return '✅ Health status monitoring working';
        }
    },

    // Prompt tests
    {
        name: 'Help Me Start Prompt',
        request: {
            jsonrpc: '2.0',
            id: 9,
            method: 'prompts/get',
            params: {
                name: 'help-me-start',
                arguments: {}
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.messages?.[0]?.content?.text) throw new Error('No prompt content returned');
            const content = response.result.messages[0].content.text;
            if (!content.includes('Quick Start') || !content.includes('Lerian')) throw new Error('Invalid prompt content');
            return '✅ Help me start prompt working';
        }
    },

    {
        name: 'Learning Prompt with Args',
        request: {
            jsonrpc: '2.0',
            id: 10,
            method: 'prompts/get',
            params: {
                name: 'help-me-learn',
                arguments: {
                    role: 'developer',
                    experience: 'beginner'
                }
            }
        },
        validate: (response) => {
            if (response.error) throw new Error(`Error: ${response.error.message}`);
            if (!response.result?.messages?.[0]?.content?.text) throw new Error('No prompt content returned');
            const content = response.result.messages[0].content.text;
            if (!content.includes('developer') || !content.includes('beginner')) throw new Error('Invalid prompt content');
            return '✅ Parameterized prompt working';
        }
    }
];

/**
 * Run all tests
 */
async function runTests() {
    console.log('🧪 Starting Comprehensive Lerian MCP Server Test Suite\n');

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of tests) {
        process.stdout.write(`📋 ${test.name}... `);

        try {
            const response = await sendMcpRequest(test.request);
            const result = test.validate(response);
            console.log(result);
            passed++;
            results.push({ name: test.name, status: 'PASSED', message: result });
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
            failed++;
            results.push({ name: test.name, status: 'FAILED', message: error.message });
        }

        // Small delay between tests
        await new Promise(resolve => global.setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.filter(r => r.status === 'FAILED').forEach(r => {
            console.log(`   • ${r.name}: ${r.message}`);
        });
    }

    console.log('\n🎯 TOOL COVERAGE:');
    console.log('   • Documentation Tools: ✅ Tested (midaz-docs)');
    console.log('   • Learning Tools: ✅ Tested (midaz-learn)');
    console.log('   • API Tools: ✅ Tested (list-organizations, midaz-mcp-version)');
    console.log('   • Monitoring Tools: ✅ Tested (lerian-health-status)');
    console.log('   • Prompts: ✅ Tested (help-me-start, help-me-learn)');

    console.log('\n🚀 OVERALL STATUS:');
    if (failed === 0) {
        console.log('   🟢 ALL SYSTEMS OPERATIONAL');
        console.log('   🎉 Lerian MCP Server is fully functional!');
    } else {
        console.log('   🟡 SOME ISSUES DETECTED');
        console.log('   🔧 Please review failed tests above');
    }

    process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
    console.error('💥 Test suite failed to run:', error.message);
    process.exit(1);
}); 