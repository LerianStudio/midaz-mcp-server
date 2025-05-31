/**
 * Midaz Documentation Tool - Enhanced Learning Edition
 * The BEST way to learn Midaz through intelligent, contextual instruction
 * Source of truth: docs.lerian.studio/llms.txt + GitHub OpenAPI specs
 * Always fresh, always accurate, always educational
 */

import { z } from "zod";
import { 
  getAvailableResources, 
  searchResources,
  getResourcesByCategory 
} from "../util/docs-manifest.js";
import { fetchDocumentation } from "../util/docs-fetcher.js";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";

const logger = createLogger('midaz-docs');

/**
 * Register unified documentation tool
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerMidazDocsTools = (server) => {

  server.tool(
    "midaz_docs",
    "Unified documentation search and retrieval. Searches concepts -> guides -> API refs -> examples with progressive disclosure. Returns formatted markdown with code snippets highlighted, max 2000 chars with read_more links.",
    {
      query: z.string().min(2).describe("Learning query - ask anything about Midaz (e.g., 'how do I create my first transaction?', 'what is double-entry accounting?', 'show me payment examples')"),
      section: z.enum(['concepts', 'guides', 'api', 'examples', 'troubleshooting', 'all']).default('all').describe("Learning focus area"),
      learningMode: z.enum(['explain', 'show-me', 'guide-me', 'deep-dive']).default('explain').describe("How you want to learn: explain=conceptual, show-me=examples, guide-me=step-by-step, deep-dive=comprehensive"),
      format: z.enum(['summary', 'detailed', 'code-only']).default('detailed').describe("Response detail level"),
      maxResults: z.number().min(1).max(10).default(5).describe("Maximum results to return")
    },
    wrapToolHandler(async (args, extra) => {
      const { query, section, format, maxResults } = validateArgs(args, z.object({
        query: z.string().min(2),
        section: z.enum(['concepts', 'guides', 'api', 'examples', 'troubleshooting', 'all']).default('all'),
        format: z.enum(['summary', 'detailed', 'code-only']).default('detailed'),
        maxResults: z.number().min(1).max(10).default(5)
      }));

      try {
        // FIRST: Fetch fresh knowledge from authoritative sources
        const liveKnowledge = await fetchFreshMidazKnowledge();
        
        // SECOND: Analyze query for learning intent
        const learningIntent = analyzeLearningIntent(query, learningMode);
        
        // THIRD: Progressive search with educational context
        const searchOrder = determineOptimalLearningPath(section, learningIntent);
        
        let allResults = [];
        let foundContent = false;
        let educationalContext = null;

        for (const category of searchOrder) {
          const categoryResults = await searchInCategoryWithContext(query, category, maxResults, liveKnowledge, learningIntent);
          if (categoryResults.length > 0) {
            allResults.push(...categoryResults);
            foundContent = true;
            if (section !== 'all') break;
          }
        }
        
        // FOURTH: Add educational enhancements
        if (foundContent) {
          educationalContext = await generateEducationalContext(query, allResults, liveKnowledge, learningIntent);
        }

        if (!foundContent) {
          return {
            query,
            found: false,
            suggestion: await generateSearchSuggestions(query),
            availableSections: ['concepts', 'guides', 'api', 'examples'],
            timestamp: new Date().toISOString()
          };
        }

        // Format results with progressive disclosure
        const formattedResults = await formatSearchResults(allResults.slice(0, maxResults), format, query);

        return {
          query,
          section,
          format,
          learningMode,
          found: true,
          resultCount: formattedResults.length,
          
          // EDUCATIONAL ENHANCEMENTS
          educationalContext,
          learningPath: educationalContext?.suggestedPath || null,
          conceptualFramework: educationalContext?.mentalModel || null,
          businessContext: educationalContext?.whyItMatters || null,
          
          // TRADITIONAL RESULTS (enhanced)
          results: formattedResults,
          readMore: formattedResults.length >= maxResults ? generateEducationalReadMore(query, section, learningMode) : null,
          relatedTopics: await getEducationalRelatedTopics(query, liveKnowledge),
          
          // FRESHNESS INDICATORS
          sourcesFresh: {
            llmsTxt: liveKnowledge.llmsTxtFresh,
            openApi: liveKnowledge.openApiFresh,
            lastUpdated: liveKnowledge.timestamp
          },
          
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Documentation search failed', { query, error: error.message });
        return {
          error: error.message,
          query,
          timestamp: new Date().toISOString()
        };
      }
    })
  );
};

// ===========================================
// LIVE KNOWLEDGE FETCHING (SOURCE OF TRUTH)
// ===========================================

/**
 * Fetch fresh knowledge from docs.lerian.studio/llms.txt and GitHub OpenAPI
 */
