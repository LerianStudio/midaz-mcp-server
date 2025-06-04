/**
 * Advanced Midaz Workflow Prompts
 * Intelligent prompts that chain operations and handle complex data flows
 */

import { createLogger } from "../util/mcp-logging.js";
import { z } from 'zod';

const logger = createLogger('advanced-prompts');

/**
 * Register advanced workflow prompts
 */
export const registerAdvancedPrompts = (server) => {

  // Multi-Format File Balance Checker - Intelligent account balance analysis from CSV/TXT/JSON
  server.prompt(
    "check-file-balances",
    "Analyze CSV, TXT, or JSON files to find account UUIDs and check their balances in Midaz",
    {
      file_content: z.string().describe("File content (CSV, TXT, or JSON format)"),
      file_type: z.enum(["csv", "txt", "json", "auto"]).optional().describe("File type (auto-detect if not specified)"),
      organization_hint: z.string().optional().describe("Hint for which organization to use (will auto-detect if not provided)"),
      ledger_hint: z.string().optional().describe("Hint for which ledger to use (will auto-detect if not provided)"),
      account_column: z.string().optional().describe("CSV column name containing account IDs (default: auto-detect)"),
      json_path: z.string().optional().describe("JSON path to account IDs (e.g., 'accounts[].id' or 'data.account_ids')"),
      confirm_uuids: z.boolean().optional().describe("For TXT files: confirm found UUIDs before proceeding")
    },
    async (args) => {
      const { file_content, file_type = "auto", organization_hint, ledger_hint, account_column, json_path, confirm_uuids = false } = args;
      
      // Auto-detect file type
      let detectedType = file_type;
      if (file_type === "auto") {
        if (file_content.trim().startsWith('{') || file_content.trim().startsWith('[')) {
          detectedType = "json";
        } else if (file_content.includes(',') && (file_content.includes('\n') || file_content.includes('\r'))) {
          detectedType = "csv";
        } else {
          detectedType = "txt";
        }
      }
      
      const content = `# 📊 Multi-Format File Balance Checker

## File Analysis & Balance Checking Process

**File Type:** ${detectedType.toUpperCase()} ${file_type === "auto" ? "(auto-detected)" : "(specified)"}
**File Size:** ${file_content.length > 100 ? `${(file_content.length/1024).toFixed(1)}KB` : `${file_content.length} chars`}

### 🔍 Phase 1: File Analysis & UUID Extraction

${detectedType === "csv" ? `
**CSV File Processing:**
1. **Parse CSV Structure**
   - Identify columns and headers
   - Look for UUID patterns in: ${account_column || 'auto-detecting columns'}
   - Extract unique account identifiers

2. **UUID Validation**
   - Validate UUID format (36 characters, dashes in correct positions)
   - Filter out invalid entries
   - Report parsing statistics` : 

detectedType === "json" ? `
**JSON File Processing:**
1. **Parse JSON Structure**
   - Navigate to account data using path: ${json_path || 'auto-detecting paths'}
   - Look for UUID patterns in arrays and objects
   - Handle nested structures intelligently

2. **UUID Extraction**
   - Extract UUIDs from specified JSON paths
   - Support multiple formats: arrays, nested objects, mixed structures
   - Validate UUID format and uniqueness` :

`**TXT File Processing:**
1. **Pattern Recognition**
   - Scan entire text for UUID patterns
   - Use regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
   - Extract all potential UUIDs

${confirm_uuids ? `
2. **LLM Confirmation Required** ⚠️
   - **IMPORTANT:** For TXT files, you must confirm found UUIDs
   - I'll show you all extracted UUIDs for verification
   - Only confirmed UUIDs will be processed for balance checking
   - This prevents false positives from random UUID-like strings` : `
2. **Automatic Processing**
   - All valid UUID patterns will be processed
   - Set confirm_uuids=true for manual verification`}

3. **UUID Validation**
   - Validate format and checksum
   - Remove duplicates and invalid entries`}

### 🏢 Phase 2: Organization Discovery
${organization_hint ? 
  `**Using Organization Hint:** ${organization_hint}
   - First, I'll verify this organization exists
   - Use: \`list-organizations\` to confirm` :
  `**Auto-Discovery Mode:**
   - Use: \`list-organizations\` to see all available organizations
   - If multiple organizations found, I'll ask you to choose
   - If only one organization, I'll proceed automatically`}

### 📚 Phase 3: Ledger Discovery  
${ledger_hint ?
  `**Using Ledger Hint:** ${ledger_hint}
   - Verify ledger exists in chosen organization
   - Use: \`list-ledgers\` with organization_id` :
  `**Auto-Discovery Mode:**
   - Use: \`list-ledgers\` for the chosen organization
   - If multiple ledgers found, I'll ask you to choose
   - If only one ledger, I'll proceed automatically`}

### 💰 Phase 4: Balance Checking
**For each account UUID from your CSV:**

1. **Account Verification**
   - Use: \`list-accounts\` to verify account exists
   - Match CSV UUIDs against actual account IDs
   - Report missing/invalid accounts

2. **Balance Retrieval**
   - Use: \`get-balance\` for each valid account
   - Collect balance data with asset information
   - Handle any errors gracefully

3. **Results Compilation**
   - Create summary table: Account ID | Name | Balance | Asset | Status
   - Calculate totals by asset type
   - Identify accounts with zero or negative balances

## 📋 Expected Output Format

\`\`\`
CSV Balance Analysis Results
============================
Organization: [Name] (ID: xxx-xxx)
Ledger: [Name] (ID: xxx-xxx)
Analysis Date: ${new Date().toISOString()}

Account Summary:
┌─────────────────────────────────────┬──────────────────┬─────────────┬───────┬────────────┐
│ Account ID                          │ Account Name     │ Balance     │ Asset │ Status     │
├─────────────────────────────────────┼──────────────────┼─────────────┼───────┼────────────┤
│ 12345678-1234-1234-1234-123456789012│ Customer Wallet  │ 1,500.00   │ USD   │ ✅ Active   │
│ 12345678-1234-1234-1234-123456789013│ Merchant Account │ 25,000.00  │ USD   │ ✅ Active   │
│ 12345678-1234-1234-1234-123456789014│ Fee Collection   │ 125.50     │ USD   │ ✅ Active   │
└─────────────────────────────────────┴──────────────────┴─────────────┴───────┴────────────┘

Totals by Asset:
• USD: $26,625.50 (3 accounts)
• EUR: €0.00 (0 accounts)

Issues Found:
• 2 UUIDs from CSV not found in Midaz
• 0 accounts with negative balances
• 1 account with zero balance
\`\`\`

## 🚀 Ready to Start?

**Next Steps:**
1. **Provide your CSV data** (paste content or provide file path)
2. **I'll analyze and extract UUIDs**
3. **Choose organization/ledger** (or let me auto-detect)
4. **Get comprehensive balance report**

**Commands I'll Use:**
- \`list-organizations\` → \`list-ledgers\` → \`list-accounts\` → \`get-balance\`

This creates a complete audit trail from your CSV to live Midaz balances! 🎯`;

      return {
        description: `${detectedType.toUpperCase()} balance checker with intelligent discovery`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: content
          }
        }]
      };
    }
  );

  // External Balance Checker - Check external account balances by asset
  server.prompt(
    "check-external-balance",
    "Check the balance of external accounts for specific assets in Midaz ledgers",
    {
      organization_id: z.string().describe("Organization ID to check external balances"),
      ledger_id: z.string().describe("Ledger ID to check external balances"),
      asset_code: z.string().optional().describe("Specific asset code to check (e.g., USD, EUR, BTC)"),
      list_all_assets: z.boolean().optional().describe("List all available assets first before checking balances")
    },
    async (args) => {
      const { organization_id, ledger_id, asset_code, list_all_assets = false } = args;
      
      const content = `# 💰 External Balance Checker

## External Account Balance Analysis

**Organization:** ${organization_id}
**Ledger:** ${ledger_id}
${asset_code ? `**Target Asset:** ${asset_code}` : '**Assets:** All available assets'}

---

## 🔍 What are External Accounts?

External accounts in Midaz represent **system-level accounts** for each asset type within a ledger. They are special accounts that:

- **Track total external balances** for each asset (USD, EUR, BTC, etc.)
- **Represent funds outside** the internal account system
- **Handle external deposits/withdrawals** to/from the ledger
- **Maintain asset-level liquidity** information

**Key Characteristics:**
- One external account per asset per ledger
- Accessed via asset code (not UUID)
- Represent "external world" balances
- Critical for reconciliation and liquidity management

---

## 🚀 External Balance Checking Workflow

### Step 1: Asset Discovery ${list_all_assets ? '(Requested)' : '(Optional)'}
${list_all_assets || !asset_code ? `
**List Available Assets:**
Use: \`list-assets\` with:
- organization_id: "${organization_id}"
- ledger_id: "${ledger_id}"

**Expected Results:**
- Asset codes (USD, EUR, BTC, POINTS, etc.)
- Asset names and descriptions
- Asset configurations and metadata
- Active/inactive status

This helps you understand which external accounts exist.` : `
**Skip Asset Discovery** - Using specified asset: ${asset_code}
${asset_code ? `Proceeding directly to balance check for ${asset_code}` : ''}`}

### Step 2: External Account Retrieval
${asset_code ? `
**Get External Account for ${asset_code}:**
Use: External account retrieval with:
- organization_id: "${organization_id}"
- ledger_id: "${ledger_id}"
- asset_code: "${asset_code}"

**API Endpoint Pattern:**
\`GET /v1/organizations/{org_id}/ledgers/{ledger_id}/accounts/external/{asset_code}\`

**Expected Response:**
- External account ID and details
- Account type (usually "external" or "system")
- Asset code confirmation
- Account status and configuration` : `
**Get External Accounts for All Assets:**
For each asset found in Step 1, retrieve the external account details.
This gives you the complete external account structure.`}

### Step 3: External Balance Checking
${asset_code ? `
**Check External Balance for ${asset_code}:**
Use: External balance retrieval with:
- organization_id: "${organization_id}"
- ledger_id: "${ledger_id}"
- asset_code: "${asset_code}"

**API Endpoint Pattern:**
\`GET /v1/organizations/{org_id}/ledgers/{ledger_id}/accounts/external/{asset_code}/balances\`

**Balance Information:**
- **Available Balance:** Funds available for transactions
- **On Hold Balance:** Funds temporarily reserved
- **Scale:** Decimal precision for the asset
- **Version:** Balance version for concurrency control
- **Permissions:** Allow sending/receiving flags` : `
**Check External Balances for All Assets:**
For each asset code, check the external balance to get:
- Complete liquidity picture across all assets
- External vs internal balance comparison
- Asset-level fund availability`}

---

## 📊 Expected Results Format

**Single Asset Balance:**
\`\`\`json
{
  "assetCode": "${asset_code || 'USD'}",
  "available": 1000000,
  "onHold": 50000,
  "scale": 2,
  "accountType": "external",
  "allowSending": true,
  "allowReceiving": true,
  "version": 42,
  "updatedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Multi-Asset Summary:**
\`\`\`
External Balance Summary - ${new Date().toISOString()}
Organization: ${organization_id}
Ledger: ${ledger_id}

┌─────────────┬──────────────────┬─────────────────┬───────────┬────────────┐
│ Asset Code  │ Available        │ On Hold         │ Scale     │ Status     │
├─────────────┼──────────────────┼─────────────────┼───────────┼────────────┤
│ USD         │ 1,000,000.00     │ 50,000.00      │ 2         │ ✅ Active   │
│ EUR         │ 750,500.50       │ 25,000.00      │ 2         │ ✅ Active   │
│ BTC         │ 10.50000000      │ 0.00000000     │ 8         │ ✅ Active   │
└─────────────┴──────────────────┴─────────────────┴───────────┴────────────┘

Total External Liquidity:
• USD: $1,050,000.00 (Available + Hold)
• EUR: €775,500.50 (Available + Hold)  
• BTC: ₿10.50000000 (Available + Hold)
\`\`\`

## 💡 Business Intelligence

**What External Balances Tell You:**
- **Liquidity Position:** How much of each asset is available externally
- **Reserve Management:** Funds held for external obligations
- **Asset Distribution:** Which assets have external exposure
- **Operational Capacity:** Available funds for new external transactions

**Common Use Cases:**
- **Treasury Management:** Monitor external asset positions
- **Compliance Reporting:** External balance reconciliation
- **Liquidity Planning:** Understand available external funds
- **Risk Assessment:** External exposure by asset type

## 🎯 Next Steps

After checking external balances:
1. **Compare with Internal Balances:** Use \`list-accounts\` + \`get-balance\` for internal accounts
2. **Analyze Asset Distribution:** Understand internal vs external allocation
3. **Plan Transactions:** Use balance info for transaction planning
4. **Monitor Changes:** Set up regular external balance monitoring

**Commands I'll Execute:**
\`\`\`
${list_all_assets ? 'list-assets →' : ''} 
external-account-retrieval → external-balance-check
\`\`\`

Ready to check your external balances! 🚀`;

      return {
        description: `External balance check for ${asset_code || 'all assets'} in ledger`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: content
          }
        }]
      };
    }
  );

  // Chained Discovery - Intelligent hierarchy exploration
  server.prompt(
    "discover-midaz-hierarchy",
    "Explore the complete Midaz hierarchy: organizations → ledgers → assets → accounts → portfolios",
    {
      discovery_level: z.enum(["organizations", "ledgers", "assets", "accounts", "portfolios", "full"]).describe("How deep to explore the hierarchy"),
      organization_id: z.string().optional().describe("Focus on specific organization"),
      ledger_id: z.string().optional().describe("Focus on specific ledger"),
      show_counts: z.boolean().optional().describe("Include count statistics"),
      include_metadata: z.boolean().optional().describe("Include metadata in results")
    },
    async (args) => {
      const { discovery_level = "full", organization_id, ledger_id, show_counts = true, include_metadata = false } = args;
      
      let content = `# 🔍 Midaz Hierarchy Discovery

## ${discovery_level.toUpperCase()} Level Exploration

**Discovery Scope:** ${organization_id ? `Organization ${organization_id}` : 'All Organizations'}
${ledger_id ? `**Ledger Focus:** ${ledger_id}` : ''}
**Statistics:** ${show_counts ? 'Enabled' : 'Disabled'}
**Metadata:** ${include_metadata ? 'Included' : 'Excluded'}

---

`;

      // Phase 1: Organizations
      if (discovery_level === "organizations" || discovery_level === "full") {
        content += `### 🏢 Phase 1: Organizations Discovery

**Command:** \`list-organizations\`${show_counts ? ' (with statistics)' : ''}

**Expected Information:**
- Organization IDs and names
- Organization status and metadata${include_metadata ? ' (full metadata)' : ''}
${show_counts ? '- Count of ledgers per organization' : ''}
- Creation dates and last modified

**Analysis Points:**
- Which organizations are active?
- How are organizations structured?
- What metadata patterns exist?

`;
      }

      // Phase 2: Ledgers
      if ((discovery_level === "ledgers" || discovery_level === "full") && discovery_level !== "organizations") {
        content += `### 📚 Phase 2: Ledgers Discovery

${organization_id ? 
  `**Command:** \`list-ledgers\` with organization_id="${organization_id}"` :
  `**Command:** \`list-ledgers\` for each organization found`}

**Expected Information:**
- Ledger IDs, names, and descriptions
- Ledger configurations and settings
${show_counts ? '- Count of accounts and assets per ledger' : ''}
${include_metadata ? '- Full ledger metadata and configuration' : ''}

**Analysis Points:**
- How many ledgers per organization?
- What's the ledger naming/organization strategy?
- Are there different ledger types or purposes?

`;
      }

      // Phase 3: Assets
      if ((discovery_level === "assets" || discovery_level === "full") && !["organizations", "ledgers"].includes(discovery_level)) {
        content += `### 💎 Phase 3: Assets Discovery

${ledger_id ?
  `**Command:** \`list-assets\` with ledger_id="${ledger_id}"` :
  organization_id ?
    `**Command:** \`list-assets\` for all ledgers in organization` :
    `**Command:** \`list-assets\` for each ledger found`}

**Expected Information:**
- Asset codes and names (USD, EUR, BTC, etc.)
- Asset types and configurations
- Asset metadata and properties
${show_counts ? '- Usage statistics per asset' : ''}

**Analysis Points:**
- What currencies/tokens are supported?
- Are there custom assets or standard ones?
- How are assets distributed across ledgers?

`;
      }

      // Phase 4: Accounts
      if ((discovery_level === "accounts" || discovery_level === "full") && !["organizations", "ledgers", "assets"].includes(discovery_level)) {
        content += `### 💳 Phase 4: Accounts Discovery

**Command Pattern:** \`list-accounts\` with organization + ledger context

**Expected Information:**
- Account IDs, names, and types
- Account balances and asset holdings
- Account metadata and categorization
${show_counts ? '- Transaction counts per account' : ''}
${include_metadata ? '- Full account metadata and settings' : ''}

**Analysis Points:**
- What's the account structure/hierarchy?
- How are balances distributed?
- What account types are being used?
- Which accounts are most active?

`;
      }

      // Phase 5: Portfolios
      if ((discovery_level === "portfolios" || discovery_level === "full") && discovery_level !== "organizations") {
        content += `### 📁 Phase 5: Portfolios Discovery

**Command Pattern:** \`list-portfolios\` for organizational groupings

**Expected Information:**
- Portfolio IDs, names, and descriptions
- Portfolio account memberships
- Portfolio categorization and metadata
${show_counts ? '- Account counts and balance totals per portfolio' : ''}

**Analysis Points:**
- How are accounts organized into portfolios?
- What portfolio strategies are in use?
- Are portfolios used for business logic or just organization?

`;
      }

      // Results Section
      content += `## 📊 Discovery Results Format

**Hierarchical Structure:**
\`\`\`
Organizations (${organization_id ? '1 selected' : 'all'})
├── Ledgers (per organization)
│   ├── Assets (per ledger)
│   ├── Accounts (per ledger)
│   │   └── Balances (per account)
│   └── Portfolios (per ledger)
│       └── Account Groupings
\`\`\`

**Summary Statistics:**
${show_counts ? `
- Total Organizations: [count]
- Total Ledgers: [count] 
- Total Assets: [count]
- Total Accounts: [count]
- Total Portfolios: [count]
- Total Balance Value: [amount by asset]
` : '(Statistics disabled)'}

## 🎯 Discovery Workflow

**I'll execute this discovery in sequence:**

1. **Start with Organizations** → Get the foundation
2. **Explore Ledgers** → Understand structure  
3. **Map Assets** → See what's supported
4. **Analyze Accounts** → Review the data holders
5. **Check Portfolios** → Understand groupings
6. **Generate Report** → Comprehensive overview

**Commands Chain:**
\`\`\`
list-organizations → 
  for each org: list-ledgers → 
    for each ledger: list-assets + list-accounts + list-portfolios →
      for each account: get-balance
\`\`\`

This gives you a **complete picture** of your Midaz ecosystem! 🚀`;

      return {
        description: `Midaz hierarchy discovery - ${discovery_level} level`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: content
          }
        }]
      };
    }
  );

  // Comprehensive Tools Catalog
  server.prompt(
    "show-all-tools",
    "Display complete catalog of all Midaz MCP tools, operations, and parameters with descriptions",
    {
      category_filter: z.enum(["all", "financial", "documentation", "learning", "workflow", "discovery"]).optional().describe("Filter tools by category"),
      detail_level: z.enum(["summary", "detailed", "examples"]).optional().describe("Level of detail to show"),
      show_parameters: z.boolean().optional().describe("Include parameter details"),
      show_examples: z.boolean().optional().describe("Include usage examples")
    },
    async (args) => {
      const { category_filter = "all", detail_level = "detailed", show_parameters = true, show_examples = false } = args;
      
      const content = `# 🛠️ Complete Midaz MCP Tools Catalog

**Filter:** ${category_filter.toUpperCase()} | **Detail:** ${detail_level} | **Parameters:** ${show_parameters ? 'Yes' : 'No'} | **Examples:** ${show_examples ? 'Yes' : 'No'}

---

## 📋 Tool Categories Overview

${category_filter === "all" || category_filter === "financial" ? `
### 🏦 Financial API Tools (18 tools)
*Direct access to Midaz financial operations*

#### Organization Management
- **\`list-organizations\`** - List all organizations with pagination
  ${show_parameters ? `
  **Parameters:**
  - \`cursor\` (optional): Pagination cursor
  - \`limit\` (optional): Results per page (1-100, default: 10)` : ''}
  ${show_examples ? `
  **Example:** \`list-organizations\` with \`limit: 20\`` : ''}

- **\`get-organization\`** - Get specific organization details
  ${show_parameters ? `
  **Parameters:**
  - \`id\` (required): Organization UUID` : ''}

