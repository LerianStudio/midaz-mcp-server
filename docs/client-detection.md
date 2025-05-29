# Client Detection System

The Midaz MCP server includes a comprehensive client detection and adaptation system that automatically detects which MCP client is connecting and adapts server behavior accordingly.

## Overview

The client detection system provides:

- **Automatic Client Detection**: Identifies connecting clients (Claude Desktop, Cursor, VS Code, etc.)
- **Capability-Based Tool Filtering**: Exposes appropriate tools based on client limitations
- **Adaptive Response Formatting**: Formats responses optimally for each client
- **Dynamic Configuration**: Adjusts behavior based on client performance
- **Error Handling**: Provides client-appropriate error responses

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Client Detection│    │ Adaptation Layer │    │ Response Format │
│                 │    │                  │    │                 │
│ • User-Agent    │───▶│ • Tool Filtering │───▶│ • JSON/Text     │
│ • Headers       │    │ • Parameter Adapt│    │ • Escape Handle │
│ • Environment   │    │ • Rate Limiting  │    │ • Size Limiting │
│ • Capabilities  │    │ • Error Handling │    │ • Client Themes │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Configuration Manager                        │
│ • Client Profiles  • Adaptive Settings  • Template System      │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Clients

### Claude Desktop
- **Detection**: `Claude Desktop`, `anthropic.*desktop`
- **Capabilities**: High complexity, binary content, images
- **Limits**: 10 tools/call, 100KB responses
- **Format**: Structured JSON with full metadata

### Cursor
- **Detection**: `Cursor`, `cursor.*editor`, `anysphere`
- **Capabilities**: Medium complexity, streaming
- **Limits**: 5 tools/call, 50KB responses
- **Format**: Concise output with minimal escaping

### VS Code
- **Detection**: `Visual Studio Code`, `vscode`, `monaco.*editor`
- **Capabilities**: High complexity, binary content, streaming
- **Limits**: 8 tools/call, 75KB responses
- **Format**: Developer-friendly with debugging info

### Windsurf
- **Detection**: `Windsurf`, `codeium.*windsurf`
- **Capabilities**: Medium complexity, streaming
- **Limits**: 6 tools/call, 60KB responses
- **Format**: Concise structured output

### Continue
- **Detection**: `Continue`, `continue.*dev`
- **Capabilities**: Low complexity, streaming
- **Limits**: 4 tools/call, 40KB responses
- **Format**: Minimal output with essential data only

### Generic/Unknown
- **Fallback**: Any unrecognized client
- **Capabilities**: Medium complexity baseline
- **Limits**: 5 tools/call, 50KB responses
- **Format**: Standard structured JSON

## Usage

### Basic Integration

The client detection system is automatically initialized when the server starts:

```javascript
import { initializeClientDetection } from './util/client-integration.js';

// During server startup
const clientContext = await initializeClientDetection(server, transport);
console.log(`Detected client: ${clientContext.client.name}`);
```

### Creating Client-Aware Tools

```javascript
import { createClientAwareTool } from './util/client-integration.js';

// Create a tool that adapts to client capabilities
const myTool = createClientAwareTool('account-search', async (params) => {
  // Tool implementation
  return { accounts: [...] };
}, 'medium'); // complexity level
```

### Manual Client Detection

```javascript
import { detectClient } from './util/client-detection.js';

const connectionInfo = {
  userAgent: 'Cursor/0.30.0',
  headers: { 'x-client-name': 'cursor' },
  environment: { CURSOR_PID: '12345' }
};

const clientContext = detectClient(connectionInfo);
console.log(clientContext.client.name); // "Cursor"
```

### Response Formatting

```javascript
import { ResponseFormatter } from './util/response-formatter.js';

const formatter = new ResponseFormatter(clientContext);

// Format response for specific client
const response = formatter.format(data, {
  type: 'json',        // json, text, markdown, table, list, tree
  escapeStrategy: 'standard', // none, minimal, standard, json, markdown
  maxSize: 50000,      // Response size limit
  includeMetadata: true // Add client/timing metadata
});
```

### Configuration Management

```javascript
import { configManager } from './util/client-config.js';

// Get client configuration
const config = configManager.getConfig('cursor');

// Set configuration override
configManager.setOverride('cursor', {
  maxToolsPerCall: 8,
  outputFormat: 'developer'
});

// Use configuration templates
const mobileConfig = configManager.getTemplate('mobile');
```

## Configuration

### Client Capabilities Schema

```javascript
{
  // Core identification
  id: 'string',
  name: 'string',
  version: 'string',
  
  // Tool capabilities
  maxToolsPerCall: 1-50,
  maxConcurrentTools: 1-10,
  toolComplexity: 'low|medium|high',
  
  // Content support
  supportsBinaryContent: boolean,
  supportsImages: boolean,
  supportsStreaming: boolean,
  supportsMarkdown: boolean,
  
  // Response handling
  maxResponseSize: 1000-1000000,
  outputFormat: 'minimal|concise|structured|developer',
  escapeHandling: 'none|minimal|standard|json|markdown',
  
  // Rate limiting
  rateLimit: {
    requests: 1-1000,
    window: 1000-3600000,
    burstLimit: 1-100
  },
  
  // Error handling
  errorVerbosity: 'minimal|standard|detailed|debug',
  includeStackTrace: boolean,
  
  // Performance
  timeoutMs: 1000-300000,
  retryAttempts: 0-5,
  cacheResponses: boolean
}
```

