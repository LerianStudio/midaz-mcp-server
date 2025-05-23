# Midaz MCP Server

A Model Context Protocol (MCP) server for Midaz that provides educational content, model information, and read-only API interactions for developer clients through their LLMs. The server runs locally on developer machines and connects to local Midaz backend services.

## Overview

This MCP server enables AI assistants (like Claude, ChatGPT, etc.) to understand the Midaz system better and interact with it in a read-only way. It provides:

1. **Educational Content**: Comprehensive documentation fetched from docs.lerian.studio
2. **Model Information**: Details about the data models in Midaz
3. **Infrastructure Context**: Understanding of the deployment and infrastructure
4. **Component Interaction**: How components like onboarding and transaction work together
5. **API Tools**: Read-only tools for interacting with Midaz APIs

### Online Documentation

The MCP server fetches documentation dynamically from [docs.lerian.studio](https://docs.lerian.studio). This ensures you always have access to the latest documentation without updating the MCP server.

### Dynamic Documentation Discovery

The server automatically discovers new documentation by parsing the `llms.txt` file from docs.lerian.studio. When new documentation is added to the site, the MCP server will automatically make it available without requiring any updates.

#### Documentation Tools

- **`refresh-docs-manifest`** - Force immediate refresh of available documentation
- **`list-all-documentation`** - Get a categorized list of all available docs
- **`search-documentation`** - Search for documentation by keyword
- **`get-available-documentation`** - Returns information about all available documentation
- **`clear-docs-cache`** - Clear cached documentation for fresh fetches
- **`get-docs-cache-stats`** - View cache statistics
- **`prefetch-documentation`** - Pre-load documentation for better performance

### LLM Documentation Resources

The server provides special resources for AI assistants:

- **Resource**: `midaz://llm/documentation` - Fetches the latest documentation index
- **Resource**: `midaz://llm/available-docs` - Lists all available documentation resources

This ensures AI assistants always know what documentation is available, even as new content is added.

## Prerequisites

- Node.js 18.0.0 or higher
- (Optional) Midaz backend services running locally:
  - Onboarding API on port 3000
  - Transaction API on port 3001

The server works with or without live Midaz services, automatically falling back to comprehensive stub data when services are unavailable.

## Quick Start

### Using Docker (Recommended for isolation)

```bash
# Using the helper script
./scripts/docker-mcp.sh build
./scripts/docker-mcp.sh run

# Or using docker-compose
docker-compose up -d
```

### Using npx (Recommended for simplicity)

```bash
# Run directly without installation
npx @midaz/mcp-server

# Or install globally
npm install -g @midaz/mcp-server
midaz-mcp-server
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/lerianstudio/midaz-mcp-server

# Navigate to the MCP server directory
cd midaz-mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# Run the server
npm start
```

## Usage

### Running the Server

The MCP server automatically detects local Midaz services when started:

```bash
# Using npx
npx @midaz/mcp-server

# Or if installed globally
midaz-mcp-server
```

The server will:
1. Check for Midaz services on default ports (3000 for Onboarding, 3001 for Transaction)
2. Use live services if available, or fall back to stub data
3. Start the MCP server on stdio for Claude Desktop integration

### Runtime Configuration

```bash
# Connect to custom backend URLs
midaz-mcp-server --onboarding-url=http://localhost:8080 --transaction-url=http://localhost:8081

# Force stub mode (ignore live services)
midaz-mcp-server --stub-mode=true

# Disable auto-detection
midaz-mcp-server --auto-detect=false
```

### Connecting to Midaz Backend

The MCP server connects to two different Midaz backend components running on different ports:

- **Onboarding API** (default: port 3000): Handles organization, ledger, and account management
- **Transaction API** (default: port 3001): Handles transactions, operations, balances, and asset rates

You can configure these connections in several ways:

```bash
# Using the configuration CLI
npm run config -- --onboarding-url=http://localhost:3000 --transaction-url=http://localhost:3001 --api-key=<your-api-key>

# Using environment variables
export MIDAZ_ONBOARDING_URL=http://localhost:3000
export MIDAZ_TRANSACTION_URL=http://localhost:3001
export MIDAZ_API_KEY=<your-api-key>
npm start

# Using command-line arguments
node dist/index.js --onboarding-url=http://localhost:3000 --transaction-url=http://localhost:3001 --api-key=<your-api-key>

# Using a configuration file
# Create a midaz-mcp-config.json file (see midaz-mcp-config.json.example)
npm start
```

### Integrating with Claude Desktop

#### Option 1: Direct Integration (npx)

1. Open Claude Desktop settings
2. Navigate to MCP section
3. Add a new global MCP server
4. Enter the following configuration:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": ["@midaz/mcp-server"]
    }
  }
}
```

#### Option 2: Docker Integration

For Docker, configure Claude Desktop to use docker exec:

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

Make sure the container is running first:
```bash
./scripts/docker-mcp.sh run
```

#### Custom Backend URLs

For custom backend URLs:

```json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": [
        "@midaz/mcp-server",
        "--onboarding-url=http://localhost:3000",
        "--transaction-url=http://localhost:3001"
      ],
      "env": {
        "MIDAZ_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Configuration

### Documentation URL

Configure the documentation base URL:

```bash
# Via environment variable
export MIDAZ_DOCS_URL=https://docs.lerian.studio

# Via configuration file
{
  "docsUrl": "https://docs.lerian.studio"
}
```

## Development

For detailed documentation, see the [docs](./docs/) directory.

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Test with basic server functionality
npm run test:server

# Test with MCP Inspector (simplified approach)
npm run test:inspector

# Test tools with actual backend
npm run test:tools
```

## Docker Support

The MCP server can run in a Docker container for better isolation and deployment flexibility.

### Quick Docker Commands

```bash
# Build and run with docker-compose
docker-compose up -d

# Using the helper script
./scripts/docker-mcp.sh build  # Build image
./scripts/docker-mcp.sh run    # Run container
./scripts/docker-mcp.sh exec   # Execute for Claude Desktop
./scripts/docker-mcp.sh logs   # View logs
./scripts/docker-mcp.sh stop   # Stop container
```

### Docker Environment Variables

- `MIDAZ_ONBOARDING_URL` - Default: `http://host.docker.internal:3000`
- `MIDAZ_TRANSACTION_URL` - Default: `http://host.docker.internal:3001`
- `MIDAZ_USE_STUBS` - Default: `true`
- `MIDAZ_API_KEY` - Optional API key
- `MIDAZ_DOCS_URL` - Default: `https://docs.lerian.studio`

See [Docker Documentation](./docs/docker.md) for detailed Docker usage.

## Project Structure

```
├── src/                # Source code
│   ├── index.ts        # Main server entry point
│   ├── cli.js          # Configuration CLI tool
│   ├── config.js       # Configuration management
│   ├── resources/      # Resource definitions
│   │   ├── models.ts   # Model resource registration
│   │   ├── components.ts # Component resource registration
│   │   ├── infra.ts    # Infrastructure resource registration
│   │   ├── docs.ts     # Educational resource registration
│   │   └── markdown/   # Markdown content files
│   │       ├── models/      # Model documentation files
│   │       ├── components/  # Component documentation files
│   │       ├── infra/       # Infrastructure documentation files
│   │       └── docs/        # Educational documentation files
│   ├── tools/          # Tool implementations
│   │   ├── organization.js  # Organization-related tools
│   │   ├── ledger.js        # Ledger-related tools
│   │   ├── account.js       # Account-related tools
│   │   ├── transaction.js   # Transaction-related tools
│   │   └── balance.js       # Balance-related tools
│   └── util/           # Utility functions
├── test/               # Test files
├── dist/               # Compiled JavaScript files
└── docs/               # Additional documentation
```

## Configuration

The MCP server can be configured using multiple methods (in order of priority):

1. **Command-line arguments**: `node dist/index.js --onboarding-url=<url> --transaction-url=<url> --api-key=<key>`
2. **Environment variables**: `MIDAZ_ONBOARDING_URL`, `MIDAZ_TRANSACTION_URL`, `MIDAZ_API_KEY`, etc.
3. **Configuration file**: `midaz-mcp-config.json`
4. **Default values**

See the [Configuration Guide](./docs/configuration.md) for detailed information.

## Features

- **Resource-based Documentation**: All documentation is available as MCP resources
- **Tool-based API Interaction**: Read-only API tools for interacting with Midaz
- **Backend Integration**: Connect to real Midaz backend components (Onboarding and Transaction)
- **Fallback Mode**: Provides sample data when backend is unavailable
- **Configuration Management**: CLI tool for managing backend connections
- **Educational Content**: Comprehensive guides on Midaz architecture and concepts
- **Flexible Configuration**: Multiple ways to configure the server including runtime arguments
- **Smart Routing**: Automatically routes API calls to the appropriate backend component
- **Dynamic Documentation**: Automatically discovers new docs from llms.txt
- **Enhanced Security**: Input validation, audit logging, and localhost-only connections
- **MCP Protocol Compliance**: Full support for subscriptions, pagination, and content types
- **Docker Support**: Run in isolated containers with full Claude Desktop integration

## Security

The MCP server includes several security features:

- **Localhost-only connections**: Only accepts connections from local machine
- **Input validation**: All tool inputs are validated with Zod schemas
- **Injection protection**: Detects and blocks common injection patterns
- **Audit logging**: All tool invocations and resource access are logged
- **Rate limiting**: Prevents abuse with configurable rate limits
- **Secure configuration**: Config files use restrictive permissions (600/400)
- **Environment isolation**: Filters environment variables for security

Audit logs are stored in `logs/audit.log` and automatically rotated after 30 days.

## License

[MIT](./LICENSE) 