#### Ledger Management  
- **\`list-ledgers\`** - List ledgers for an organization
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization UUID
  - \`cursor\`, \`limit\` (optional): Pagination
  - \`start_date\`, \`end_date\` (optional): Date filters
  - \`metadata\` (optional): JSON metadata filter` : ''}

- **\`get-ledger\`** - Get specific ledger details
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization UUID
  - \`id\` (required): Ledger UUID` : ''}

#### Account Management
- **\`list-accounts\`** - List accounts in a ledger
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization UUID
  - \`ledger_id\` (required): Ledger UUID
  - \`cursor\`, \`limit\` (optional): Pagination
  - \`asset_code\` (optional): Filter by asset (USD, EUR, etc.)
  - \`type\` (optional): Account type filter
  - \`metadata\` (optional): JSON metadata filter` : ''}

- **\`get-account\`** - Get specific account details
- **\`get-balance\`** - Get account balance information

#### Transaction Management
- **\`list-transactions\`** - List transactions in a ledger
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization UUID
  - \`ledger_id\` (required): Ledger UUID
  - \`account_id\` (optional): Filter by account
  - \`cursor\`, \`limit\` (optional): Pagination
  - \`start_date\`, \`end_date\` (optional): Date filters` : ''}

- **\`get-transaction\`** - Get specific transaction details
- **\`list-operations\`** - List operations for an account
- **\`get-operation\`** - Get specific operation details

#### Asset Management
- **\`list-assets\`** - List assets in a ledger
- **\`get-asset\`** - Get specific asset details

#### Portfolio Management
- **\`list-portfolios\`** - List portfolios in a ledger
- **\`get-portfolio\`** - Get specific portfolio details

#### Segment Management
- **\`list-segments\`** - List segments in a ledger
- **\`get-segment\`** - Get specific segment details

#### SDK Tools
- **\`generate-sdk-code\`** - Generate production-ready SDK code
- **\`compare-sdk-features\`** - Compare Golang vs TypeScript SDKs
- **\`find-sdk-examples\`** - Find specific SDK code examples
` : ''}

