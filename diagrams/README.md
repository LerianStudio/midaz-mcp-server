# Midaz MCP Server - System Sequence Diagrams

Visual documentation of system interactions, data flows, and business processes for the Midaz Model Context Protocol server.

## 📋 Diagram Categories

### 🔌 MCP Protocol & API Interactions
- [MCP Protocol Flows](mcp-protocol-flows.md) - MCP client-server communication patterns
- [API Flows](api-flows.md) - Midaz backend API request/response patterns
- [Tool Execution Flows](tool-flows.md) - Tool registration and execution sequences

### 🔐 Authentication & Security
- [Authentication Flows](auth-flows.md) - Client authentication and token validation
- [Security Flows](security-flows.md) - Input validation, audit logging, and security checks

### 💾 Data Processing & Backend Integration
- [Data Flows](data-flows.md) - Backend service integration and data processing
- [Configuration Flows](config-flows.md) - Configuration loading and service discovery

### 🏢 Business Process Flows  
- [Financial Workflows](financial-flows.md) - Ledger operations and financial data flows
- [Client Adaptation](client-adaptation-flows.md) - Dynamic client detection and adaptation

### 🔄 System Architecture & Error Handling
- [System Interactions](system-interactions.md) - Component communication patterns
- [Error Handling](error-flows.md) - Error detection, recovery, and reporting sequences

## 🎯 Key Architecture Patterns

**MCP Protocol Compliance**: JSON-RPC 2.0 over stdio with tool and resource capabilities
**Unified Tool Pattern**: Consolidated tools with operation parameters for client compatibility  
**Backend Integration**: Dual-service architecture (Onboarding + Transaction services)
**Client Adaptation**: Dynamic response formatting based on client capabilities
**Security-First**: Comprehensive input validation, audit logging, and secure configuration
**Fallback Strategy**: Stub data when backend services unavailable

## 🔍 System Overview

The Midaz MCP Server acts as an intelligent proxy between MCP clients (like Claude Desktop) and the Midaz financial ledger backend services. It provides:

- **21 Financial Tools**: Complete coverage of organizations, ledgers, accounts, transactions, balances
- **2 Unified Tools**: Documentation and learning tools with multiple operations  
- **Client Adaptation**: Automatic detection and optimization for different MCP clients
- **Security Layer**: Input validation, rate limiting, and comprehensive audit logging
- **Configuration Management**: Multi-source configuration with auto-detection capabilities

## 🛠️ Component Architecture

```
MCP Client (Claude Desktop, VSCode, etc.)
    ↓ stdio (JSON-RPC 2.0)
McpServer (SDK)
    ↓
ClientIntegrationManager (adaptation layer)
    ↓
Tool Handlers (21 tools)
    ↓
ApiClient (HTTP with retry logic)
    ↓
Backend Services (Onboarding + Transaction)
```

## 🔧 How to Read These Diagrams

- **Participants**: System components, services, clients
- **Messages**: API calls, tool invocations, data transfers
- **Activations**: Processing time and resource usage
- **Notes**: Business logic, security checks, error conditions
- **Alt/Opt blocks**: Conditional flows and error handling

## 📊 Diagram Statistics

- **Total Diagrams**: 10 comprehensive flow categories
- **Coverage**: Complete system lifecycle from client connection to backend integration
- **Focus Areas**: MCP protocol compliance, security, performance, error handling
- **Update Frequency**: Synchronized with architecture changes and new tool additions

## 🛠️ Updating Diagrams

When system architecture changes:
1. Update relevant sequence diagrams in each category
2. Verify participant names match current component structure  
3. Add new interaction patterns for new tools or features
4. Remove deprecated flows and update error handling sequences
5. Update this index with new diagram links and component descriptions

Generated from comprehensive codebase analysis - keep synchronized with actual implementation.