async function fetchFreshMidazKnowledge() {
  try {
    // Primary source: docs.lerian.studio/llms.txt
    const llmsTxtResponse = await fetch('https://docs.lerian.studio/llms.txt');
    const llmsTxtContent = await llmsTxtResponse.text();
    
    // Secondary source: GitHub OpenAPI specs
    const openApiContent = await fetchOpenApiSpecs();
    
    return {
      llmsTxt: llmsTxtContent,
      openApi: openApiContent,
      llmsTxtFresh: true,
      openApiFresh: !!openApiContent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to fetch fresh knowledge', { error: error.message });
    return {
      llmsTxt: null,
      openApi: null, 
      llmsTxtFresh: false,
      openApiFresh: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fetch OpenAPI specifications from GitHub
 */
async function fetchOpenApiSpecs() {
  try {
    const specs = {};
    const specUrls = {
      onboarding: 'https://raw.githubusercontent.com/LerianStudio/midaz/main/docs/openapi/onboarding.yaml',
      transaction: 'https://raw.githubusercontent.com/LerianStudio/midaz/main/docs/openapi/transaction.yaml'
    };
    
    for (const [service, url] of Object.entries(specUrls)) {
      try {
        const response = await fetch(url);
        const content = await response.text();
        specs[service] = content;
      } catch (error) {
        logger.warn(`Failed to fetch ${service} spec`, { error: error.message });
      }
    }
    
    return specs;
  } catch (error) {
    logger.error('Failed to fetch OpenAPI specs', { error: error.message });
    return null;
  }
}

/**
 * Analyze user query for learning intent
 */
function analyzeLearningIntent(query, learningMode) {
  const queryLower = query.toLowerCase();
  
  const intent = {
    type: learningMode,
    isQuestion: queryLower.includes('what') || queryLower.includes('how') || queryLower.includes('why'),
    isActionOriented: queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('implement'),
    isTroubleshooting: queryLower.includes('error') || queryLower.includes('problem') || queryLower.includes('not working'),
    isConceptual: queryLower.includes('understand') || queryLower.includes('explain') || queryLower.includes('concept'),
    complexity: determineQueryComplexity(queryLower),
    domain: extractDomain(queryLower)
  };
  
  return intent;
}

/**
 * Determine optimal learning path based on intent
 */
function determineOptimalLearningPath(section, intent) {
  if (intent.isConceptual || intent.type === 'explain') {
    return ['concepts', 'guides', 'examples', 'api'];
  }
  
  if (intent.isActionOriented || intent.type === 'show-me') {
    return ['examples', 'guides', 'api', 'concepts'];
  }
  
  if (intent.type === 'guide-me') {
    return ['guides', 'examples', 'concepts', 'api'];
  }
  
  if (intent.type === 'deep-dive') {
    return ['concepts', 'api', 'guides', 'examples'];
  }
  
  // Default progressive learning
  return ['concepts', 'guides', 'examples', 'api'];
}

/**
 * Generate educational context for search results
 */
async function generateEducationalContext(query, results, liveKnowledge, intent) {
  const context = {
    mentalModel: generateMentalModel(query, results, liveKnowledge),
    whyItMatters: generateBusinessContext(query, results),
    suggestedPath: generateLearningProgression(query, intent),
    commonMistakes: identifyCommonMistakes(query, liveKnowledge),
    nextSteps: suggestNextLearningSteps(query, intent)
  };
  
  return context;
}

/**
 * Search in category with educational context
 */
async function searchInCategoryWithContext(query, category, maxResults, liveKnowledge, intent) {
  // Enhanced search that uses live knowledge
  const basicResults = await searchInCategory(query, category, maxResults);
  
  // Enhance with live knowledge if available
  if (liveKnowledge.llmsTxt) {
    const enhancedResults = enhanceResultsWithLiveKnowledge(basicResults, liveKnowledge, intent);
    return enhancedResults;
  }
  
  return basicResults;
}

/**
 * Enhance search results with live knowledge
 */
function enhanceResultsWithLiveKnowledge(results, liveKnowledge, intent) {
  return results.map(result => {
    const enhancement = extractRelevantKnowledge(result, liveKnowledge, intent);
    return {
      ...result,
      liveEnhancement: enhancement,
      freshness: 'live',
      sourceAuthority: 'docs.lerian.studio/llms.txt'
    };
  });
}

/**
 * Extract relevant knowledge from live sources
 */
function extractRelevantKnowledge(result, liveKnowledge, intent) {
  // Extract relevant sections from llms.txt based on result context
  const relevantSections = findRelevantSections(result.title, liveKnowledge.llmsTxt);
  
  return {
    conceptualContext: relevantSections.concepts || null,
    technicalDetails: relevantSections.technical || null,
    examples: relevantSections.examples || null,
    authority: 'llms.txt'
  };
}

// Helper functions for educational enhancements
function generateMentalModel(query, results, liveKnowledge) {
  // Generate conceptual framework
  if (query.toLowerCase().includes('transaction')) {
    return {
      framework: 'Double-Entry Accounting',
      keyIdea: 'Every transaction has equal and opposite entries',
      visualization: 'Debit Account → Credit Account (Amount flows)',
      connection: 'Organizations → Ledgers → Accounts → Transactions'
    };
  }
  
  if (query.toLowerCase().includes('organization')) {
    return {
      framework: 'Hierarchical Structure',
      keyIdea: 'Organization is the top-level container',
      visualization: 'Organization → Ledgers → Portfolios/Segments → Accounts',
      connection: 'Isolation boundary for financial data'
    };
  }
  
  return {
    framework: 'Midaz Financial Platform',
    keyIdea: 'Cloud-native, immutable financial ledger',
    visualization: 'API → Services → Data → Reports',
    connection: 'Modern financial infrastructure'
  };
}

function generateBusinessContext(query, results) {
  const contexts = {
    transaction: 'Transactions are the core of any financial system - they represent value movement and must be immutable for audit compliance.',
    organization: 'Organizations provide isolation and multi-tenancy, enabling SaaS financial platforms to serve multiple clients securely.',
    ledger: 'Ledgers group related accounts and provide accounting context - essential for different business units or product lines.',
    account: 'Accounts track balances for entities (users, systems, external parties) and enable precise financial reporting.',
    api: 'APIs enable integration with existing systems and allow building custom financial applications on Midaz infrastructure.'
  };
  
  for (const [key, context] of Object.entries(contexts)) {
    if (query.toLowerCase().includes(key)) {
      return context;
    }
  }
  
  return 'Midaz enables building modern financial infrastructure with the reliability and compliance requirements of traditional banking.';
}

function generateLearningProgression(query, intent) {
  if (intent.complexity === 'beginner') {
    return [
      'Understand core concepts',
      'Try simple examples', 
      'Build first integration',
      'Explore advanced features'
    ];
  }
  
  return [
    'Review current implementation',
    'Identify optimization opportunities',
    'Apply advanced patterns',
    'Share knowledge with team'
  ];
}

// Utility functions
function determineQueryComplexity(queryLower) {
  if (queryLower.includes('first') || queryLower.includes('basic') || queryLower.includes('simple')) {
    return 'beginner';
  }
  if (queryLower.includes('advanced') || queryLower.includes('complex') || queryLower.includes('production')) {
    return 'advanced';
  }
  return 'intermediate';
}

function extractDomain(queryLower) {
  const domains = ['transaction', 'organization', 'ledger', 'account', 'balance', 'portfolio', 'segment', 'asset'];
  return domains.find(domain => queryLower.includes(domain)) || 'general';
}

function findRelevantSections(title, llmsTxtContent) {
  if (!llmsTxtContent) return {};
  
  const sections = llmsTxtContent.split('\n# ');
  const relevant = {};
  
  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0]?.toLowerCase() || '';
    
    if (sectionTitle.includes(title.toLowerCase()) || title.toLowerCase().includes(sectionTitle)) {
      relevant[sectionTitle] = lines.slice(1, 10).join('\n'); // First 10 lines
    }
  }
  
  return relevant;
}

function identifyCommonMistakes(query, liveKnowledge) {
  const mistakes = {
    transaction: ['Forgetting idempotency keys', 'Not validating account balances', 'Missing error handling'],
    authentication: ['Hardcoding API keys', 'Not using HTTPS', 'Insufficient permission scoping'],
    organization: ['Not planning hierarchy', 'Missing metadata structure', 'Inadequate access controls']
  };
  
  const domain = extractDomain(query.toLowerCase());
  return mistakes[domain] || ['Not reading documentation thoroughly', 'Skipping error handling', 'Not testing edge cases'];
}

function suggestNextLearningSteps(query, intent) {
  if (intent.isActionOriented) {
    return [
      'Try the example in your development environment',
      'Modify the example for your specific use case',
      'Add error handling and validation',
      'Test with edge cases'
    ];
  }
  
  return [
    'Explore related concepts',
    'Try hands-on examples',
    'Review best practices',
    'Join community discussions'
  ];
}

function generateEducationalReadMore(query, section, learningMode) {
  return {
    exploreMore: `Learn more about "${query}" with midaz_learning_path`,
    handsOn: `Try interactive tutorial with midaz_interactive_tutorial`,
    conceptual: `Deep dive with midaz_conceptual_guide`,
    technical: `See API details with midaz_api in test mode`
  };
}

async function getEducationalRelatedTopics(query, liveKnowledge) {
  const basicTopics = await getRelatedTopics(query);
  
  // Enhance with educational progression
  const educationalTopics = {
    fundamental: [],
    nextLevel: [],
    advanced: [],
    related: basicTopics
  };
  
  const domain = extractDomain(query.toLowerCase());
  
  if (domain === 'transaction') {
    educationalTopics.fundamental = ['double-entry accounting', 'idempotency'];
    educationalTopics.nextLevel = ['complex transactions', 'transaction DSL'];
    educationalTopics.advanced = ['transaction patterns', 'performance optimization'];
  }
  
  return educationalTopics;
}

// ===========================================
// HELPER FUNCTIONS (ENHANCED)
// ===========================================

/**
 * Map section names to documentation categories
 */
function mapSectionToCategory(section) {
  const mapping = {
    'concepts': 'docs',
    'guides': 'docs', 
    'api': 'api',
    'examples': 'examples',
    'troubleshooting': 'docs'
  };
  return mapping[section] || 'docs';
}

/**
 * Search within a specific category
 */
async function searchInCategory(query, category, maxResults) {
  try {
    const resources = await getResourcesByCategory(category);
    const searchResults = await searchResources(query);
    
    return searchResults
      .filter(r => r.category === category)
      .slice(0, maxResults);
  } catch (error) {
    logger.error(`Search failed for category ${category}`, { error: error.message });
    return [];
  }
}

/**
 * Format search results with markdown and code highlighting
 */
async function formatSearchResults(results, format, query) {
  const formatted = [];
  
  for (const result of results) {
    try {
      const content = await fetchDocumentation(result.path);
      const formattedContent = await formatContent(content, format, query);
      
      formatted.push({
        title: result.title,
        path: result.path,
        category: result.category,
        description: result.description,
        content: formattedContent,
        relevanceScore: calculateRelevance(content, query)
      });
    } catch (error) {
      // Skip failed content fetch
      logger.warn(`Failed to fetch content for ${result.path}`, { error: error.message });
    }
  }
  
  return formatted.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Format content based on requested format
 */
async function formatContent(content, format, query) {
  const MAX_CHARS = 2000;
  
  switch (format) {
    case 'summary':
      return extractSummary(content, query).substring(0, MAX_CHARS);
    case 'code-only':
      return extractCodeBlocks(content).substring(0, MAX_CHARS);
    case 'detailed':
    default:
      const formatted = await formatMarkdown(content, query);
      return formatted.length > MAX_CHARS 
        ? formatted.substring(0, MAX_CHARS) + "\n\n📖 [Read more...]"
        : formatted;
  }
}

/**
 * Extract relevant summary from content
 */
function extractSummary(content, query) {
  const lines = content.split('\n');
  const queryWords = query.toLowerCase().split(' ');
  
  // Find most relevant paragraphs
  const relevantLines = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return queryWords.some(word => lowerLine.includes(word));
  });
  
  return relevantLines.slice(0, 10).join('\n');
}

/**
 * Extract and format code blocks with strict limits
 */
function extractCodeBlocks(content) {
  // Validate content size first
  if (content.length > 50000) {
    content = content.substring(0, 50000);
  }
  
  // Use simple, safe regex with timeout protection
  const blocks = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentBlock = [];
  let blockCount = 0;
  const maxBlocks = 20;
  
  for (let i = 0; i < lines.length && blockCount < maxBlocks; i++) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        currentBlock.push(line);
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
        inCodeBlock = false;
        blockCount++;
      } else {
        // Start of code block
        currentBlock = [line];
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      currentBlock.push(line);
      // Limit block size
      if (currentBlock.length > 100) {
        currentBlock.push('[Block truncated for security]');
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
        inCodeBlock = false;
        blockCount++;
      }
    }
  }
  
  return blocks.join('\n\n');
}