${category_filter === "all" || category_filter === "documentation" ? `
### 📚 Documentation Tools (1 unified tool)
*Comprehensive documentation access*

- **\`midaz-docs\`** - Unified documentation access (13 operations)
  ${show_parameters ? `
  **Parameters:**
  - \`operation\` (required): Type of documentation
    - \`getting-started\` - New user setup
    - \`api-reference\` - API endpoint details
    - \`code-examples\` - Implementation examples
    - \`best-practices\` - Recommended patterns
    - \`architecture\` - System design docs
    - \`troubleshooting\` - Problem solving
    - \`search\` - Documentation search
    - And 6 more operations...
  - \`query\` (for search): Search terms
  - \`useCase\` (for examples): Specific scenario
  - \`language\` (for examples): Programming language` : ''}
` : ''}

${category_filter === "all" || category_filter === "learning" ? `
### 🎓 Learning Tools (1 unified tool)
*Interactive learning and tutorials*

- **\`midaz-learn\`** - Unified learning system (4 types)
  ${show_parameters ? `
  **Parameters:**
  - \`type\` (required): Learning interaction type
    - \`path\` - Personalized learning roadmap
    - \`tutorial\` - Hands-on practice sessions
    - \`concept\` - Deep concept explanations  
    - \`search\` - Learning-focused search
  - \`userRole\` (for path): developer, admin, business, explorer
  - \`experienceLevel\` (for path): beginner, intermediate, advanced
  - \`tutorialId\` (for tutorial): Specific tutorial name
  - \`concept\` (for concept): Concept to explain
  - \`query\` (for search): Learning question` : ''}
