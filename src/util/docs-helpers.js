/**
 * Documentation Helper Functions
 * Supporting utilities for comprehensive documentation tools
 */

import { createLogger } from './mcp-logging.js';
import { getAvailableResources, getResourcesByCategory } from './docs-manifest.js';
import { fetchDocumentation } from './docs-fetcher.js';

const logger = createLogger('docs-helpers');

// ===========================================
// CONTENT EXTRACTION HELPERS
// ===========================================

/**
 * Extract best practices from content
 */
export function extractBestPractices(content, category) {
  if (!content) return [];
  
  const practices = [];
  const lines = content.split('\n');
  
  // Look for sections with best practices keywords
  const practiceKeywords = ['best practice', 'recommendation', 'should', 'avoid', 'prefer'];
  const categoryKeywords = {
    security: ['security', 'auth', 'token', 'encryption', 'ssl', 'tls'],
    performance: ['performance', 'optimization', 'speed', 'latency', 'cache'],
    architecture: ['architecture', 'design', 'pattern', 'structure', 'component']
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if line contains practice keywords and category keywords
    const hasPracticeKeyword = practiceKeywords.some(keyword => line.includes(keyword));
    const hasCategoryKeyword = category === 'all' || 
      (categoryKeywords[category] && categoryKeywords[category].some(keyword => line.includes(keyword)));
    
    if (hasPracticeKeyword && hasCategoryKeyword) {
      // Extract the practice (current line and potentially next few lines)
      let practice = lines[i].trim();
      let j = i + 1;
      
      // Continue reading while lines seem to be part of the same practice
      while (j < lines.length && 
             lines[j].trim() && 
             !lines[j].match(/^#+/) && 
             lines[j].length < 200) {
        practice += ' ' + lines[j].trim();
        j++;
      }
      
      practices.push({
        text: practice,
        category,
        line: i + 1,
        confidence: calculatePracticeConfidence(practice, category)
      });
    }
  }
  
  return practices.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate confidence score for a practice
 */
function calculatePracticeConfidence(practice, category) {
  let score = 0;
  const text = practice.toLowerCase();
  
  // Keywords that increase confidence
  const strongKeywords = ['must', 'always', 'never', 'critical', 'important', 'required'];
  const mediumKeywords = ['should', 'recommended', 'prefer', 'avoid', 'consider'];
  
  strongKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 3;
  });
  
  mediumKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 2;
  });
  
  // Length penalty for very long practices
  if (practice.length > 300) score -= 1;
  
  return Math.max(0, score);
}

/**
 * Generate data modeling best practices
 */
export async function generateDataModelingPractices() {
  return [
    {
      title: "Entity Hierarchy",
      description: "Follow the Organization → Ledger → Account → Transaction hierarchy",
      example: "Always create organizations before ledgers, ledgers before accounts",
      category: "data-modeling",
      importance: "critical"
    },
    {
      title: "Asset Consistency",
      description: "Ensure asset codes are consistent across all operations",
      example: "Use standardized codes like 'USD', 'EUR', not 'Dollar', 'Euro'",
      category: "data-modeling",
      importance: "high"
    },
    {
      title: "Balance Integrity",
      description: "Double-entry bookkeeping ensures balance integrity",
      example: "Every debit must have a corresponding credit of equal amount",
      category: "data-modeling",
      importance: "critical"
    }
  ];
}

/**
 * Generate error handling best practices
 */
export async function generateErrorHandlingPractices() {
  return [
    {
      title: "HTTP Status Codes",
      description: "Handle all HTTP status codes appropriately",
      example: "400 for validation errors, 401 for auth errors, 409 for conflicts",
      category: "error-handling",
      importance: "high"
    },
    {
      title: "Retry Logic",
      description: "Implement exponential backoff for retryable errors",
      example: "Retry on 5xx errors, not on 4xx errors except 429",
      category: "error-handling",
      importance: "medium"
    },
    {
      title: "Error Logging",
      description: "Log errors with sufficient context for debugging",
      example: "Include request ID, user ID, and error details",
      category: "error-handling",
      importance: "high"
    }
  ];
}

/**
 * Format best practices according to specified format
 */
export function formatBestPractices(practices, format, topic) {
  if (topic !== 'all') {
    practices = { [topic]: practices[topic] || [] };
  }
  
  switch (format) {
    case 'checklist':
      return formatAsChecklist(practices);
    case 'examples':
      return formatAsExamples(practices);
    case 'guide':
    default:
      return formatAsGuide(practices);
  }
}

