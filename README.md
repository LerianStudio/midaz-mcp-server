# Midaz MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to understand and interact with the Midaz financial system. Get instant access to Midaz documentation, APIs, and development tools directly in your AI conversations.

## 🔗 Connect to Your AI Assistant

### Claude/ChatGPT/Cursor/Windsurf and Other MCP Clients (Auto-Updates)

Add this to your MCP settings:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": ["--yes", "@lerianstudio/midaz-mcp-server"]
    }
  }
}
```

### Docker (Auto-Updates)

For any MCP-compatible client using Docker:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "lerianstudio/midaz-mcp-server:latest"]
    }
  }
}
```

### Direct NPX Usage

```bash
npx --yes @lerianstudio/midaz-mcp-server
```

## ✨ What You Get

Once connected, you can ask your AI assistant about:

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

### Custom Backend URLs

For custom backend URLs in your MCP client configuration:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": [
        "--yes",
        "@lerianstudio/midaz-mcp-server",
        "--onboarding-url=http://localhost:3000",
        "--transaction-url=http://localhost:3001"
      ],
      "env": {
        "MIDAZ_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🆘 Troubleshooting

### Connection Issues

1. Ensure your AI client supports MCP
2. Check MCP server logs for errors
3. Verify the command path in your MCP settings
4. Try restarting your AI client after configuration changes

### Update Issues

```bash
# Force update to latest version
npx --yes @lerianstudio/midaz-mcp-server

# Clear npm cache if needed
npm cache clean --force
```

### Docker Issues

```bash
# Pull latest image
docker pull lerianstudio/midaz-mcp-server:latest

# Check container status
docker ps

# View container logs
docker logs midaz-mcp-server
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
- **Developer Guide**: See [DEVELOPER.md](DEVELOPER.md) for advanced setup

---

**Ready to get started?** Add the configuration to your AI client and start asking questions about Midaz! 🎉