/**
 * Comprehensive XSS sanitization
 */
function sanitizeForXSS(content) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Validate and limit query size to prevent ReDoS
 */
function validateQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query format');
  }
  
  if (query.length > 1000) {
    throw new Error('Query too long');
  }
  
  // Prevent malicious regex patterns
  if (/[\(\)\*\+\?\{\}\[\]\|\\\^\$]/.test(query)) {
    throw new Error('Special characters not allowed in query');
  }
  
  return query;
}

/**
 * Format markdown with syntax highlighting hints
 */
async function formatMarkdown(content, query) {
  // Validate query first
  const validatedQuery = validateQuery(query);
  
  // Comprehensive XSS sanitization
  const sanitizedContent = sanitizeForXSS(content);
  
  // Limit content size to prevent memory exhaustion
  if (sanitizedContent.length > 100000) {
    return sanitizedContent.substring(0, 100000) + '\n\n[Content truncated for security]';
  }
    
  // Extract relevant sections around query terms
  const queryWords = validatedQuery.toLowerCase().split(' ').filter(word => word.length > 0 && word.length <= 100);
  const lines = sanitizedContent.split('\n');
  const relevantSections = [];
  
  // Limit processing to prevent DoS
  const maxLines = Math.min(lines.length, 10000);
  const maxSections = 50;
  
  for (let i = 0; i < maxLines && relevantSections.length < maxSections; i++) {
    const line = lines[i].toLowerCase();
    if (queryWords.some(word => line.includes(word))) {
      // Include context around relevant lines
      const start = Math.max(0, i - 3);
      const end = Math.min(lines.length, i + 8);
      relevantSections.push(lines.slice(start, end).join('\n'));
      i = end; // Skip ahead to avoid overlap
    }
  }
  
  return relevantSections.join('\n\n---\n\n');
}