/**
 * Format practices as checklist
 */
function formatAsChecklist(practices) {
  const checklist = {};
  
  for (const [category, items] of Object.entries(practices)) {
    checklist[category] = items.map(item => ({
      check: `☐ ${item.title || item.text}`,
      description: item.description || item.text,
      importance: item.importance || 'medium'
    }));
  }
  
  return checklist;
}

/**
 * Format practices as examples
 */
function formatAsExamples(practices) {
  const examples = {};
  
  for (const [category, items] of Object.entries(practices)) {
    examples[category] = items
      .filter(item => item.example)
      .map(item => ({
        practice: item.title || item.text,
        example: item.example,
        explanation: item.description
      }));
  }
  
  return examples;
}

/**
 * Format practices as guide
 */
function formatAsGuide(practices) {
  const guide = {};
  
  for (const [category, items] of Object.entries(practices)) {
    guide[category] = {
      overview: `Best practices for ${category.replace('-', ' ')}`,
      practices: items.map(item => ({
        title: item.title || extractTitle(item.text),
        description: item.description || item.text,
        example: item.example,
        importance: item.importance || 'medium',
        category: item.category || category
      }))
    };
  }
  
  return guide;
}

// ===========================================
// ARCHITECTURE HELPERS
// ===========================================

/**
 * Extract architecture overview from content
 */
export function extractArchitectureOverview(content) {
  if (!content) return null;
  
  return {
    systemOverview: extractSection(content, 'overview'),
    keyComponents: extractComponents(content),
    designPrinciples: extractDesignPrinciples(content),
    scalability: extractSection(content, 'scalability'),
    security: extractSection(content, 'security')
  };
}

/**
 * Extract components from architecture content
 */
