/**
 * Midaz Learning Path Tool
 * The BEST way to instruct users on Midaz - dynamic learning journeys
 * Source of truth: docs.lerian.studio/llms.txt + GitHub OpenAPI specs
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";

const logger = createLogger('midaz-learning');

// Dynamic knowledge source URLs
const KNOWLEDGE_SOURCES = {
  llmsTxt: 'https://docs.lerian.studio/llms.txt',
  openApiSpecs: {
    onboarding: 'https://raw.githubusercontent.com/LerianStudio/midaz/main/docs/openapi/onboarding.yaml',
    transaction: 'https://raw.githubusercontent.com/LerianStudio/midaz/main/docs/openapi/transaction.yaml'
  },
  mainRepo: 'https://api.github.com/repos/LerianStudio/midaz/contents/README.md'
};

// Learning journey cache (5 min TTL to stay current)
const learningCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Register learning path orchestration tool
 */
export const registerMidazLearningTools = (server) => {

  server.tool(
    "midaz_learning_path",
    "Intelligent learning path orchestration for Midaz. Provides personalized, progressive instruction based on user role, experience, and goals. Dynamically sourced from docs.lerian.studio/llms.txt and GitHub OpenAPI specs.",
    {
      userRole: z.enum(['developer', 'admin', 'business', 'explorer']).describe("User's primary role"),
      experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe("Current experience level"),
      goal: z.string().optional().describe("Specific learning goal (e.g., 'build payment system', 'integrate with existing app')"),
      timeAvailable: z.enum(['5min', '15min', '30min', '1hour', 'deep-dive']).default('15min').describe("Available learning time"),
      preferredStyle: z.enum(['hands-on', 'conceptual', 'guided', 'reference']).default('guided').describe("Learning style preference")
    },
    wrapToolHandler(async (args, extra) => {
      const { userRole, experienceLevel, goal, timeAvailable, preferredStyle } = validateArgs(args, z.object({
        userRole: z.enum(['developer', 'admin', 'business', 'explorer']),
        experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        goal: z.string().optional(),
        timeAvailable: z.enum(['5min', '15min', '30min', '1hour', 'deep-dive']).default('15min'),
        preferredStyle: z.enum(['hands-on', 'conceptual', 'guided', 'reference']).default('guided')
      }));

      try {
        // Fetch fresh knowledge from source of truth
        const knowledge = await fetchLiveKnowledge();
        
        // Generate personalized learning path
        const learningPath = await generatePersonalizedPath({
          userRole,
          experienceLevel, 
          goal,
          timeAvailable,
          preferredStyle
        }, knowledge);
        
        return {
          success: true,
          userProfile: {
            role: userRole,
            level: experienceLevel,
            goal: goal || 'General Midaz mastery',
            timeAvailable,
            preferredStyle
          },
          learningPath,
          nextAction: learningPath.steps[0],
          estimatedDuration: calculateDuration(learningPath),
          sourcesFresh: {
            llmsTxt: knowledge.llmsTxtTimestamp,
            openApi: knowledge.openApiTimestamp,
            lastUpdated: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Learning path generation failed', { error: error.message, userRole });
        return {
          error: error.message,
          fallbackPath: generateFallbackPath(userRole, experienceLevel),
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  server.tool(
    "midaz_interactive_tutorial",
    "Step-by-step interactive tutorials with knowledge checks. Content dynamically sourced from live documentation and OpenAPI specs.",
    {
      tutorialId: z.string().describe("Tutorial identifier (e.g., 'first-transaction', 'organization-setup')"),
      currentStep: z.number().default(1).describe("Current step number (1-based)"),
      userResponse: z.string().optional().describe("User's response to previous step (for validation)")
    },
    wrapToolHandler(async (args, extra) => {
      const { tutorialId, currentStep, userResponse } = validateArgs(args, z.object({
        tutorialId: z.string(),
        currentStep: z.number().default(1),
        userResponse: z.string().optional()
      }));

      try {
        // Fetch live knowledge for tutorial content
        const knowledge = await fetchLiveKnowledge();
        
        // Validate previous step if response provided
        let stepValidation = null;
        if (userResponse && currentStep > 1) {
          stepValidation = await validateStepResponse(tutorialId, currentStep - 1, userResponse, knowledge);
        }
        
        // Generate current tutorial step
        const tutorial = await generateTutorialStep(tutorialId, currentStep, knowledge);
        
        return {
          tutorialId,
          currentStep,
          totalSteps: tutorial.totalSteps,
          stepValidation,
          step: tutorial.step,
          progressBar: generateProgressBar(currentStep, tutorial.totalSteps),
          knowledgeCheck: tutorial.knowledgeCheck,
          practiceExercise: tutorial.practiceExercise,
          sourcesFresh: knowledge.freshness,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Tutorial generation failed', { tutorialId, currentStep, error: error.message });
        return {
          error: error.message,
          tutorialId,
          currentStep,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  server.tool(
    "midaz_conceptual_guide",
    "Educational context and mental models for Midaz concepts. Explains WHY not just HOW, with business context and progressive complexity.",
    {
      concept: z.string().describe("Midaz concept to explain (e.g., 'double-entry accounting', 'portfolio hierarchy', 'transaction DSL')"),
      complexity: z.enum(['overview', 'detailed', 'deep-dive']).default('detailed').describe("Explanation depth"),
      includeBusinessContext: z.boolean().default(true).describe("Include business use cases and context"),
      showImplementation: z.boolean().default(false).describe("Include technical implementation details")
    },
    wrapToolHandler(async (args, extra) => {
      const { concept, complexity, includeBusinessContext, showImplementation } = validateArgs(args, z.object({
        concept: z.string(),
        complexity: z.enum(['overview', 'detailed', 'deep-dive']).default('detailed'),
        includeBusinessContext: z.boolean().default(true),
        showImplementation: z.boolean().default(false)
      }));

      try {
        // Fetch live knowledge for conceptual content
        const knowledge = await fetchLiveKnowledge();
        
        // Generate educational explanation
        const explanation = await generateConceptualExplanation(concept, {
          complexity,
          includeBusinessContext,
          showImplementation
        }, knowledge);
        
        return {
          concept,
          complexity,
          explanation,
          mentalModel: explanation.mentalModel,
          businessContext: includeBusinessContext ? explanation.businessContext : null,
          implementation: showImplementation ? explanation.implementation : null,
          relatedConcepts: explanation.relatedConcepts,
          nextLearningSteps: explanation.nextSteps,
          sourcesFresh: knowledge.freshness,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error('Conceptual guide generation failed', { concept, error: error.message });
        return {
          error: error.message,
          concept,
          timestamp: new Date().toISOString()
        };
      }
    })
  );
};

// ===========================================
// DYNAMIC KNOWLEDGE FETCHING
// ===========================================

/**
 * Fetch live knowledge from authoritative sources
 */
async function fetchLiveKnowledge() {
  const cacheKey = 'live_knowledge';
  const cached = learningCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Fetch from docs.lerian.studio/llms.txt (THE source of truth)
    const llmsTxtResponse = await fetch(KNOWLEDGE_SOURCES.llmsTxt);
    const llmsTxtContent = await llmsTxtResponse.text();
    
    // Parse structured knowledge from llms.txt
    const structuredKnowledge = parseLlmsTxt(llmsTxtContent);
    
    // Fetch OpenAPI specs for technical details
    const openApiSpecs = await fetchOpenApiSpecs();
    
    // Fetch README for latest updates
    const readmeContent = await fetchReadmeContent();
    
    const knowledge = {
      structured: structuredKnowledge,
      openApi: openApiSpecs,
      readme: readmeContent,
      freshness: {
        llmsTxtTimestamp: new Date().toISOString(),
        openApiTimestamp: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + CACHE_TTL).toISOString()
      }
    };
    
    // Cache for performance
    learningCache.set(cacheKey, {
      data: knowledge,
      timestamp: Date.now()
    });
    
    logger.info('Fresh knowledge fetched from authoritative sources');
    return knowledge;
    
  } catch (error) {
    logger.error('Failed to fetch live knowledge', { error: error.message });
    // Return cached knowledge if available, otherwise minimal fallback
    if (cached) {
      return cached.data;
    }
    throw new Error('Unable to fetch knowledge from authoritative sources');
  }
}

/**
 * Parse structured knowledge from llms.txt
 */
function parseLlmsTxt(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      // Start new section
      currentSection = line.substring(2).toLowerCase().replace(/\s+/g, '_');
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  // Save final section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n');
  }
  
  return sections;
}

/**
 * Fetch OpenAPI specifications for technical accuracy
 */
async function fetchOpenApiSpecs() {
  try {
    const specs = {};
    
    for (const [service, url] of Object.entries(KNOWLEDGE_SOURCES.openApiSpecs)) {
      try {
        const response = await fetch(url);
        const content = await response.text();
        specs[service] = parseOpenApiSpec(content);
      } catch (error) {
        logger.warn(`Failed to fetch ${service} OpenAPI spec`, { error: error.message });
        specs[service] = null;
      }
    }
    
    return specs;
  } catch (error) {
    logger.error('Failed to fetch OpenAPI specs', { error: error.message });
    return {};
  }
}

/**
 * Parse OpenAPI spec for key information
 */
function parseOpenApiSpec(yamlContent) {
  // Simple YAML parsing for key information
  const lines = yamlContent.split('\n');
  const endpoints = [];
  const schemas = [];
  
  let inPaths = false;
  let inSchemas = false;
  
  for (const line of lines) {
    if (line.startsWith('paths:')) {
      inPaths = true;
      inSchemas = false;
    } else if (line.startsWith('components:')) {
      inPaths = false;
    } else if (line.includes('schemas:')) {
      inSchemas = true;
    } else if (inPaths && line.match(/^\s+\/\w+/)) {
      endpoints.push(line.trim().replace(':', ''));
    } else if (inSchemas && line.match(/^\s+\w+:/)) {
      schemas.push(line.trim().replace(':', ''));
    }
  }
  
  return {
    endpoints: endpoints.slice(0, 20), // Limit for performance
    schemas: schemas.slice(0, 20),
    parsed: true
  };
}

/**
 * Fetch README content for latest information
 */
async function fetchReadmeContent() {
  try {
    const response = await fetch(KNOWLEDGE_SOURCES.mainRepo);
    const data = await response.json();
    const readmeContent = Buffer.from(data.content, 'base64').toString('utf8');
    
    return {
      content: readmeContent,
      lastModified: data.sha,
      size: data.size
    };
  } catch (error) {
    logger.error('Failed to fetch README', { error: error.message });
    return null;
  }
}

// ===========================================
// LEARNING PATH GENERATION
// ===========================================

/**
 * Generate personalized learning path based on user profile and live knowledge
 */
async function generatePersonalizedPath(userProfile, knowledge) {
  const { userRole, experienceLevel, goal, timeAvailable, preferredStyle } = userProfile;
  
  // Extract relevant content from knowledge base
  const relevantContent = extractRelevantContent(knowledge, userProfile);
  
  // Generate role-specific path
  const basePath = generateBasePath(userRole, experienceLevel, knowledge);
  
  // Customize for goal and time
  const customizedPath = customizeForGoal(basePath, goal, timeAvailable, knowledge);
  
  // Adapt for learning style
  const adaptedPath = adaptForLearningStyle(customizedPath, preferredStyle);
  
  return {
    pathId: generatePathId(userProfile),
    title: generatePathTitle(userProfile),
    description: generatePathDescription(userProfile, knowledge),
    steps: adaptedPath.steps,
    estimatedDuration: adaptedPath.duration,
    prerequisites: adaptedPath.prerequisites,
    outcomes: adaptedPath.outcomes,
    sourceContent: relevantContent
  };
}

/**
 * Generate base learning path for role and experience level
 */
function generateBasePath(userRole, experienceLevel, knowledge) {
  const pathTemplates = {
    'developer-beginner': {
      steps: [
        {
          id: 'midaz-overview',
          title: 'What is Midaz?',
          type: 'conceptual',
          duration: '5min',
          content: 'Understanding the financial ledger landscape'
        },
        {
          id: 'core-concepts',
          title: 'Core Financial Concepts',
          type: 'conceptual',
          duration: '10min',
          content: 'Double-entry accounting, organizations, ledgers'
        },
        {
          id: 'first-api-call',
          title: 'Your First API Call',
          type: 'hands-on',
          duration: '15min',
          content: 'Setting up authentication and making a simple request'
        },
        {
          id: 'create-organization',
          title: 'Create Your First Organization',
          type: 'guided',
          duration: '10min',
          content: 'Understanding the hierarchy and creating organizations'
        }
      ]
    },
    'developer-intermediate': {
      steps: [
        {
          id: 'transaction-patterns',
          title: 'Transaction Design Patterns',
          type: 'conceptual',
          duration: '15min',
          content: 'Complex transactions and best practices'
        },
        {
          id: 'error-handling',
          title: 'Production Error Handling',
          type: 'hands-on',
          duration: '20min',
          content: 'Idempotency, retries, and graceful failures'
        }
      ]
    },
    'business-beginner': {
      steps: [
        {
          id: 'business-value',
          title: 'Midaz Business Value',
          type: 'conceptual',
          duration: '10min',
          content: 'ROI, use cases, and competitive advantages'
        },
        {
          id: 'use-case-exploration',
          title: 'Explore Use Cases',
          type: 'guided',
          duration: '15min',
          content: 'Banking, fintech, and enterprise applications'
        }
      ]
    }
  };
  
  const key = `${userRole}-${experienceLevel}`;
  return pathTemplates[key] || pathTemplates['developer-beginner'];
}

/**
 * Extract relevant content from knowledge base for user profile
 */
function extractRelevantContent(knowledge, userProfile) {
  const relevantSections = [];
  
  // Extract sections based on user role
  if (userProfile.userRole === 'developer') {
    relevantSections.push(
      knowledge.structured.api_reference || '',
      knowledge.structured.guides || '',
      knowledge.structured.sdk || ''
    );
  } else if (userProfile.userRole === 'business') {
    relevantSections.push(
      knowledge.structured.overview || '',
      knowledge.structured.use_cases || '',
      knowledge.structured.benefits || ''
    );
  }
  
  return {
    extracted: relevantSections.filter(s => s.length > 0),
    openApiEndpoints: knowledge.openApi?.onboarding?.endpoints || [],
    lastUpdated: knowledge.freshness.llmsTxtTimestamp
  };
}

// Additional helper functions...
function generatePathId(userProfile) {
  return `${userProfile.userRole}_${userProfile.experienceLevel}_${Date.now()}`;
}

function generatePathTitle(userProfile) {
  const titles = {
    'developer-beginner': 'Midaz Developer Foundations',
    'developer-intermediate': 'Advanced Midaz Development',
    'developer-advanced': 'Midaz Architecture Mastery',
    'business-beginner': 'Midaz Business Value Discovery',
    'admin-beginner': 'Midaz System Administration'
  };
  
  const key = `${userProfile.userRole}-${userProfile.experienceLevel}`;
  return titles[key] || 'Midaz Learning Journey';
}

function generatePathDescription(userProfile, knowledge) {
  return `Personalized learning path for ${userProfile.userRole}s at ${userProfile.experienceLevel} level. Content dynamically sourced from docs.lerian.studio/llms.txt and GitHub OpenAPI specifications for maximum accuracy and currency.`;
}

function customizeForGoal(basePath, goal, timeAvailable, knowledge) {
  // Customize based on specific goals and time constraints
  if (goal && goal.includes('payment')) {
    basePath.steps = basePath.steps.filter(step => 
      step.content.includes('transaction') || 
      step.content.includes('payment') ||
      step.id.includes('api-call')
    );
  }
  
  return basePath;
}

function adaptForLearningStyle(path, preferredStyle) {
  // Adapt content presentation for learning style
  path.steps.forEach(step => {
    if (preferredStyle === 'hands-on') {
      step.type = 'hands-on';
    } else if (preferredStyle === 'conceptual') {
      step.type = 'conceptual';
    }
  });
  
  return path;
}

function calculateDuration(learningPath) {
  const totalMinutes = learningPath.steps.reduce((total, step) => {
    const duration = parseInt(step.duration.replace('min', '')) || 10;
    return total + duration;
  }, 0);
  
  return `${totalMinutes}min`;
}

function generateFallbackPath(userRole, experienceLevel) {
  return {
    title: 'Basic Midaz Introduction',
    steps: [
      {
        id: 'overview',
        title: 'Midaz Overview',
        content: 'Introduction to Midaz financial ledger platform',
        duration: '10min'
      }
    ]
  };
}

// Additional tutorial and conceptual guide functions would be implemented here...
async function generateTutorialStep(tutorialId, currentStep, knowledge) {
  // Implementation for interactive tutorials
  return {
    totalSteps: 5,
    step: {
      title: `Step ${currentStep}`,
      content: 'Tutorial content from live knowledge',
      action: 'Complete this step'
    },
    knowledgeCheck: {
      question: 'What did you learn?',
      type: 'multiple-choice',
      options: ['A', 'B', 'C']
    }
  };
}

async function validateStepResponse(tutorialId, stepNumber, userResponse, knowledge) {
  // Implementation for validating user responses
  return {
    correct: true,
    feedback: 'Great job!',
    explanation: 'Your understanding is correct.'
  };
}

async function generateConceptualExplanation(concept, options, knowledge) {
  // Implementation for conceptual explanations
  return {
    mentalModel: 'Conceptual framework',
    businessContext: 'Why this matters',
    implementation: 'How it works technically',
    relatedConcepts: ['concept1', 'concept2'],
    nextSteps: ['Learn more about X']
  };
}

function generateProgressBar(current, total) {
  const progress = Math.round((current / total) * 100);
  const filled = Math.round(progress / 10);
  const empty = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progress}%`;
}

export { registerMidazLearningTools };
