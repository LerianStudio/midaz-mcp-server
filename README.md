# Midaz MCP Server

A Model Context Protocol (MCP) server that enables AI assistants (like Claude) to understand and interact with the Midaz financial system. Get instant access to Midaz documentation, APIs, and development tools directly in your AI conversations.

## 🚀 Quick Start (Choose One)

### Option 1: One-Command Setup (Recommended)
```bash
git clone https://github.com/lerianstudio/midaz-mcp-server
cd midaz-mcp-server
make setup && make start
```

### Option 2: NPX (No Installation Required)
```bash
npx @lerianstudio/midaz-mcp-server
```

### Option 3: Docker (Isolated Environment)
```bash
git clone https://github.com/lerianstudio/midaz-mcp-server
cd midaz-mcp-server
make docker-build && make docker-run
```

## 🔗 Connect to Claude Desktop

Add this to your Claude Desktop MCP settings:

### For NPX Installation:
```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": ["@lerianstudio/midaz-mcp-server"]
    }
  }
}
```

### For Local Development:
```json
{
  "mcpServers": {
    "midaz": {
      "command": "node",
      "args": ["/path/to/midaz-mcp-server/dist/index.js"]
    }
  }
}
```

### For Docker:
```json
{
  "mcpServers": {
    "midaz": {
      "command": "docker",
      "args": ["exec", "-i", "midaz-mcp-server", "node", "dist/index.js"]
    }
  }
}
```

## ✨ What You Get

Once connected, you can ask Claude about:

- 📚 **Midaz Documentation** - "Explain how Midaz accounts work"
- 🔧 **API Usage** - "Show me how to create a transaction"
- 🏗️ **Architecture** - "What's the difference between onboarding and transaction APIs?"
- 💡 **Examples** - "Generate Go code for creating an organization"
- 🐛 **Troubleshooting** - "Help me debug this Midaz integration"

## 🛠️ Configuration (Optional)

The server works out of the box, but you can customize it:

### Environment Variables
```bash
# Logging level (debug, info, warning, error)
export MIDAZ_LOG_LEVEL=info

# Enable detailed console logs
export MIDAZ_DETAILED_LOGS=true

# Connect to your local Midaz services
export MIDAZ_ONBOARDING_URL=http://localhost:3000
export MIDAZ_TRANSACTION_URL=http://localhost:3001
export MIDAZ_API_KEY=your-api-key
```

### Configuration File
Copy and edit the example configs:
```bash
cp .env.example .env
cp midaz-mcp-config.json.example midaz-mcp-config.json
```

## 🐳 Docker Quick Reference

```bash
# Build and run
make docker-build
make docker-run

# View logs
make docker-logs

# Stop and clean up
make docker-stop
make docker-clean
```

## 🔧 Development Commands

```bash
# Start development server
make dev

# Run with debug logging
MIDAZ_LOG_LEVEL=debug make dev

# Test the logging system
make test-logging

# See all available commands
make help
```

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Check if ports are available
lsof -i :3000 -i :3001

# Run with debug logging
MIDAZ_LOG_LEVEL=debug make start
```

### Claude Desktop Connection Issues
1. Ensure the MCP server is running
2. Check Claude Desktop logs for errors
3. Verify the command path in your MCP settings
4. Try restarting Claude Desktop after configuration changes

### Docker Issues
```bash
# Check container status
docker ps

# View container logs
make docker-logs

# Rebuild if needed
make docker-clean && make docker-build
```

## 📖 What This Server Provides

- **🔍 Documentation Search** - Access all Midaz docs instantly
- **⚡ API Tools** - Read-only tools for exploring Midaz APIs
- **📊 Data Models** - Complete understanding of Midaz data structures
- **🏗️ Architecture Guides** - How components work together
- **💻 Code Examples** - Ready-to-use code in Go and TypeScript
- **🔧 SDK Support** - Integrated knowledge of both SDKs

## 🔒 Security

- Localhost-only connections
- Read-only API access
- Input validation and sanitization
- No sensitive data exposure
- Audit logging for all operations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/lerianstudio/midaz-mcp-server/issues)
- **Docs**: [Comprehensive Documentation](https://docs.lerian.studio)
- **Quick Demo**: Run `make demo` to see all features

---

**Ready to get started?** Run `make setup` and connect to Claude Desktop in under 2 minutes! 🎉