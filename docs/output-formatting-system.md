# MCP Output Formatting System

A comprehensive output formatting system designed to handle different MCP client requirements and escape character issues across various clients including Claude Desktop, Cursor, VS Code, Claude CLI, and more.

## Overview

The output formatting system provides:

- **Automatic client detection** based on MCP context
- **Client-specific formatting adapters** optimized for each client's capabilities
- **Safe output sanitization** to prevent injection attacks
- **Escape character handling** for different rendering engines
- **Content type inference** and appropriate formatting
- **Length limits** and truncation for client constraints

## Architecture

### Core Components

1. **Output Formatter** (`src/util/output-formatter.js`)
   - Client type detection and capability management
   - Basic formatting functions for different content types
   - Escape character handling

2. **Output Sanitizer** (`src/util/output-sanitizer.js`)
   - Security-focused content sanitization
   - Protection against injection attacks
   - Safe handling of user-generated content

3. **Client Adapters** (`src/util/client-adapters.js`)
   - Specialized formatting for each client type
   - Client-specific optimizations and features
   - Automatic content type detection

4. **Enhanced MCP Helpers** (`src/util/enhanced-mcp-helpers.js`)
   - Drop-in replacements for standard MCP helpers
   - Automatic formatting integration
   - Backward compatibility with existing code

## Client Support Matrix

| Feature | Claude Desktop | Claude CLI | Cursor | VS Code | Web Client | Terminal |
|---------|---------------|------------|--------|---------|------------|----------|
| Markdown | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Code Blocks | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Unicode | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Emojis | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Max Length | 50K | 8K | 100K | 75K | 200K | 4K |
| Tables | Markdown | ASCII | Markdown | Markdown | Enhanced | ASCII |

## Usage Examples

### Basic Usage

```javascript
import { createEnhancedToolResponse } from '../util/enhanced-mcp-helpers.js';

// Automatic formatting based on client capabilities
export const myTool = wrapEnhancedToolHandler(async (args, extra) => {
  const data = { id: 123, name: 'Example' };
  
  // Will automatically format as JSON table, or simple text based on client
  return data;
});
```

### Specific Content Types

```javascript
import { 
  createJsonResponse,
  createCodeResponse,
  createTableResponse,
  createMarkdownResponse 
} from '../util/enhanced-mcp-helpers.js';

// Format as JSON with syntax highlighting
const jsonResponse = createJsonResponse(data, extra);

// Format as code block with language-specific highlighting
const codeResponse = createCodeResponse(
  'function hello() { return "world"; }', 
  'javascript', 
  extra
);

// Format as a table
const tableResponse = createTableResponse(
  ['ID', 'Name', 'Status'],
  [[1, 'Alice', 'Active'], [2, 'Bob', 'Inactive']],
  extra
);

// Format as markdown
const markdownResponse = createMarkdownResponse(
  '# Title\n\nThis is **bold** text.',
  extra
);
```

### Direct Adapter Usage

```javascript
import { createClientAdapter, ContentType } from '../util/client-adapters.js';

// Create adapter for specific client
const adapter = createClientAdapter(extra);

// Format different content types
const formattedText = adapter.format('Hello world', ContentType.TEXT);
const formattedJson = adapter.format(data, ContentType.JSON);
const formattedCode = adapter.format(code, ContentType.CODE, { language: 'python' });
```

### Custom Formatting Options

```javascript
// With custom options
const response = createEnhancedToolResponse(data, extra, {
  contentType: ContentType.TABLE,
  metadata: { source: 'database', timestamp: Date.now() },
  title: 'User Data',
  sortable: true
});
```

## Client-Specific Optimizations

### Claude Desktop
- Rich markdown support with proper escaping
- Syntax-highlighted code blocks
- Enhanced table formatting with spacing
- Full Unicode and emoji support
- Error formatting with visual indicators

### Claude CLI
- Compact, minimal formatting
- No markdown or code blocks
- Simple ASCII tables
- Compressed JSON output
- Plain text error messages

### Cursor
- Optimized for development workflows
- Enhanced code block formatting with explicit language tags
- Support for file context in code blocks
- Developer-friendly error messages

### VS Code
- Integration with VS Code's rendering capabilities
- Collapsible sections for large content
- File path integration for code blocks
- IDE-friendly formatting

### Web Clients
- Full HTML and markdown support
- Collapsible JSON sections
- Enhanced table features
- Maximum compatibility

### Terminal
- ASCII-only output
- Minimal formatting
- Compact representation
- Basic error messages

## Security Features

### Content Sanitization

The system automatically sanitizes content to prevent:

- **Script injection** (`<script>`, `javascript:`, etc.)
- **HTML injection** (`<iframe>`, `<object>`, etc.)
- **Markdown injection** (malicious links, images)
- **Control characters** (null bytes, zero-width characters)
- **Dangerous protocols** (`javascript:`, `vbscript:`, `data:`)