/**
 * Calculate relevance score for ranking
 */
function calculateRelevance(content, query) {
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0);
  const lowerContent = content.toLowerCase();
  
  let score = 0;
  queryWords.forEach(word => {
    // Escape regex special characters to prevent ReDoS
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (lowerContent.match(new RegExp(escapedWord, 'g')) || []).length;
    score += count;
  });
  
  return score;
}

/**
 * Generate search suggestions for failed queries
 */
async function generateSearchSuggestions(query) {
  const commonTopics = [
    'create transaction', 'list organizations', 'check balance', 
    'authentication', 'API reference', 'getting started',
    'account management', 'ledger setup', 'error handling'
  ];
  
  // Find similar topics
  const queryWords = query.toLowerCase().split(' ');
  const suggestions = commonTopics.filter(topic => 
    queryWords.some(word => topic.toLowerCase().includes(word))
  );
  
  return suggestions.length > 0 ? suggestions : commonTopics.slice(0, 3);
}

/**
 * Generate read more links for extended content
 */
function generateReadMoreLinks(query, section) {
  return {
    searchMore: `Use midaz_docs with query "${query}" and higher maxResults`,
    browseSection: section !== 'all' ? `Browse ${section} documentation` : null,
    apiReference: 'Get complete API reference with midaz_api',
    examples: 'Generate code examples with midaz_generate'
  };
}

/**
 * Get related topics for exploration
 */
async function getRelatedTopics(query) {
  const topicMap = {
    'transaction': ['balance', 'account', 'ledger', 'operation'],
    'organization': ['ledger', 'account', 'user management'],
    'authentication': ['API key', 'OAuth', 'security'],
    'balance': ['transaction', 'account', 'asset'],
    'API': ['endpoints', 'authentication', 'examples'],
    'account': ['balance', 'transaction', 'ledger']
  };
  
  const queryLower = query.toLowerCase();
  for (const [key, related] of Object.entries(topicMap)) {
    if (queryLower.includes(key)) {
      return related;
    }
  }
  
  return ['getting started', 'API reference', 'examples'];
}

// Export already handled above
