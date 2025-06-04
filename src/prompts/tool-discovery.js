/**
 * Tool Discovery Prompts
 * Helps users discover and understand available tools
 */

import { createLogger } from "../util/mcp-logging.js";
import { z } from 'zod';

const logger = createLogger('prompts');

/**
 * Register discovery prompts
 */
export const registerDiscoveryPrompts = (server) => {
  
  // Main help prompt - more intuitive name
  server.prompt(
    "help-me-start",
    "Show me what I can do with this Midaz MCP server and how to get started quickly",
    [],
    async () => {
      return {
        description: "Quick start guide with essential tools and common workflows for Midaz",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `# Quick Start with Midaz MCP Server 🚀

## Most Common Tasks (Start Here!)
- **New to Midaz?** → \`midaz-learn\` type="path" userRole="developer" experienceLevel="beginner"
- **Need setup help?** → \`midaz-docs\` operation="getting-started"
- **Want code examples?** → \`midaz-docs\` operation="code-examples" useCase="create transaction"
- **Check system health?** → \`midaz_status\`

## Available Tools (21 total - optimized for MCP clients)

### 📚 Learning & Documentation (2 unified tools)
**midaz-docs** - All documentation in one tool (13 operations)
**midaz-learn** - All learning in one tool (4 types)

### 🏦 Financial API (18 tools)
Organizations, Ledgers, Accounts, Transactions, Assets, Portfolios, Segments, Balances

### 🔧 Utilities (1 tool)  
**midaz_status** - Real-time system monitoring

## 💡 Next Steps
1. Try \`help-with-api\` for API-specific guidance
2. Try \`help-me-learn\` for detailed learning paths
3. Start with any tool above - they all include helpful guidance!`
          }
        }]
      };
    }
  );

  // API-specific help prompt - more intuitive name
  server.prompt(
    "help-with-api", 
    "Show me how to use the Midaz API effectively with practical examples",
    [],
    async () => {
      return {
        description: "Practical guide to Midaz API usage with examples and common workflows",
        messages: [{
          role: "user", 
          content: {
            type: "text",
            text: `# Midaz API Quick Reference Guide

## 🚀 Getting Started
1. **Setup**: Use \`midaz-docs\` operation \`getting-started\`
2. **Auth**: Get API key and configure authentication
3. **Test**: Start with \`list-organizations\` to verify connection

## 📋 Common Workflows

### Create Your First Transaction
1. \`list-organizations\` - Find your organization
2. \`list-ledgers\` - Find or create a ledger  
3. \`list-accounts\` - Find source/destination accounts
4. Use transaction tools to create the transfer

### Check Balances & History
1. \`get-balance\` - Check current account balance
2. \`list-operations\` - See transaction history
3. \`get-transaction\` - Get transaction details

### Portfolio Management  
1. \`list-portfolios\` - See available portfolios
2. \`get-portfolio\` - Get portfolio details
3. \`list-accounts\` with portfolio filter

## 🔧 Advanced Features
- **Filtering**: All list tools support metadata, date, and status filters
- **Pagination**: Use cursor-based pagination for large datasets  
- **Real-time**: Tools work with both live API and sample data
- **Error Handling**: Comprehensive error responses with solutions

## 💡 Tool Parameters
Most API tools support:
- \`organization_id\` - Organization context
- \`ledger_id\` - Ledger context (when applicable)
- \`limit\` - Results per page (default: 10, max: 100)
- \`cursor\` - Pagination cursor
- Metadata, date, and status filters

Ask me to use any specific tool with these parameters!`
          }
        }]
      };
    }
  );

  // Learning help prompt - more intuitive name
  server.prompt(
    "help-me-learn",
    "Get personalized learning guidance for Midaz based on your role and experience", 
    z.object({
      role: z.enum(["developer", "admin", "business", "explorer"]).optional().describe("Your primary role (developer, admin, business, explorer)"),
      experience: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Your experience level (beginner, intermediate, advanced)")
    }),
    async (args) => {
      const role = args.role || "developer";
      const experience = args.experience || "beginner";
      
      return {
        description: `Personalized learning path for ${role} at ${experience} level`,
        messages: [{
          role: "user",
          content: {
            type: "text", 
            text: `# Personalized Midaz Learning Path

**Role**: ${role} | **Experience**: ${experience}

## 🎯 Recommended Learning Approach
Use: \`midaz-learn\` with type \`path\`, userRole \`${role}\`, experienceLevel \`${experience}\`

## 📚 Learning Options

### Quick Start (5-15 min)
- **Concepts**: Use \`midaz-learn\` type \`concept\` for key concepts
- **Examples**: Use \`midaz-docs\` operation \`code-examples\`
- **API Overview**: Use \`midaz-docs\` operation \`api-reference\`

### Deep Learning (30 min+)
- **Interactive Tutorial**: Use \`midaz-learn\` type \`tutorial\` with tutorialId \`first-transaction\`
- **Best Practices**: Use \`midaz-docs\` operation \`best-practices\` 
- **Architecture**: Use \`midaz-docs\` operation \`architecture\`

### Hands-On Practice
- **Live API**: Use financial API tools with sample data
- **Code Generation**: Use SDK tools for your preferred language
- **Troubleshooting**: Use \`midaz-docs\` operation \`troubleshooting\`

## 🔍 Smart Search
Use \`midaz-learn\` type \`search\` with queries like:
- "How do I create transactions?"
- "What is double-entry accounting?"
- "Show me portfolio examples"
- "Explain account hierarchies"

## 🎓 Next Steps
1. Choose your preferred learning style above
2. Ask me to use the specific tools with your parameters
3. Practice with the API tools
4. Join the community for ongoing support

Ready to start learning? Tell me which approach interests you most!`
          }
        }]
      };
    }
  );

  logger.info('✅ Discovery prompts registered');
};