### Environment Variables

```bash
# Override client detection
MIDAZ_FORCE_CLIENT=cursor
MIDAZ_CLIENT_CONFIG=/path/to/config.json

# Enable debug logging
MIDAZ_LOG_LEVEL=debug
MIDAZ_CLIENT_DEBUG=true
```

### Configuration Files

Create `midaz-client-config.json`:

```json
{
  "clients": {
    "custom-client": {
      "name": "Custom MCP Client",
      "maxToolsPerCall": 15,
      "toolComplexity": "high",
      "outputFormat": "structured"
    }
  },
  "overrides": {
    "cursor": {
      "maxResponseSize": 100000
    }
  },
  "templates": {
    "mobile": {
      "maxToolsPerCall": 3,
      "maxResponseSize": 25000,
      "outputFormat": "minimal"
    }
  }
}
```

## Tool Complexity Levels

### Low Complexity
- **Characteristics**: Simple parameters, fast execution
- **Examples**: Account balance, basic search
- **Clients**: Continue, ZeroCode
- **Limits**: 1-3 tools, minimal output

### Medium Complexity  
- **Characteristics**: Standard parameters, moderate processing
- **Examples**: Transaction history, portfolio summary
- **Clients**: Cursor, Windsurf, Generic
- **Limits**: 5-8 tools, structured output

### High Complexity
- **Characteristics**: Complex parameters, extensive processing
- **Examples**: Financial analysis, bulk operations
- **Clients**: Claude Desktop, VS Code
- **Limits**: 10+ tools, full metadata

## Response Formats

### Minimal
```json
{
  "id": "acc1",
  "balance": 1250.75
}
```

### Concise
```
Account: acc1 (Checking) - Active
Balance: $1,250.75
```

### Structured
```json
{
  "type": "object",
  "data": {
    "id": "acc1",
    "name": "Checking",
    "balance": 1250.75,
    "currency": "USD",
    "status": "active"
  }
}
```

### Developer
```json
{
  "data": { ... },
  "_metadata": {
    "client": "VS Code",
    "responseTime": "150ms",
    "toolsUsed": ["account-search"],
    "generatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Error Handling

### Client-Specific Error Formats

**Minimal Clients** (Continue, ZeroCode):
```json
{ "error": "Account not found" }
```

**Standard Clients** (Cursor, Generic):
```json
{
  "error": "Account not found",
  "code": "ACCOUNT_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Developer Clients** (VS Code, Claude Desktop):
```json
{
  "error": "Account not found",
  "code": "ACCOUNT_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00Z",
  "stack": ["at findAccount (account.js:45)", "..."],
  "context": { "accountId": "acc1", "userId": "user1" },
  "client": "VS Code"
}
```

## Adaptive Behavior

The system automatically adapts based on client performance:

### Error Rate Adaptation
- **High errors** (>20%): Reduce concurrent tools, increase timeouts
- **Low errors** (<5%): Allow more complex operations

### Response Time Adaptation
- **Slow responses** (>5s): Reduce tool complexity, limit response size
- **Fast responses** (<1s): Enable advanced features

### Size Adaptation
- **Large responses**: Switch to concise format, reduce metadata
- **Small responses**: Allow richer formatting

## Testing

### Run Demo
```bash
node src/examples/client-detection-demo.js
```

### Test Detection
```javascript
import { runInteractiveDemo } from './examples/client-detection-demo.js';
await runInteractiveDemo();
```

### Unit Tests
```bash
npm test -- --grep "client detection"
```

## Troubleshooting

### Client Not Detected
1. Check user agent string in debug logs
2. Verify environment variables
3. Add custom detection pattern
4. Use fallback configuration

### Tools Not Available
1. Check tool complexity vs client capability
2. Verify binary/image requirements
3. Review rate limiting settings
4. Check tool registration

### Response Issues
1. Verify output format compatibility
2. Check escape handling settings
3. Review size limitations
4. Test with different formats

### Performance Issues
1. Monitor adaptive settings
2. Check error rates
3. Review timeout configurations
4. Analyze behavior patterns

## API Reference

### Classes

- `ClientContext`: Represents detected client with capabilities
- `ClientAdaptationManager`: Manages tool filtering and adaptation
- `ResponseFormatter`: Handles client-specific response formatting
- `ClientConfigManager`: Manages client configurations and templates
- `ToolRegistry`: Registers and filters tools by client capability

### Functions

- `detectClient(connectionInfo)`: Detect client from connection metadata
- `initializeClientDetection(server, transport)`: Initialize detection system
- `createClientAwareTool(name, handler, complexity)`: Create adaptive tool
- `getCurrentClientContext()`: Get current client context

### Events

- `client-detected`: Fired when client is identified
- `tool-filtered`: Fired when tools are filtered for client
- `response-formatted`: Fired when response is formatted
- `adaptive-update`: Fired when configuration is adapted

## Best Practices

1. **Always use client-aware tools** for new implementations
2. **Test with multiple clients** during development
3. **Monitor adaptive metrics** in production
4. **Provide graceful fallbacks** for unknown clients
5. **Keep response sizes reasonable** for mobile clients
6. **Use appropriate complexity levels** for tool classification
7. **Handle errors gracefully** with client-specific formatting

## Future Enhancements

- Machine learning-based client detection
- Dynamic capability negotiation
- Client preference learning
- Advanced caching strategies
- Real-time performance optimization