# 📚 Comprehensive Documentation Tools System

This document describes the comprehensive documentation tools system that replaces the MCP resource system for broader client compatibility.

## 🚀 Overview

The Midaz MCP server now provides comprehensive documentation access through **tools instead of resources**. This ensures compatibility with all MCP clients (Claude Desktop, VSCode, web clients, CLI tools) while providing enhanced functionality.

### Why Tools Instead of Resources?

| Aspect | Resources | Documentation Tools |
|--------|-----------|-------------------|
| **Client Support** | Limited (not all clients support resources) | Universal (all MCP clients support tools) |
| **Functionality** | Static content delivery | Interactive, searchable, contextual |
| **Examples** | Basic documentation | Production-ready code examples |
| **Search** | No search capabilities | Advanced fuzzy search with filtering |
| **Troubleshooting** | No diagnostic tools | Comprehensive troubleshooting guides |
| **Interactivity** | Read-only | Interactive demos and guided tours |

## 🛠️ Available Documentation Tools

### 1. API Reference Tools

#### `get-api-reference`
Get comprehensive API reference documentation with endpoints, examples, and authentication details.

**Parameters:**
- `endpoint` (optional): Specific endpoint (e.g., 'organizations', 'transactions')
- `format`: 'summary' | 'detailed' | 'examples-only' (default: 'detailed')

**Example:**
```javascript
// Get complete API reference
{
  "tool": "get-api-reference",
  "arguments": { "format": "detailed" }
}

// Get specific endpoint documentation
{
  "tool": "get-api-reference", 
  "arguments": { "endpoint": "transactions", "format": "detailed" }
}
```

#### `search-api-endpoints`
Search for specific API endpoints by functionality, HTTP method, or resource type.

**Parameters:**
- `query`: Search query (e.g., 'create transaction', 'GET organizations')
- `method` (optional): Filter by HTTP method
- `includeExamples`: Include request/response examples (default: true)

### 2. Guides and Tutorials

#### `get-getting-started-guide`
Comprehensive getting started guide with step-by-step instructions and examples.

**Parameters:**
- `section`: 'overview' | 'installation' | 'first-steps' | 'examples' | 'troubleshooting' | 'all'
- `includeExamples`: Include code examples (default: true)

#### `get-best-practices-guide`
Best practices and patterns for security, performance, and architecture.

**Parameters:**
- `topic`: 'security' | 'performance' | 'architecture' | 'data-modeling' | 'error-handling' | 'all'
- `format`: 'guide' | 'checklist' | 'examples'

### 3. Architecture Documentation

#### `get-architecture-overview`
Comprehensive system architecture with components, data flow, and integration patterns.

**Parameters:**
- `component` (optional): Focus on specific component
- `depth`: 'high-level' | 'detailed' | 'technical'
- `includeDiagrams`: Include ASCII diagrams (default: true)

### 4. SDK Documentation

#### `get-sdk-documentation`
SDK documentation for Go and TypeScript clients.

**Parameters:**
- `language`: 'go' | 'typescript' | 'both'
- `section`: 'installation' | 'quickstart' | 'api-reference' | 'examples' | 'all'
- `includeExamples`: Include code examples (default: true)

### 5. Interactive Examples

#### `generate-code-examples`
Generate contextual code examples for specific use cases.

**Parameters:**
- `useCase`: Specific use case (e.g., 'create organization', 'transfer between accounts')
- `language`: 'curl' | 'javascript' | 'typescript' | 'go' | 'python'
- `format`: 'basic' | 'complete' | 'production-ready'
- `includeErrorHandling`: Include error handling (default: true)

**Supported Use Cases:**
- create organization
- create ledger
- create account
- create transaction
- transfer between accounts
- check balance
- list transactions
- get asset rates
- manage portfolios
- segment analysis

#### `get-common-workflows`
Common business workflows with implementation patterns.

**Parameters:**
- `workflow`: 'user-onboarding' | 'transaction-processing' | 'balance-inquiry' | 'asset-management' | 'reporting' | 'all'
- `includeCode`: Include implementation code (default: true)
- `format`: 'tutorial' | 'checklist' | 'flowchart'

### 6. Troubleshooting

#### `get-troubleshooting-guide`
Comprehensive troubleshooting with common issues and solutions.

**Parameters:**
- `category`: 'authentication' | 'api-errors' | 'performance' | 'data-consistency' | 'integration' | 'all'
- `severity`: 'critical' | 'high' | 'medium' | 'low' | 'all'
- `includePreventionTips`: Include prevention tips (default: true)

### 7. Search and Navigation

#### `search-documentation`
Advanced documentation search with filtering and ranking.

**Parameters:**
- `query`: Search query (minimum 2 characters)
- `categories` (optional): Filter by categories array
- `contentType`: 'all' | 'guides' | 'reference' | 'examples' | 'troubleshooting'
- `maxResults`: Maximum results (1-50, default: 10)
- `includeContent`: Include full content for small result sets (default: false)

#### `get-documentation-sitemap`
Complete documentation sitemap with hierarchical structure.

**Parameters:**
- `category` (optional): Filter by specific category
- `format`: 'tree' | 'flat' | 'graph'
- `includeMetadata`: Include resource metadata (default: true)

### 8. Demo and Exploration Tools

#### `docs-demo-overview`
Comprehensive overview of documentation system capabilities.