` : ''}

${category_filter === "all" || category_filter === "workflow" ? `
### 🧙‍♂️ Workflow Prompts (4 prompts)
*Interactive wizards and assistants*

- **\`create-transaction-wizard\`** - Step-by-step transaction creation
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (optional): Organization context
  - \`ledger_id\` (optional): Ledger context
  - \`transaction_type\` (optional): transfer, payment, deposit, withdrawal
  - \`step\` (optional): Current wizard step (1-5)` : ''}

- **\`debug-my-balance\`** - Balance troubleshooting assistant
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization to check
  - \`ledger_id\` (required): Ledger to check
  - \`account_id\` (optional): Specific account
  - \`issue_type\` (optional): wrong_balance, missing_transactions, etc.` : ''}

- **\`setup-my-org\`** - Organization setup wizard
  ${show_parameters ? `
  **Parameters:**
  - \`org_name\` (optional): Organization name
  - \`business_type\` (optional): fintech, gaming, ecommerce, etc.
  - \`setup_stage\` (optional): planning, organization, ledger, accounts, etc.` : ''}

- **\`explain-my-data\`** - Data analysis assistant
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization to analyze
  - \`ledger_id\` (optional): Specific ledger focus
  - \`analysis_type\` (optional): overview, balances, transactions, patterns
  - \`time_period\` (optional): today, week, month, quarter, all` : ''}