function extractComponents(content) {
  const components = [];
  const lines = content.split('\n');
  
  // Look for component descriptions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for service/component headers
    if (line.match(/^#+.*?(service|component|module)/i)) {
      const name = line.replace(/^#+\s*/, '').trim();
      const description = extractFollowingContent(lines, i, 3);
      
      components.push({
        name,
        description,
        type: determineComponentType(name)
      });
    }
  }
  
  return components;
}

/**
 * Extract design principles
 */
function extractDesignPrinciples(content) {
  const principles = [];
  const lines = content.split('\n');
  
  const principleKeywords = ['principle', 'pattern', 'approach', 'philosophy'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (principleKeywords.some(keyword => line.includes(keyword))) {
      const principle = extractFollowingContent(lines, i, 2);
      if (principle.length > 20) {
        principles.push(principle);
      }
    }
  }
  
  return principles;
}

/**
 * Get component architecture details
 */
export async function getComponentArchitecture(componentsResources) {
  const components = [];
  
  for (const resource of componentsResources) {
    try {
      const content = await fetchDocumentation(resource.path);
      
      components.push({
        name: resource.title,
        path: resource.path,
        description: resource.description,
        architecture: extractComponentArchitecture(content),
        apis: extractComponentAPIs(content),
        dependencies: extractDependencies(content)
      });
    } catch (error) {
      logger.warn('Failed to load component architecture', { 
        component: resource.title, 
        error: error.message 
      });
      
      components.push({
        name: resource.title,
        path: resource.path,
        description: resource.description,
        error: error.message
      });
    }
  }
  
  return components;
}

/**
 * Get infrastructure architecture
 */
export async function getInfrastructureArchitecture() {
  const infraResources = await getResourcesByCategory('infra');
  const infrastructure = {};
  
  for (const resource of infraResources) {
    try {
      const content = await fetchDocumentation(resource.path);
      const serviceName = extractServiceName(resource.title);
      
      infrastructure[serviceName] = {
        name: resource.title,
        description: resource.description,
        purpose: extractPurpose(content),
        configuration: extractConfiguration(content),
        monitoring: extractMonitoring(content)
      };
    } catch (error) {
      logger.warn('Failed to load infrastructure component', { 
        component: resource.title, 
        error: error.message 
      });
    }
  }
  
  return infrastructure;
}

/**
 * Extract data flow from architecture content
 */
export function extractDataFlow(content) {
  if (!content) return [];
  
  const flows = [];
  const lines = content.split('\n');
  
  // Look for flow descriptions
  const flowKeywords = ['flow', 'process', 'workflow', 'pipeline', 'sequence'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (flowKeywords.some(keyword => line.includes(keyword))) {
      const flowDescription = extractFollowingContent(lines, i, 5);
      
      if (flowDescription.length > 50) {
        flows.push({
          title: lines[i].replace(/^#+\s*/, '').trim(),
          description: flowDescription,
          steps: extractSteps(flowDescription)
        });
      }
    }
  }
  
  return flows;
}

/**
 * Extract integration patterns
 */
export function extractIntegrationPatterns(content) {
  if (!content) return [];
  
  const patterns = [];
  const integrationKeywords = ['integration', 'api', 'webhook', 'event', 'message'];
  
  // This would extract integration patterns from the content
  // Implementation would be similar to other extraction functions
  
  return patterns;
}

/**
 * Filter architecture data by depth level
 */
export function filterByDepth(architectureData, depth) {
  switch (depth) {
    case 'high-level':
      return {
        overview: architectureData.overview,
        components: architectureData.components?.map(c => ({
          name: c.name,
          description: c.description
        }))
      };
    
    case 'technical':
      return architectureData; // Return everything
    
    case 'detailed':
    default:
      // Return most fields but not the most technical details
      const filtered = { ...architectureData };
      if (filtered.components) {
        filtered.components = filtered.components.map(c => ({
          ...c,
          // Remove overly technical details
          implementation: undefined
        }));
      }
      return filtered;
  }
}

/**
 * Get related components
 */
export function getRelatedComponents(component, allComponents) {
  return allComponents.filter(c => 
    c.name !== component.name && 
    (c.dependencies?.includes(component.name) || 
     component.dependencies?.includes(c.name))
  );
}

/**
 * Get architecture diagrams
 */
export async function getArchitectureDiagrams(component) {
  // This would return ASCII diagrams or references to diagrams
  const diagrams = {
    systemOverview: generateSystemDiagram(),
    dataFlow: generateDataFlowDiagram(),
    componentInteraction: component ? generateComponentDiagram(component) : null
  };
  
  return diagrams;
}

// ===========================================
// SDK DOCUMENTATION HELPERS
// ===========================================

/**
 * Generate SDK documentation
 */
export async function generateSDKDocumentation(language, section, includeExamples) {
  const sdkData = {
    go: {
      installation: generateGoInstallation(),
      quickstart: generateGoQuickstart(),
      apiReference: generateGoAPIReference(),
      examples: includeExamples ? generateGoExamples() : null
    },
    typescript: {
      installation: generateTSInstallation(),
      quickstart: generateTSQuickstart(),
      apiReference: generateTSAPIReference(),
      examples: includeExamples ? generateTSExamples() : null
    }
  };
  
  if (language === 'both') {
    return sdkData;
  }
  
  const langData = sdkData[language];
  if (section === 'all') {
    return langData;
  }
  
  return { [section]: langData[section] };
}

/**
 * Get SDK examples
 */
export async function getSDKExamples(language) {
  const examples = {
    go: {
      basicUsage: generateGoExample('basic'),
      authentication: generateGoExample('auth'),
      errorHandling: generateGoExample('error')
    },
    typescript: {
      basicUsage: generateTSExample('basic'),
      authentication: generateTSExample('auth'),
      errorHandling: generateTSExample('error')
    }
  };
  
  return language === 'both' ? examples : examples[language];
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Extract section content from documentation
 */
function extractSection(content, sectionName) {
  if (!content) return null;
  
  const lines = content.split('\n');
  const sectionRegex = new RegExp(`^#+\\s*${sectionName}`, 'i');
  let startIndex = -1;
  let endIndex = lines.length;
  
  // Find section start
  for (let i = 0; i < lines.length; i++) {
    if (sectionRegex.test(lines[i])) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) return null;
  
  // Find section end
  const headerLevel = (lines[startIndex].match(/^#+/) || [''])[0].length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#+/) && line.match(/^#+/)[0].length <= headerLevel) {
      endIndex = i;
      break;
    }
  }
  
  return lines.slice(startIndex, endIndex).join('\n');
}

/**
 * Extract following content after a line
 */
function extractFollowingContent(lines, startIndex, maxLines) {
  const endIndex = Math.min(startIndex + maxLines + 1, lines.length);
  const content = lines.slice(startIndex + 1, endIndex)
    .filter(line => line.trim())
    .join(' ');
  
  return content.trim();
}

/**
 * Extract title from text
 */
function extractTitle(text) {
  const firstSentence = text.split('.')[0];
  return firstSentence.length > 50 ? 
    firstSentence.substring(0, 50) + '...' : 
    firstSentence;
}

/**
 * Determine component type
 */
function determineComponentType(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('service')) return 'service';
  if (lowerName.includes('api')) return 'api';
  if (lowerName.includes('database') || lowerName.includes('db')) return 'database';
  if (lowerName.includes('cache')) return 'cache';
  if (lowerName.includes('queue') || lowerName.includes('message')) return 'messaging';
  if (lowerName.includes('gateway')) return 'gateway';
  
  return 'component';
}

/**
 * Extract service name from title
 */
function extractServiceName(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract purpose from content
 */
function extractPurpose(content) {
  const purposeSection = extractSection(content, 'purpose') || 
                        extractSection(content, 'overview') ||
                        content.split('\n').slice(0, 3).join(' ');
  
  return purposeSection ? purposeSection.substring(0, 200) : null;
}

/**
 * Extract configuration from content
 */
function extractConfiguration(content) {
  return extractSection(content, 'configuration') ||
         extractSection(content, 'setup') ||
         extractSection(content, 'config');
}

/**
 * Extract monitoring information
 */
function extractMonitoring(content) {
  return extractSection(content, 'monitoring') ||
         extractSection(content, 'metrics') ||
         extractSection(content, 'observability');
}

/**
 * Extract steps from flow description
 */
function extractSteps(description) {
  const steps = [];
  const lines = description.split('\n');
  
  for (const line of lines) {
    // Look for numbered steps or bullet points
    if (line.match(/^\d+\./) || line.match(/^[-*]\s/)) {
      steps.push(line.replace(/^\d+\.\s*|^[-*]\s*/, '').trim());
    }
  }
  
  return steps;
}

/**
 * Extract component architecture
 */
function extractComponentArchitecture(content) {
  return {
    overview: extractSection(content, 'architecture'),
    patterns: extractSection(content, 'patterns'),
    structure: extractSection(content, 'structure')
  };
}

/**
 * Extract component APIs
 */
function extractComponentAPIs(content) {
  const apis = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Look for API endpoint patterns
    const apiMatch = line.match(/(GET|POST|PUT|PATCH|DELETE)\s+(.+)/);
    if (apiMatch) {
      apis.push({
        method: apiMatch[1],
        path: apiMatch[2].trim()
      });
    }
  }
  
  return apis;
}

/**
 * Extract dependencies
 */
function extractDependencies(content) {
  const dependencies = [];
  const dependencyKeywords = ['depends on', 'requires', 'uses', 'connects to'];
  
  const lines = content.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of dependencyKeywords) {
      if (lowerLine.includes(keyword)) {
        // Extract what comes after the keyword
        const parts = line.split(new RegExp(keyword, 'i'));
        if (parts.length > 1) {
          dependencies.push(parts[1].trim());
        }
      }
    }
  }
  
  return dependencies;
}

