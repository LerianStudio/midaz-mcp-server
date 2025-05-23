#!/bin/bash

# Demo script showing Makefile capabilities
# Run this to see the full development workflow

set -e

echo "🎯 Midaz MCP Server - Makefile Demo"
echo "===================================="
echo ""

echo "📋 Step 1: Show available commands"
echo "make help"
echo ""
make help
echo ""

echo "📁 Step 2: Setup configuration files"
echo "make config"
echo ""
make config
echo ""

echo "🔨 Step 3: Build the project" 
echo "make build"
echo ""
make build
echo ""

echo "🔍 Step 4: Test logging functionality"
echo "make test-logging"
echo ""
make test-logging
echo ""

echo "🧪 Step 5: Run linting"
echo "make lint"
echo ""
make lint
echo ""

echo "✅ Demo completed successfully!"
echo ""
echo "🚀 To start the server:"
echo "   make dev     # Development mode"
echo "   make start   # Production mode"
echo ""
echo "🐳 To use Docker:"
echo "   make docker-build"
echo "   make docker-run"
echo "   make docker-exec"
echo ""
echo "📖 For full documentation: make help"