` : ''}

${category_filter === "all" || category_filter === "discovery" ? `
### 🔍 Discovery Prompts (3 prompts)
*Help and exploration tools*

- **\`help-me-start\`** - Quick start guide
  ${show_parameters ? '**Parameters:** None' : ''}

- **\`help-with-api\`** - API-specific guidance  
  ${show_parameters ? '**Parameters:** None' : ''}

- **\`help-me-learn\`** - Personalized learning paths
  ${show_parameters ? `
  **Parameters:**
  - \`role\` (optional): Your primary role
  - \`experience\` (optional): Your experience level` : ''}
` : ''}

${category_filter === "all" ? `
### 🚀 Advanced Workflow Prompts (NEW!)
*Intelligent data processing and discovery*

- **\`check-file-balances\`** - Multi-format file balance analysis (CSV/TXT/JSON)
  ${show_parameters ? `
  **Parameters:**
  - \`file_content\` (required): File content (CSV, TXT, or JSON)
  - \`file_type\` (optional): csv, txt, json, auto (default: auto-detect)
  - \`organization_hint\` (optional): Organization preference
  - \`ledger_hint\` (optional): Ledger preference
  - \`account_column\` (optional): CSV column with account IDs
  - \`json_path\` (optional): JSON path to account IDs
  - \`confirm_uuids\` (optional): For TXT files, confirm found UUIDs` : ''}

