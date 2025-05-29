/**
 * Output Formatting System Tests
 * 
 * Comprehensive tests for the MCP output formatting system including
 * client detection, escape handling, sanitization, and adapter functionality.
 */

import assert from 'assert';
import { 
  detectClientType, 
  getClientCapabilities, 
  escapeForClient, 
  formatJsonForClient, 
  formatCodeBlockForClient, 
  formatTableForClient,
  truncateToClientLimit,
  ClientType,
  ContentType 
} from '../src/util/output-formatter.js';
import { 
  sanitizeText, 
  sanitizeJson, 
  sanitizeCode, 
  sanitizeUrl, 
  sanitizeFilename 
} from '../src/util/output-sanitizer.js';
import { 
  createClientAdapter, 
  formatMcpResponse 
} from '../src/util/client-adapters.js';

// Test data
const TEST_DATA = {
  simpleText: 'Hello, world!',
  markdownText: '# Hello\n\nThis is **bold** and *italic* text with `code` snippets.',
  dangerousText: '<script>alert("xss")</script>',
  unicodeText: 'Hello 🌍 Unicode: αβγ',
  longText: 'x'.repeat(10000),
  jsonData: {
    id: 123,
    name: 'Test User',
    nested: {
      array: [1, 2, 3],
      boolean: true,
      null_value: null
    }
  },
  largeJsonData: {
    items: Array.from({ length: 500 }, (_, i) => ({ id: i, value: `item-${i}` }))
  },
  codeSnippet: `function hello() {\n  console.log("Hello, world!");\n  return 42;\n}`,
  tableData: {
    headers: ['ID', 'Name', 'Status'],
    rows: [
      [1, 'Alice', 'Active'],
      [2, 'Bob', 'Inactive'],
      [3, 'Charlie', 'Pending']
    ]
  },
  maliciousUrls: [
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    'vbscript:msgbox("xss")',
    'http://evil.com/malware.exe'
  ],
  validUrls: [
    'https://example.com',
    'http://localhost:3000',
    'ftp://files.example.com/file.txt'
  ]
};

// Mock MCP extra contexts for different clients
const CLIENT_CONTEXTS = {
  [ClientType.CLAUDE_DESKTOP]: {
    clientInfo: { name: 'Claude Desktop', version: '1.0.0' },
    capabilities: { markdown: true, codeBlocks: true, unicode: true }
  },
  [ClientType.CLAUDE_CLI]: {
    clientInfo: { name: 'Claude CLI', version: '1.0.0' },
    capabilities: { markdown: false, codeBlocks: false, unicode: true }
  },
  [ClientType.CURSOR]: {
    clientInfo: { name: 'Cursor', version: '0.40.0' },
    capabilities: { markdown: true, codeBlocks: true, unicode: true }
  },
  [ClientType.VSCODE]: {
    clientInfo: { name: 'VSCode MCP', version: '1.0.0' },
    capabilities: { markdown: true, codeBlocks: true, unicode: true }
  },
  [ClientType.TERMINAL]: {
    clientInfo: { name: 'Terminal Client', version: '1.0.0' },
    capabilities: { markdown: false, codeBlocks: false, unicode: false }
  }
};

