# Midaz MCP Server

Give your AI assistant instant access to Midaz documentation and APIs! This plugin connects Claude, ChatGPT, and other AI assistants to the Midaz financial system, so you can get help with integration, APIs, and troubleshooting directly in your conversations.

## ⚡ 5-Minute Setup

**Step 1:** Choose your AI assistant
**Step 2:** Copy the configuration below  
**Step 3:** Restart your AI app
**Step 4:** Start asking questions about Midaz!

### 🖥️ Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": ["@lerianstudio/midaz-mcp-server@latest"]
    }
  }
}
```

### 🖥️ Claude Code (Command Line)

```bash
# Install once
npm install -g @lerianstudio/midaz-mcp-server

# Add to Claude Code
claude mcp add midaz "midaz-mcp-server"
```

### 💬 ChatGPT Desktop

Add to your ChatGPT Desktop MCP configuration file:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": ["@lerianstudio/midaz-mcp-server@latest"]
    }
  }
}
```

### ⚡ Cursor IDE

**Location:** Cursor Settings → MCP Servers

```json
{
  "mcp.servers": {
    "midaz": {
      "command": "npm",
      "args": ["exec", "@lerianstudio/midaz-mcp-server@latest"]
    }
  }
}
```

### 🌊 Windsurf IDE

**Location:** Windsurf Settings → MCP Configuration

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npm",
      "args": ["exec", "@lerianstudio/midaz-mcp-server@latest"]
    }
  }
}
```

### 🔄 Continue IDE

**Location:** Continue Settings → MCP Servers

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npm",
      "args": ["exec", "@lerianstudio/midaz-mcp-server@latest"]
    }
  }
}
```

## ✨ What You Get

Once connected, you can ask your AI assistant:

- 📚 **"Explain how Midaz accounts work"**
- 🔧 **"Show me how to create a transaction"**
- 🏗️ **"What's the difference between onboarding and transaction APIs?"**
- 💡 **"Generate Go code for creating an organization"**
- 🐛 **"Help me debug this Midaz integration error"**
- 📊 **"What data models does Midaz use?"**

## 🧙‍♂️ Enhanced Workflow Prompts

**NEW!** Interactive wizards and troubleshooting assistants:

### Basic Workflows
- 🎯 **`create-transaction-wizard`** - Step-by-step transaction creation
- 🔍 **`debug-my-balance`** - Balance troubleshooting with context
- 🏗️ **`setup-my-org`** - Organization setup wizard
- 📊 **`explain-my-data`** - Smart data analysis and insights
- 🚀 **`help-me-start`** - Quick start guide
- 🔧 **`help-with-api`** - API-specific guidance
- 📚 **`help-me-learn`** - Personalized learning paths

### Advanced Intelligence (NEW!)
- 📄 **`check-file-balances`** - Multi-format file analysis (CSV/TXT/JSON) with smart UUID extraction
- 💰 **`check-external-balance`** - External account balance checking by asset (USD, EUR, BTC, etc.)
- 🔍 **`discover-midaz-hierarchy`** - Explore complete org → ledger → asset → account chains
- 🛠️ **`show-all-tools`** - Complete catalog of all tools, operations, and parameters

**Enhanced Features:**
- **File Format Support:** Automatic detection of CSV, TXT, and JSON files
- **Smart UUID Extraction:** Intelligent parsing with optional LLM confirmation for TXT files
- **External Balance Monitoring:** Check system-level asset balances and liquidity
- **Business Intelligence:** Asset distribution analysis and treasury management insights

**Usage:** *"Use check-file-balances to analyze my accounts.txt file"* or *"Use check-external-balance to see USD liquidity"*

## 🆘 Need Help?

### Not Working?

1. **Restart your AI app** after adding the configuration
2. **Check the file location** - make sure you edited the right config file
3. **Try the basic test**: Ask your AI "Can you access Midaz documentation?"

### Still Having Issues?

- **Claude Desktop Users**: Verify MCP is enabled in your Claude Desktop version
- **All Users**: Make sure you have Node.js installed on your computer
- **Get Support**: [GitHub Issues](https://github.com/lerianstudio/midaz-mcp-server/issues)

## 🔒 Safe & Secure

- ✅ Read-only access (can't modify your data)
- ✅ No API keys required for basic usage
- ✅ All data stays on your computer
- ✅ Open source and auditable

## 🛠️ Development & Contributing

### **Quick Start for Developers**
```bash
# Setup and run locally
make setup                    # Initial project setup
make dev                      # Start development server

# Before committing (matches CI/CD exactly)
make ci-all                   # Run complete CI pipeline locally
```

### **Available Commands**
- **`make ci-all`** - Run complete CI/CD pipeline locally (recommended before commits)
- **`make docs-serve`** - Generate and serve documentation locally
- **`make typecheck`** - TypeScript type checking
- **`make audit`** - Security vulnerability scan

### **Documentation**
- 📊 [System Architecture Diagrams](diagrams/README.md) - Visual system documentation

---

**Ready to get started?** Copy the configuration for your AI assistant above and restart the app! 🚀