// Placeholder implementations for SDK generation functions
function generateGoInstallation() {
  return `go get github.com/lerianstudio/midaz-go-sdk`;
}

function generateTSInstallation() {
  return `npm install @midaz/typescript-sdk`;
}

function generateGoQuickstart() {
  return `package main
import "github.com/lerianstudio/midaz-go-sdk"
// Quick start example...`;
}

function generateTSQuickstart() {
  return `import { MidazClient } from '@midaz/typescript-sdk';
// Quick start example...`;
}

function generateGoAPIReference() {
  return "Go API reference documentation...";
}

function generateTSAPIReference() {
  return "TypeScript API reference documentation...";
}

function generateGoExamples() {
  return {
    basic: "Go basic example...",
    auth: "Go auth example...",
    error: "Go error handling example..."
  };
}

function generateTSExamples() {
  return {
    basic: "TypeScript basic example...",
    auth: "TypeScript auth example...",
    error: "TypeScript error handling example..."
  };
}

function generateGoExample(type) {
  return `Go ${type} example...`;
}

function generateTSExample(type) {
  return `TypeScript ${type} example...`;
}

function generateSystemDiagram() {
  return `
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Gateway   │───▶│   Services  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Database   │    │    Cache    │
                   └─────────────┘    └─────────────┘
`;
}

function generateDataFlowDiagram() {
  return "Data flow diagram...";
}

function generateComponentDiagram(component) {
  return `Component diagram for ${component}...`;
}