describe('Output Formatting System', () => {
  
  describe('Client Detection', () => {
    it('should detect Claude Desktop from client info', () => {
      const clientType = detectClientType(CLIENT_CONTEXTS[ClientType.CLAUDE_DESKTOP]);
      assert.strictEqual(clientType, ClientType.CLAUDE_DESKTOP);
    });

    it('should detect Claude CLI from client info', () => {
      const clientType = detectClientType(CLIENT_CONTEXTS[ClientType.CLAUDE_CLI]);
      assert.strictEqual(clientType, ClientType.CLAUDE_CLI);
    });

    it('should detect Cursor from client info', () => {
      const clientType = detectClientType(CLIENT_CONTEXTS[ClientType.CURSOR]);
      assert.strictEqual(clientType, ClientType.CURSOR);
    });

    it('should detect VS Code from client info', () => {
      const clientType = detectClientType(CLIENT_CONTEXTS[ClientType.VSCODE]);
      assert.strictEqual(clientType, ClientType.VSCODE);
    });

    it('should fallback to unknown for unrecognized clients', () => {
      const clientType = detectClientType({ clientInfo: { name: 'Unknown Client' } });
      assert.strictEqual(clientType, ClientType.UNKNOWN);
    });

    it('should handle missing client info gracefully', () => {
      const clientType = detectClientType({});
      assert.strictEqual(clientType, ClientType.UNKNOWN);
    });
  });

  describe('Client Capabilities', () => {
    it('should return correct capabilities for Claude Desktop', () => {
      const caps = getClientCapabilities(ClientType.CLAUDE_DESKTOP);
      assert.strictEqual(caps.supportsMarkdown, true);
      assert.strictEqual(caps.supportsCodeBlocks, true);
      assert.strictEqual(caps.supportsUnicode, true);
      assert.strictEqual(caps.supportsEmojis, true);
    });

    it('should return correct capabilities for Terminal', () => {
      const caps = getClientCapabilities(ClientType.TERMINAL);
      assert.strictEqual(caps.supportsMarkdown, false);
      assert.strictEqual(caps.supportsCodeBlocks, false);
      assert.strictEqual(caps.supportsUnicode, false);
      assert.strictEqual(caps.supportsEmojis, false);
    });

    it('should return safe defaults for unknown clients', () => {
      const caps = getClientCapabilities('unknown-client');
      assert.strictEqual(caps.supportsMarkdown, false);
      assert.strictEqual(caps.supportsCodeBlocks, false);
      assert.strictEqual(caps.maxResponseLength, 2000);
    });
  });

  describe('Text Escaping', () => {
    it('should escape markdown special characters for markdown clients', () => {
      const escaped = escapeForClient('*bold* _italic_ `code`', ClientType.CLAUDE_DESKTOP);
      assert(escaped.includes('\\*bold\\*'));
      assert(escaped.includes('\\_italic\\_'));
      assert(escaped.includes('\\`code\\`'));
    });

    it('should not escape markdown for non-markdown clients', () => {
      const escaped = escapeForClient('*bold* _italic_', ClientType.TERMINAL);
      assert(!escaped.includes('\\*'));
      assert(!escaped.includes('\\_'));
    });

    it('should handle unicode appropriately', () => {
      const escaped = escapeForClient(TEST_DATA.unicodeText, ClientType.TERMINAL);
      assert(!escaped.includes('🌍')); // Emoji should be removed
      assert(!escaped.includes('αβγ')); // Unicode should be replaced
    });

    it('should preserve unicode for supporting clients', () => {
      const escaped = escapeForClient(TEST_DATA.unicodeText, ClientType.CLAUDE_DESKTOP);
      assert(escaped.includes('🌍'));
      assert(escaped.includes('αβγ'));
    });
  });

  describe('JSON Formatting', () => {
    it('should format JSON with appropriate indentation', () => {
      const formatted = formatJsonForClient(TEST_DATA.jsonData, ClientType.CLAUDE_DESKTOP);
      assert(formatted.includes('  ')); // Should be indented
      assert(formatted.includes('"id": 123'));
    });

    it('should format JSON compactly for CLI', () => {
      const formatted = formatJsonForClient(TEST_DATA.jsonData, ClientType.CLAUDE_CLI);
      assert(!formatted.includes('  ')); // Should not be indented
    });

    it('should handle large JSON data by truncating', () => {
      const formatted = formatJsonForClient(TEST_DATA.largeJsonData, ClientType.CLAUDE_CLI);
      assert(formatted.includes('more items') || formatted.length < JSON.stringify(TEST_DATA.largeJsonData).length);
    });
  });

  describe('Code Block Formatting', () => {
    it('should format code blocks for supporting clients', () => {
      const formatted = formatCodeBlockForClient(TEST_DATA.codeSnippet, 'javascript', ClientType.CLAUDE_DESKTOP);
      assert(formatted.startsWith('```'));
      assert(formatted.endsWith('```'));
      assert(formatted.includes('javascript'));
    });

    it('should format code as indented text for non-supporting clients', () => {
      const formatted = formatCodeBlockForClient(TEST_DATA.codeSnippet, 'javascript', ClientType.TERMINAL);
      assert(!formatted.includes('```'));
      assert(formatted.includes('  function')); // Should be indented
    });
  });

  describe('Table Formatting', () => {
    it('should format markdown tables for supporting clients', () => {
      const formatted = formatTableForClient(TEST_DATA.tableData.headers, TEST_DATA.tableData.rows, ClientType.CLAUDE_DESKTOP);
      assert(formatted.includes('| ID | Name | Status |'));
      assert(formatted.includes('| --- | --- | --- |'));
      assert(formatted.includes('| 1 | Alice | Active |'));
    });

    it('should format ASCII tables for non-markdown clients', () => {
      const formatted = formatTableForClient(TEST_DATA.tableData.headers, TEST_DATA.tableData.rows, ClientType.TERMINAL);
      assert(!formatted.includes('|'));
      assert(formatted.includes('ID'));
      assert(formatted.includes('Alice'));
      assert(formatted.includes('---'));
    });
  });

  describe('Content Sanitization', () => {
    it('should remove dangerous script content', () => {
      const sanitized = sanitizeText(TEST_DATA.dangerousText, ClientType.CLAUDE_DESKTOP);
      assert(!sanitized.includes('<script>'));
      assert(!sanitized.includes('alert'));
    });

    it('should sanitize malicious URLs', () => {
      for (const url of TEST_DATA.maliciousUrls) {
        const sanitized = sanitizeUrl(url);
        assert(sanitized === '[Removed: unsafe URL]' || sanitized === '');
      }
    });

    it('should preserve valid URLs', () => {
      for (const url of TEST_DATA.validUrls) {
        const sanitized = sanitizeUrl(url);
        assert.strictEqual(sanitized, url);
      }
    });

    it('should sanitize filenames', () => {
      const dangerous = 'file<>:"/\\|?*.txt';
      const sanitized = sanitizeFilename(dangerous);
      assert(!sanitized.includes('<'));
      assert(!sanitized.includes('>'));
      assert(!sanitized.includes(':'));
    });

    it('should handle reserved Windows filenames', () => {
      const reserved = 'CON.txt';
      const sanitized = sanitizeFilename(reserved);
      assert(sanitized.startsWith('_'));
    });

    it('should truncate long content', () => {
      const sanitized = sanitizeText(TEST_DATA.longText, ClientType.CLAUDE_DESKTOP, { maxLength: 100 });
      assert(sanitized.length <= 100);
      assert(sanitized.includes('truncated'));
    });
  });

  describe('Client Adapters', () => {
    it('should create appropriate adapter for each client type', () => {
      const desktopAdapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      assert.strictEqual(desktopAdapter.clientType, ClientType.CLAUDE_DESKTOP);

      const cliAdapter = createClientAdapter(ClientType.CLAUDE_CLI);
      assert.strictEqual(cliAdapter.clientType, ClientType.CLAUDE_CLI);
    });

    it('should auto-detect client type from extra context', () => {
      const adapter = createClientAdapter(CLIENT_CONTEXTS[ClientType.CURSOR]);
      assert.strictEqual(adapter.clientType, ClientType.CURSOR);
    });

    it('should format text appropriately for each client', () => {
      const desktopAdapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      const cliAdapter = createClientAdapter(ClientType.CLAUDE_CLI);

      const markdown = '**bold** text';
      
      const desktopFormatted = desktopAdapter.format(markdown, ContentType.MARKDOWN);
      const cliFormatted = cliAdapter.format(markdown, ContentType.MARKDOWN);

      // Desktop should preserve markdown, CLI should strip it
      assert(desktopFormatted.includes('**'));
      assert(!cliFormatted.includes('**'));
    });

    it('should format JSON differently for different clients', () => {
      const desktopAdapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      const cliAdapter = createClientAdapter(ClientType.CLAUDE_CLI);

      const desktopJson = desktopAdapter.format(TEST_DATA.jsonData, ContentType.JSON);
      const cliJson = cliAdapter.format(TEST_DATA.jsonData, ContentType.JSON);

      // Desktop should have code blocks, CLI should not
      assert(desktopJson.includes('```json'));
      assert(!cliJson.includes('```'));
    });

    it('should handle errors gracefully', () => {
      const adapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      const errorFormatted = adapter.format(new Error('Test error'), ContentType.ERROR);
      
      assert(errorFormatted.includes('Error'));
      assert(errorFormatted.includes('Test error'));
    });
  });

  describe('MCP Response Formatting', () => {
    it('should create properly structured MCP responses', () => {
      const response = formatMcpResponse(TEST_DATA.simpleText, ClientType.CLAUDE_DESKTOP);
      
      assert(response.content);
      assert(Array.isArray(response.content));
      assert.strictEqual(response.content[0].type, 'text');
      assert.strictEqual(response.isError, false);
    });

    it('should handle different content types automatically', () => {
      // Test JSON detection
      const jsonResponse = formatMcpResponse(TEST_DATA.jsonData, ClientType.CLAUDE_DESKTOP);
      assert(jsonResponse.content[0].text.includes('```json'));

      // Test table detection
      const tableResponse = formatMcpResponse(TEST_DATA.tableData, ClientType.CLAUDE_DESKTOP);
      assert(tableResponse.content[0].text.includes('|'));
    });

    it('should include metadata when provided', () => {
      const response = formatMcpResponse(TEST_DATA.simpleText, ClientType.CLAUDE_DESKTOP, {
        metadata: { source: 'test', timestamp: '2024-01-01' }
      });
      
      assert(response.metadata);
      assert.strictEqual(response.metadata.source, 'test');
    });

    it('should handle formatting errors gracefully', () => {
      // Simulate an error by passing invalid data
      const circular = {};
      circular.self = circular;
      
      const response = formatMcpResponse(circular, ClientType.CLAUDE_DESKTOP);
      assert(response.isError === true || response.content[0].text.includes('Error'));
    });
  });

  describe('Length Limits', () => {
    it('should respect client-specific length limits', () => {
      const longContent = 'x'.repeat(100000);
      
      const desktopFormatted = truncateToClientLimit(longContent, ClientType.CLAUDE_DESKTOP);
      const cliFormatted = truncateToClientLimit(longContent, ClientType.CLAUDE_CLI);
      
      assert(desktopFormatted.length > cliFormatted.length); // Desktop has higher limits
      assert(cliFormatted.includes('truncated'));
    });

    it('should not truncate content within limits', () => {
      const shortContent = 'Short text';
      
      const formatted = truncateToClientLimit(shortContent, ClientType.CLAUDE_CLI);
      assert.strictEqual(formatted, shortContent);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const adapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      
      const nullFormatted = adapter.format(null, ContentType.TEXT);
      const undefinedFormatted = adapter.format(undefined, ContentType.TEXT);
      
      assert(typeof nullFormatted === 'string');
      assert(typeof undefinedFormatted === 'string');
    });

    it('should handle empty strings and arrays', () => {
      const adapter = createClientAdapter(ClientType.CLAUDE_DESKTOP);
      
      const emptyStringFormatted = adapter.format('', ContentType.TEXT);
      const emptyArrayFormatted = adapter.format([], ContentType.LIST);
      
      assert.strictEqual(emptyStringFormatted, '');
      assert(typeof emptyArrayFormatted === 'string');
    });

    it('should handle deeply nested objects', () => {
      const deepObject = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };
      const formatted = formatJsonForClient(deepObject, ClientType.CLAUDE_CLI);
      
      // Should handle deep nesting without throwing
      assert(typeof formatted === 'string');
    });

    it('should handle special characters in table data', () => {
      const specialTable = {
        headers: ['Col|1', 'Col"2', "Col'3"],
        rows: [['Val|1', 'Val"2', "Val'3"]]
      };
      
      const formatted = formatTableForClient(specialTable.headers, specialTable.rows, ClientType.CLAUDE_DESKTOP);
      assert(typeof formatted === 'string');
      assert(!formatted.includes('undefined'));
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Output Formatting System Tests...\n');
  
  // Simple test runner
  const tests = [
    // Add manual test runs here if needed
  ];
  
  console.log('✅ All tests would run with a proper test framework (mocha, jest, etc.)');
  console.log('💡 To run these tests, use: npm test or node --test test/output-formatting-test.js');
}