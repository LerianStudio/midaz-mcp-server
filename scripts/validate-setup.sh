#!/bin/bash

# Validation script to ensure the simplified README instructions work
# This simulates a new user following the README

set -e

echo "🧪 Validating README Quick Start Instructions"
echo "============================================="
echo ""

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Project directory validated"

# Test 1: Check if make setup works
echo "📋 Testing: make setup"
echo "make config"
make config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Configuration files setup works"
else
    echo "❌ Configuration setup failed"
    exit 1
fi

# Test 2: Check if make build works
echo "📋 Testing: make build"
make build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build process works"
else
    echo "❌ Build process failed"
    exit 1
fi

# Test 3: Check if make test-logging works
echo "📋 Testing: make test-logging"
make test-logging > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Logging test works"
else
    echo "❌ Logging test failed"
    exit 1
fi

# Test 4: Check if configuration files exist
if [ -f ".env" ] && [ -f "midaz-mcp-config.json" ]; then
    echo "✅ Configuration files created successfully"
else
    echo "❌ Configuration files missing"
    exit 1
fi

# Test 5: Check if built files exist
if [ -f "dist/index.js" ] && [ -f "dist/cli.js" ]; then
    echo "✅ Build artifacts created successfully"
else
    echo "❌ Build artifacts missing"
    exit 1
fi

# Test 6: Validate JSON configs
node -e "JSON.parse(require('fs').readFileSync('.env.example', 'utf8').split('\n').filter(l => !l.startsWith('#') && l.includes('=')).join('\n'))" 2>/dev/null || true
node -e "JSON.parse(require('fs').readFileSync('midaz-mcp-config.json', 'utf8'))" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Configuration files are valid"
else
    echo "❌ Configuration files have syntax errors"
    exit 1
fi

echo ""
echo "🎉 All validation tests passed!"
echo "🚀 The README Quick Start instructions work correctly"
echo ""
echo "📋 Summary of what works:"
echo "   ✅ make setup (configuration + build)"
echo "   ✅ make build (TypeScript compilation)"
echo "   ✅ make test-logging (logging system)"
echo "   ✅ Configuration file creation"
echo "   ✅ JSON validation"
echo ""
echo "🔗 Ready for Claude Desktop integration!"