- **\`check-external-balance\`** - External account balance checker
  ${show_parameters ? `
  **Parameters:**
  - \`organization_id\` (required): Organization ID
  - \`ledger_id\` (required): Ledger ID  
  - \`asset_code\` (optional): Specific asset (USD, EUR, BTC, etc.)
  - \`list_all_assets\` (optional): List available assets first` : ''}

- **\`discover-midaz-hierarchy\`** - Complete hierarchy exploration
  ${show_parameters ? `
  **Parameters:**
  - \`discovery_level\` (optional): organizations, ledgers, assets, accounts, portfolios, full
  - \`organization_id\` (optional): Focus on specific organization
  - \`ledger_id\` (optional): Focus on specific ledger
  - \`show_counts\` (optional): Include statistics
  - \`include_metadata\` (optional): Include metadata` : ''}

- **\`show-all-tools\`** - This tools catalog prompt
  ${show_parameters ? `
  **Parameters:**
  - \`category_filter\` (optional): Filter by tool category
  - \`detail_level\` (optional): summary, detailed, examples
  - \`show_parameters\` (optional): Include parameter details
  - \`show_examples\` (optional): Include usage examples` : ''}
` : ''}

## 📊 Tool Statistics

**Total Tools Available:** ${category_filter === "financial" ? '18' : category_filter === "documentation" ? '1' : category_filter === "learning" ? '1' : category_filter === "workflow" ? '4' : category_filter === "discovery" ? '3' : '30+'} tools
**Total Operations:** ${category_filter === "all" ? '50+' : 'Varies by category'} operations
**Prompt Primitives:** ${category_filter === "all" ? '10' : category_filter === "workflow" || category_filter === "discovery" ? '7' : '0'} prompts

## 🎯 Common Usage Patterns

**Data Exploration Flow:**
\`\`\`
list-organizations → list-ledgers → list-accounts → get-balance
\`\`\`

**Transaction Creation Flow:**
\`\`\`
create-transaction-wizard (guides through entire process)
\`\`\`

**Learning Flow:**
\`\`\`
help-me-start → midaz-learn → midaz-docs → hands-on practice
\`\`\`

**Troubleshooting Flow:**
\`\`\`
debug-my-balance → explain-my-data → specific API tools
\`\`\`

## 💡 Pro Tips

- **Chain Operations:** Use discovery prompts to find IDs for specific API calls
- **Use Wizards:** Workflow prompts guide you through complex operations
- **Start Simple:** Begin with \`help-me-start\` if you're new
- **Explore Hierarchy:** Use \`discover-midaz-hierarchy\` to understand your setup
- **Batch Analysis:** Use \`check-csv-balances\` for bulk operations

**Need specific help with any tool?** Ask me to demonstrate any of these tools in action! 🚀`;

      return {
        description: `Complete tools catalog - ${category_filter} category`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: content
          }
        }]
      };
    }
  );

  logger.info('✅ Advanced workflow prompts registered');
};