### Length Limits

Each client has appropriate length limits:

```javascript
const LIMITS = {
  CLAUDE_DESKTOP: 50000,
  CLAUDE_CLI: 8000,
  CURSOR: 100000,
  VSCODE: 75000,
  WEB_CLIENT: 200000,
  TERMINAL: 4000
};
```

### URL Sanitization

URLs are validated and dangerous protocols are blocked:

```javascript
const dangerousUrls = [
  'javascript:alert("xss")',
  'data:text/html,<script>alert("xss")</script>',
  'vbscript:msgbox("xss")'
];

// These will be replaced with '[Removed: unsafe URL]'
```

## Error Handling

The system provides graceful error handling:

```javascript
// Errors are formatted appropriately for each client
try {
  const result = await someOperation();
  return createEnhancedToolResponse(result, extra);
} catch (error) {
  // Automatically creates client-appropriate error response
  return createEnhancedErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    error.message,
    extra,
    { stack: error.stack }
  );
}
```

## Migration Guide

### From Basic MCP Helpers

```javascript
// Before
import { createToolResponse } from '../util/mcp-helpers.js';
return createToolResponse(data);

// After
import { createEnhancedToolResponse } from '../util/enhanced-mcp-helpers.js';
return createEnhancedToolResponse(data, extra);
```

### Enhancing Existing Tools

```javascript
import { enhanceExistingTool } from '../util/enhanced-mcp-helpers.js';

// Wrap existing tool function
const enhancedTool = enhanceExistingTool(existingToolFunction, {
  name: 'my-tool',
  contentType: ContentType.JSON
});
```

## Performance Considerations

### Caching
- Client capabilities are cached per session
- Sanitization patterns are pre-compiled
- Adapters are reused for the same client type

### Lazy Loading
- Complex formatting is only applied when beneficial
- Simple strings skip enhancement for performance

### Memory Management
- Large content is truncated before processing
- Circular references are handled safely
- Deep object traversal has limits

## Testing

The system includes comprehensive tests:

```bash
# Run formatting system tests
npm test test/output-formatting-test.js

# Test specific client scenarios
node test/output-formatting-test.js --client=claude-desktop
```

Test coverage includes:
- Client detection accuracy
- Escape character handling
- Content sanitization
- Length limits
- Error conditions
- Edge cases

## Configuration

### Environment Variables

```bash
# Enable detailed formatting logs
MIDAZ_DETAILED_LOGS=true

# Set log level for formatting system
MIDAZ_LOG_LEVEL=debug

# Override client detection for testing
MCP_CLIENT_TYPE=claude-desktop
```

### Custom Client Types

You can extend the system with custom client types:

```javascript
import { ClientType, CLIENT_CAPABILITIES } from '../util/output-formatter.js';

// Add custom client
const CUSTOM_CLIENT = 'my-custom-client';
CLIENT_CAPABILITIES[CUSTOM_CLIENT] = {
  supportsMarkdown: true,
  supportsCodeBlocks: false,
  maxResponseLength: 10000,
  // ... other capabilities
};
```

## Best Practices

1. **Always pass MCP extra context** to enable client detection
2. **Specify content types explicitly** when known
3. **Use appropriate response creators** for different data types
4. **Handle errors gracefully** with enhanced error responses
5. **Test with different clients** to ensure compatibility
6. **Monitor response sizes** to stay within client limits
7. **Sanitize user input** before formatting

## Troubleshooting

### Common Issues

**Client not detected properly:**
```javascript
// Check client info in extra context
console.log('Client info:', extra.clientInfo);

// Force specific client type for testing
const adapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
```

**Content not formatting correctly:**
```javascript
// Check content type inference
import { inferContentType } from '../util/client-adapters.js';
console.log('Detected type:', inferContentType(data));

// Specify content type explicitly
const response = createEnhancedToolResponse(data, extra, {
  contentType: ContentType.JSON
});
```

**Response too large:**
```javascript
// Check response size
const response = createEnhancedToolResponse(data, extra);
console.log('Response size:', JSON.stringify(response).length);

// Use pagination for large datasets
const paginatedResponse = createEnhancedPaginatedResponse(
  largeArray, 
  extra, 
  { limit: 50 }
);
```

## Future Enhancements

- **AI-powered content optimization** based on client preferences
- **Real-time client capability detection** via feature probing
- **Custom formatting themes** for different use cases
- **Automatic content summarization** for length-constrained clients
- **Interactive content** for supporting clients
- **Streaming responses** for large content

## Contributing

When contributing to the formatting system:

1. Add tests for new client types or features
2. Update the client capability matrix
3. Document new formatting options
4. Consider backward compatibility
5. Test across all supported clients