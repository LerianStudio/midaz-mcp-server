# Midaz MCP Server - Makefile
# Automates setup, configuration, and running of the MCP server

.PHONY: help setup build start dev test lint clean install demo validate docs docs-serve docs-clean typecheck audit ci-install ci-lint ci-test ci-audit ci-all

# Default target
help:
	@echo "🚀 Midaz MCP Server - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "📋 Setup & Configuration:"
	@echo "  setup           Setup project (copy config files, install deps)"
	@echo "  install         Install npm dependencies"
	@echo "  config          Copy configuration files (.env, JSON config)"
	@echo ""
	@echo "🔨 Development:"
	@echo "  build           Build TypeScript to JavaScript"
	@echo "  start           Start MCP server (production mode)"
	@echo "  dev             Start MCP server (development mode)"
	@echo "  test            Run all tests"
	@echo "  test-logging    Test logging functionality"
	@echo "  lint            Run ESLint"
	@echo "  lint-fix        Run ESLint with auto-fix"
	@echo "  typecheck       Run TypeScript type checking"
	@echo "  audit           Run npm security audit"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  docs            Generate TypeDoc API documentation"
	@echo "  docs-serve      Generate and serve docs locally"
	@echo "  docs-clean      Clean generated documentation"
	@echo ""
	@echo "🤖 CI/CD Commands (align with pipeline):"
	@echo "  ci-install      Install dependencies (like CI)"
	@echo "  ci-lint         Run lint + typecheck (like CI)"
	@echo "  ci-test         Run build + test (like CI)"
	@echo "  ci-audit        Run security audit (like CI)"
	@echo "  ci-all          Run complete CI pipeline locally"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean           Clean build artifacts"
	@echo "  clean-all       Clean everything (build + node_modules)"
	@echo "  demo            Run interactive Makefile demo"
	@echo "  validate        Validate that setup process works"
	@echo ""
	@echo "🔧 Environment Variables:"
	@echo "  MIDAZ_LOG_LEVEL=debug|info|warning|error"
	@echo "  MIDAZ_CONSOLE_LOGS=true|false"
	@echo "  MIDAZ_DETAILED_LOGS=true|false"
	@echo ""
	@echo "📖 Examples:"
	@echo "  make setup                    # Initial project setup"
	@echo "  make dev                      # Start development server"
	@echo "  make ci-all                   # Run complete CI pipeline locally"
	@echo "  make docs-serve               # Generate and serve documentation"
	@echo "  MIDAZ_LOG_LEVEL=debug make start  # Start with debug logging"

# Setup project from scratch
setup: config install build
	@echo "✅ Project setup complete!"
	@echo "📝 Next steps:"
	@echo "   1. Edit .env with your configuration"
	@echo "   2. Run 'make start' to start the server"

# Copy configuration files
config:
	@echo "📁 Setting up configuration files..."
	@if [ ! -f .env ]; then \
		cp .env.example .env && \
		echo "✅ Created .env from .env.example"; \
	else \
		echo "ℹ️  .env already exists, skipping"; \
	fi

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

# Build TypeScript
build:
	@echo "🔨 Building TypeScript..."
	npm run build

# Start server (production)
start: build
	@echo "🚀 Starting MCP server..."
	npm run start

# Start server (development)
dev:
	@echo "🔧 Starting MCP server in development mode..."
	npm run dev

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

# Test logging functionality
test-logging:
	@echo "🔍 Testing logging functionality..."
	node scripts/test-logging.js

# Lint code
lint:
	@echo "🔍 Running ESLint..."
	npm run lint

# Lint with auto-fix
lint-fix:
	@echo "🔧 Running ESLint with auto-fix..."
	npm run lint:fix

# TypeScript type checking
typecheck:
	@echo "🔍 Running TypeScript type checking..."
	npm run typecheck

# Security audit
audit:
	@echo "🔒 Running npm security audit..."
	npm run audit


# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf logs/*.log 2>/dev/null || true

clean-all: clean docs-clean
	@echo "🧹 Cleaning everything..."
	rm -rf node_modules
	rm -rf .env 2>/dev/null || true

# CI/CD aligned commands
ci-install:
	@echo "🤖 Installing dependencies (CI mode)..."
	npm ci

ci-lint:
	@echo "🤖 Running lint + typecheck (like CI)..."
	npm run ci:lint

ci-test:
	@echo "🤖 Running build + test (like CI)..."
	npm run ci:test

ci-audit:
	@echo "🤖 Running security audit (like CI)..."
	npm run ci:audit

ci-all:
	@echo "🤖 Running complete CI pipeline locally..."
	npm run ci:all

# Development shortcuts with different log levels
dev-debug:
	@echo "🔍 Starting development server with debug logging..."
	MIDAZ_LOG_LEVEL=debug MIDAZ_DETAILED_LOGS=true npm run dev

dev-quiet:
	@echo "🔇 Starting development server with minimal logging..."
	MIDAZ_LOG_LEVEL=error MIDAZ_CONSOLE_LOGS=true npm run dev

# Production shortcuts
start-debug:
	@echo "🔍 Starting production server with debug logging..."
	MIDAZ_LOG_LEVEL=debug MIDAZ_DETAILED_LOGS=true npm run start

start-quiet:
	@echo "🔇 Starting production server with minimal logging..."
	MIDAZ_LOG_LEVEL=error npm run start

# Quick development cycle
quick: lint-fix typecheck build test
	@echo "✅ Quick development cycle complete!"

# Full CI/CD cycle (matches pipeline exactly)
ci: clean ci-install ci-lint ci-test ci-audit
	@echo "✅ CI/CD cycle complete!"

# Demo Makefile capabilities
demo:
	@echo "🎯 Running Makefile demo..."
	./scripts/demo-makefile.sh

# Documentation generation
docs:
	@echo "📚 Generating TypeDoc API documentation..."
	npm run docs
	@echo "✅ Documentation generated in docs/ directory"
	@echo "🌐 Open docs/index.html in your browser to view"

# Generate and serve docs locally (requires Python or Node.js HTTP server)
docs-serve: docs
	@echo "🌐 Starting local documentation server..."
	@if command -v python3 >/dev/null 2>&1; then \
		echo "📄 Serving docs at http://localhost:8080"; \
		echo "🔴 Press Ctrl+C to stop the server"; \
		cd docs && python3 -m http.server 8080; \
	elif command -v python >/dev/null 2>&1; then \
		echo "📄 Serving docs at http://localhost:8080"; \
		echo "🔴 Press Ctrl+C to stop the server"; \
		cd docs && python -m SimpleHTTPServer 8080; \
	elif command -v npx >/dev/null 2>&1; then \
		echo "📄 Serving docs at http://localhost:8080"; \
		echo "🔴 Press Ctrl+C to stop the server"; \
		cd docs && npx http-server -p 8080; \
	else \
		echo "❌ No HTTP server available. Install Python or Node.js http-server"; \
		echo "💡 Alternative: Open docs/index.html directly in your browser"; \
	fi

# Clean generated documentation
docs-clean:
	@echo "🧹 Cleaning generated documentation..."
	rm -rf docs
	@echo "✅ Documentation cleaned"

# Validate setup process
validate:
	@echo "🧪 Validating setup process..."
	./scripts/validate-setup.sh