**Parameters:**
- `includeExamples`: Include usage examples (default: true)
- `format`: 'summary' | 'detailed' | 'interactive'

#### `docs-migration-guide`
Migration guide from resources to documentation tools.

**Parameters:**
- `showExamples`: Include before/after examples (default: true)
- `includeMapping`: Include resource-to-tool mapping (default: true)

#### `docs-guided-tour`
Interactive guided tour of the documentation system.

**Parameters:**
- `tourType`: 'quick' | 'comprehensive' | 'developer' | 'troubleshooting'
- `interactive`: Include interactive examples (default: true)

#### `docs-health-check`
System health check with connectivity and performance metrics.

**Parameters:**
- `includeMetrics`: Include performance metrics (default: true)
- `testConnectivity`: Test connectivity to documentation sources (default: true)

## 📋 Quick Start Examples

### Get Started with API Documentation
```javascript
// 1. Get API overview
{
  "tool": "get-api-reference",
  "arguments": { "format": "summary" }
}

// 2. Search for specific functionality
{
  "tool": "search-api-endpoints",
  "arguments": { "query": "create transaction", "includeExamples": true }
}

// 3. Generate code examples
{
  "tool": "generate-code-examples",
  "arguments": { 
    "useCase": "create transaction", 
    "language": "javascript",
    "format": "production-ready"
  }
}
```

### Explore System Architecture
```javascript
// 1. Get architecture overview
{
  "tool": "get-architecture-overview",
  "arguments": { "depth": "detailed", "includeDiagrams": true }
}

// 2. Focus on specific component
{
  "tool": "get-architecture-overview",
  "arguments": { "component": "transaction", "depth": "technical" }
}
```

### Get Help and Troubleshooting
```javascript
// 1. Search documentation
{
  "tool": "search-documentation",
  "arguments": { "query": "authentication error", "contentType": "troubleshooting" }
}

// 2. Get troubleshooting guide
{
  "tool": "get-troubleshooting-guide",
  "arguments": { "category": "authentication", "includePreventionTips": true }
}
```

### Interactive Learning
```javascript
// 1. Take a guided tour
{
  "tool": "docs-guided-tour",
  "arguments": { "tourType": "quick", "interactive": true }
}

// 2. Get workflow tutorials
{
  "tool": "get-common-workflows",
  "arguments": { "workflow": "user-onboarding", "format": "tutorial" }
}
```

## 🔄 Migration from Resources

### Before (Resources)
```javascript
// Old way - limited client support
{
  "method": "resources/read",
  "params": {
    "uri": "midaz://docs/overview"
  }
}
```

### After (Documentation Tools)
```javascript
// New way - universal client support with enhanced functionality
{
  "tool": "get-getting-started-guide",
  "arguments": { 
    "section": "overview", 
    "includeExamples": true 
  }
}
```

### Resource → Tool Mapping

| Resource | Replacement Tool | Benefits |
|----------|------------------|----------|
| `midaz://docs/overview` | `get-getting-started-guide` | + Examples, troubleshooting |
| `midaz://docs/architecture` | `get-architecture-overview` | + Interactive exploration |
| `midaz://models/*` | `get-api-reference` | + Complete API docs, examples |
| `midaz://components/*` | `get-architecture-overview` | + Component details, diagrams |

## 🎯 Use Cases by Role

### New Users
**Start with:** `get-getting-started-guide`
**Then try:** `docs-guided-tour` with `tourType: "quick"`

### Developers
**Start with:** `get-api-reference` and `generate-code-examples`
**Then try:** `get-sdk-documentation` for your language

### System Administrators
**Start with:** `get-architecture-overview`
**Then try:** `get-best-practices-guide` with `topic: "architecture"`

### Troubleshooters
**Start with:** `search-documentation` with error terms
**Then try:** `get-troubleshooting-guide` for your category

## 🔍 Advanced Features

### Fuzzy Search
The search system includes intelligent fuzzy matching:
- Typo correction
- Partial matches
- Relevance ranking
- Contextual suggestions

### Code Generation
Examples are generated in multiple formats:
- **Basic**: Simple, minimal examples
- **Complete**: Full working examples with setup
- **Production-ready**: Enterprise-grade with error handling

### Interactive Exploration
- Guided tours with step-by-step instructions
- Interactive demos and examples
- Contextual help and suggestions
- Health monitoring and diagnostics

## 🛡️ Benefits

1. **Universal Compatibility**: Works with all MCP clients
2. **Enhanced Functionality**: Search, examples, troubleshooting
3. **Interactive Experience**: Guided tours and demos
4. **Production-Ready**: Complete code examples with error handling
5. **Real-Time Updates**: Dynamic content from documentation sources
6. **Comprehensive Coverage**: API, architecture, SDKs, workflows

## 🚀 Getting Started

1. **Explore capabilities:**
   ```javascript
   { "tool": "docs-demo-overview", "arguments": { "format": "interactive" } }
   ```

2. **Take a quick tour:**
   ```javascript
   { "tool": "docs-guided-tour", "arguments": { "tourType": "quick" } }
   ```

3. **Start building:**
   ```javascript
   { "tool": "generate-code-examples", "arguments": { "useCase": "create organization" } }
   ```

4. **Get help when needed:**
   ```javascript
   { "tool": "search-documentation", "arguments": { "query": "your question here" } }
   ```

---

*The documentation tools system provides comprehensive, interactive access to Midaz documentation with universal MCP client compatibility.*