/**
 * Unified Learning Tool
 * Consolidates all learning tools into a single tool with type parameters
 * Reduces 4 tools to 1 tool for MCP client compatibility
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";
import { createLogger } from "../util/mcp-logging.js";

// Import existing learning utilities (would need to extract from original files)
import { fetchDocumentation } from "../util/docs-fetcher.js";
import { searchResources } from "../util/docs-manifest.js";

const logger = createLogger('learn-unified');

/**
 * Register unified learning tool
 */
export const registerUnifiedLearningTool = (server) => {
  server.tool(
    "midaz-learn",
    "Unified Midaz learning system (4 types). Use type='path' for personalized roadmap, 'tutorial' for hands-on practice, 'concept' for deep explanations, 'search' for quick answers. Replaces 4 separate learning tools for MCP client compatibility.",
    {
      type: z.enum([
        'path',      // Get personalized learning roadmap based on role and experience
        'tutorial',  // Step-through interactive tutorial with guided exercises
        'concept',   // Deep conceptual explanation of Midaz features and principles
        'search'     // Smart search with learning-focused results and explanations
      ]).describe("Learning interaction type. Start with 'path' for structured learning, use 'tutorial' for hands-on practice, 'concept' to understand features, 'search' for specific questions."),
      
      // Learning path parameters with detailed guidance
      userRole: z.enum(["developer", "admin", "business", "explorer"]).optional().describe("Your primary role (REQUIRED for type='path'). Choose: 'developer' (building integrations, writing code, API implementation), 'admin' (system setup, user management, infrastructure), 'business' (strategy, ROI analysis, vendor evaluation), 'explorer' (general learning, evaluation, curiosity-driven)."),
      
      experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Your Midaz experience level (REQUIRED for type='path'). 'beginner': never used Midaz before or just starting, 'intermediate': have created some transactions/accounts, familiar with basic concepts, 'advanced': building production systems, deep understanding of ledger architecture."),
      
      goal: z.string().optional().describe("Specific learning objective, 10-200 characters (optional for type='path'). Examples: 'build payment processing system', 'migrate from legacy accounting', 'understand double-entry principles', 'integrate with e-commerce platform', 'set up multi-tenant ledgers'. Be specific about what you want to achieve."),
      
      timeAvailable: z.enum(["5min", "15min", "30min", "1hour", "deep-dive"]).default("15min").describe("Time you have for this learning session. '5min': quick overview/summary, '15min': focused topic with examples, '30min': complete workflow with practice, '1hour': comprehensive topic with hands-on exercises, 'deep-dive': extensive exploration with multiple related topics."),
      
      // Tutorial parameters with progression tracking
      tutorialId: z.string().optional().describe("Tutorial identifier (REQUIRED for type='tutorial'). Available tutorials: 'first-transaction' (create your first financial transaction), 'organization-setup' (complete org configuration), 'user-onboarding' (add users and permissions), 'portfolio-management' (organize accounts in portfolios). Use exact IDs for consistency."),
      
      currentStep: z.number().default(1).describe("Current step number in tutorial, 1-based indexing (default: 1 for starting). Tutorials have 3-8 steps typically. Use this to resume from a specific step or continue from where you left off. Step 1 always starts the tutorial."),
      
      userResponse: z.string().optional().describe("Your answer/response to the previous tutorial step (optional, for validation). Provide your answer to questions, code you tried, or what you observed. This helps validate your progress and provide personalized feedback for the next step."),
      
      // Concept parameters with depth control
      concept: z.string().optional().describe("Specific Midaz concept to explain in detail (REQUIRED for type='concept'). Examples: 'double-entry accounting' (fundamental principle), 'portfolio hierarchy' (organizational structure), 'transaction DSL' (transaction language), 'asset management' (handling currencies/tokens), 'ledger isolation' (multi-tenancy). Use exact concept names for consistency."),
      
      complexity: z.enum(["overview", "detailed", "deep-dive"]).default("detailed").describe("Explanation depth and technical detail. 'overview': 2-3 paragraphs, basic concepts, minimal technical details. 'detailed': comprehensive explanation with examples, technical implementation details, best practices. 'deep-dive': exhaustive analysis, advanced patterns, edge cases, architectural considerations."),
      
      includeBusinessContext: z.boolean().default(true).describe("Whether to include business use cases, industry applications, and real-world examples. True: explains WHY concepts matter, industry use cases, ROI implications. False: focuses purely on technical implementation and mechanics."),
      
      // Search parameters with learning optimization
      query: z.string().optional().describe("Learning-focused question or search query, 5-200 characters (REQUIRED for type='search'). Examples: 'how do I create my first transaction', 'what is the difference between portfolios and accounts', 'show me error handling patterns', 'explain authentication flow step by step'. Use natural language questions for best results."),
      
      learningMode: z.enum(["explain", "show-me", "guide-me", "deep-dive"]).default("explain").describe("Your preferred learning style. 'explain': conceptual explanations with theory and principles, 'show-me': focus on code examples and practical demonstrations, 'guide-me': step-by-step instructions with checkpoints, 'deep-dive': comprehensive analysis with multiple perspectives and advanced topics."),
      
      section: z.enum(["concepts", "guides", "api", "examples", "troubleshooting", "all"]).default("all").describe("Focus area for learning content. 'concepts': theoretical foundations and principles, 'guides': practical tutorials and workflows, 'api': technical reference and endpoints, 'examples': code samples and implementations, 'troubleshooting': problem-solving and debugging, 'all': comprehensive search across all areas."),
      
      maxResults: z.number().min(1).max(10).default(5).describe("Maximum learning results to return (range: 1-10, default: 5). Lower numbers (1-3) for focused, specific answers. Higher numbers (5-10) for comprehensive exploration of the topic. Each result includes explanations tailored to your learning mode.")
    },
    
    wrapToolHandler(async (args, extra) => {
      const {
        type,
        userRole,
        experienceLevel,
        goal,
        timeAvailable,
        tutorialId,
        currentStep,
        userResponse,
        concept,
        complexity,
        includeBusinessContext,
        query,
        learningMode,
        section,
        maxResults
      } = validateArgs(args, z.object({
        type: z.enum(['path', 'tutorial', 'concept', 'search']),
        userRole: z.enum(["developer", "admin", "business", "explorer"]).optional(),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        goal: z.string().optional(),
        timeAvailable: z.enum(["5min", "15min", "30min", "1hour", "deep-dive"]).default("15min"),
        tutorialId: z.string().optional(),
        currentStep: z.number().default(1),
        userResponse: z.string().optional(),
        concept: z.string().optional(),
        complexity: z.enum(["overview", "detailed", "deep-dive"]).default("detailed"),
        includeBusinessContext: z.boolean().default(true),
        query: z.string().optional(),
        learningMode: z.enum(["explain", "show-me", "guide-me", "deep-dive"]).default("explain"),
        section: z.enum(["concepts", "guides", "api", "examples", "troubleshooting", "all"]).default("all"),
        maxResults: z.number().min(1).max(10).default(5)
      }));

      logger.info('Processing unified learning request', { 
        type, 
        userRole,
        experienceLevel,
        goal,
        query 
      });

      try {
        switch (type) {
          case 'path':
            if (!userRole || !experienceLevel) {
              throw new Error("userRole and experienceLevel required for learning path");
            }
            return await handleLearningPath(userRole, experienceLevel, goal, timeAvailable);
            
          case 'tutorial':
            if (!tutorialId) {
              throw new Error("tutorialId required for tutorial");
            }
            return await handleInteractiveTutorial(tutorialId, currentStep, userResponse);
            
          case 'concept':
            if (!concept) {
              throw new Error("concept required for conceptual guide");
            }
            return await handleConceptualGuide(concept, complexity, includeBusinessContext);
            
          case 'search':
            if (!query) {
              throw new Error("query required for search");
            }
            return await handleLearningSearch(query, learningMode, section, maxResults);
            
          default:
            throw new Error(`Unknown learning type: ${type}`);
        }
      } catch (error) {
        logger.error('Error in unified learning tool', { 
          type, 
          error: error.message 
        });
        throw error;
      }
    })
  );

  logger.info('✅ Unified learning tool registered (replaces 4 individual tools)');
};

// Learning handlers

async function handleLearningPath(userRole, experienceLevel, goal, timeAvailable) {
  const learningPaths = {
    developer: {
      beginner: {
        "5min": ["Overview of Midaz", "Basic API concepts", "First API call"],
        "15min": ["Setup development environment", "Authentication", "Create organization", "Basic transactions"],
        "30min": ["Complete tutorial series", "Error handling", "Testing patterns"],
        "1hour": ["Full integration project", "Advanced patterns", "Production deployment"],
        "deep-dive": ["Architecture deep dive", "Custom integrations", "Performance optimization"]
      },
      intermediate: {
        "5min": ["Advanced features overview", "New API endpoints"],
        "15min": ["Complex transaction patterns", "Asset management", "Portfolio operations"],
        "30min": ["Microservices integration", "Event handling", "Monitoring"],
        "1hour": ["Custom middleware", "Advanced authentication", "Scaling patterns"],
        "deep-dive": ["System architecture", "Database optimization", "Custom protocols"]
      },
      advanced: {
        "5min": ["Latest features", "Breaking changes", "Migration guides"],
        "15min": ["Performance tuning", "Custom extensions", "Advanced debugging"],
        "30min": ["System design patterns", "Custom protocols", "Advanced monitoring"],
        "1hour": ["Architecture consulting", "Custom implementations", "Team training"],
        "deep-dive": ["Midaz internals", "Contributing to core", "Research projects"]
      }
    },
    admin: {
      beginner: {
        "5min": ["Admin panel overview", "Basic configuration"],
        "15min": ["User management", "Organization setup", "Basic monitoring"],
        "30min": ["Security configuration", "Backup procedures", "Log analysis"],
        "1hour": ["Complete admin workflow", "Troubleshooting", "Performance monitoring"],
        "deep-dive": ["Advanced configuration", "Custom policies", "System optimization"]
      }
    },
    business: {
      beginner: {
        "5min": ["Business value of Midaz", "Use case overview"],
        "15min": ["ROI analysis", "Implementation timeline", "Success metrics"],
        "30min": ["Business process integration", "Stakeholder training", "Change management"],
        "1hour": ["Strategic planning", "Vendor evaluation", "Implementation roadmap"],
        "deep-dive": ["Industry benchmarks", "Competitive analysis", "Future roadmap"]
      }
    }
  };

  const path = learningPaths[userRole]?.[experienceLevel]?.[timeAvailable] || 
    learningPaths.developer.beginner["15min"];

  return {
    userRole,
    experienceLevel,
    goal,
    timeAvailable,
    recommendedPath: path,
    nextSteps: path.slice(0, 3),
    estimatedDuration: timeAvailable,
    difficulty: experienceLevel,
    personalizedTips: generatePersonalizedTips(userRole, experienceLevel, goal)
  };
}

async function handleInteractiveTutorial(tutorialId, currentStep, userResponse) {
  const tutorials = {
    'first-transaction': {
      title: 'Creating Your First Transaction',
      totalSteps: 5,
      steps: [
        {
          step: 1,
          title: 'Setup Organization',
          content: 'First, let\'s create an organization. This is the top-level container for all your financial data.',
          code: `curl -X POST https://api.midaz.io/v1/organizations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "My Company", "metadata": {}}'`,
          question: 'What would you name your organization?',
          validation: (response) => response && response.length > 2
        },
        {
          step: 2,
          title: 'Create Ledger',
          content: 'Now let\'s create a ledger within your organization. A ledger groups related accounts.',
          code: `curl -X POST https://api.midaz.io/v1/organizations/org_123/ledgers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "Main Ledger", "metadata": {}}'`,
          question: 'What type of transactions will this ledger handle?',
          validation: (response) => response && response.length > 5
        }
        // ... more steps
      ]
    },
    'organization-setup': {
      title: 'Complete Organization Setup',
      totalSteps: 4,
      steps: [
        // ... tutorial steps
      ]
    }
  };

  const tutorial = tutorials[tutorialId];
  if (!tutorial) {
    return {
      error: `Tutorial '${tutorialId}' not found`,
      availableTutorials: Object.keys(tutorials)
    };
  }

  const currentStepData = tutorial.steps[currentStep - 1];
  if (!currentStepData) {
    return {
      tutorial: tutorial.title,
      status: 'completed',
      message: 'Congratulations! You\'ve completed this tutorial.',
      nextTutorials: getRecommendedTutorials(tutorialId)
    };
  }

  // Validate previous step response if provided
  let feedback = '';
  if (userResponse && currentStep > 1) {
    const prevStep = tutorial.steps[currentStep - 2];
    if (prevStep.validation && !prevStep.validation(userResponse)) {
      feedback = 'Your response needs more detail. Please try again.';
    } else {
      feedback = 'Great! Let\'s continue to the next step.';
    }
  }

  return {
    tutorial: tutorial.title,
    currentStep,
    totalSteps: tutorial.totalSteps,
    step: currentStepData,
    feedback,
    progress: Math.round((currentStep / tutorial.totalSteps) * 100)
  };
}

async function handleConceptualGuide(concept, complexity, includeBusinessContext) {
  const concepts = {
    'double-entry accounting': {
      overview: 'Double-entry accounting ensures every transaction affects at least two accounts, maintaining balance.',
      detailed: `Double-entry accounting is the foundation of Midaz's transaction system. Every transaction must have equal debits and credits.

## Core Principles
1. **Balance**: Total debits = Total credits
2. **Accounts**: Each account has a type (asset, liability, equity, revenue, expense)
3. **Transactions**: Move value between accounts

## Why It Matters
- **Accuracy**: Mathematical proof of correctness
- **Auditability**: Complete transaction history
- **Compliance**: Meets financial regulations`,
      'deep-dive': `Double-entry accounting in Midaz is implemented with strict mathematical validation and real-time balance checking.

## Technical Implementation
- Atomic transactions with ACID properties
- Real-time balance calculations
- Distributed ledger consistency
- Event sourcing for complete audit trails

## Advanced Features
- Multi-currency support
- Fractional unit precision
- Automated reconciliation
- Custom account hierarchies`
    },
    'portfolio hierarchy': {
      overview: 'Portfolios organize accounts hierarchically for better management and reporting.',
      detailed: `Portfolios in Midaz create organizational structure for your accounts and assets.

## Structure
Organization → Ledger → Portfolio → Account

## Benefits
- **Organization**: Group related accounts
- **Reporting**: Aggregate balances and performance
- **Access Control**: Portfolio-level permissions
- **Scaling**: Manage thousands of accounts efficiently`
    }
  };

  const conceptData = concepts[concept.toLowerCase()];
  if (!conceptData) {
    return {
      error: `Concept '${concept}' not found`,
      availableConcepts: Object.keys(concepts)
    };
  }

  let response = {
    concept,
    complexity,
    explanation: conceptData[complexity] || conceptData.detailed
  };

  if (includeBusinessContext) {
    response.businessContext = generateBusinessContext(concept);
  }

  return response;
}

async function handleLearningSearch(query, learningMode, section, maxResults) {
  const searchResults = await searchResources(query);
  
  // Filter by section if specified
  const filteredResults = section === 'all' ? 
    searchResults : 
    searchResults.filter(r => r.category === section);

  // Format results based on learning mode
  const formattedResults = await Promise.all(
    filteredResults.slice(0, maxResults).map(async (result) => {
      const content = await fetchDocumentation(result.path);
      
      switch (learningMode) {
        case 'explain':
          return {
            title: result.title,
            explanation: extractExplanation(content),
            keyPoints: extractKeyPoints(content)
          };
        case 'show-me':
          return {
            title: result.title,
            examples: extractCodeExamples(content),
            demos: extractDemos(content)
          };
        case 'guide-me':
          return {
            title: result.title,
            steps: extractSteps(content),
            checkpoints: extractCheckpoints(content)
          };
        case 'deep-dive':
          return {
            title: result.title,
            fullContent: content,
            references: extractReferences(content),
            relatedTopics: extractRelatedTopics(content)
          };
        default:
          return {
            title: result.title,
            summary: content.substring(0, 300) + '...'
          };
      }
    })
  );

  return {
    query,
    learningMode,
    section,
    totalResults: filteredResults.length,
    results: formattedResults
  };
}

// Helper functions

function generatePersonalizedTips(userRole, experienceLevel, goal) {
  const tips = {
    developer: {
      beginner: [
        "Start with the sandbox environment to experiment safely",
        "Use the interactive tutorials to learn step-by-step",
        "Join the developer community for support"
      ],
      intermediate: [
        "Focus on error handling patterns early",
        "Implement comprehensive logging",
        "Use the SDK for production applications"
      ],
      advanced: [
        "Contribute to open source examples",
        "Mentor other developers",
        "Provide feedback on new features"
      ]
    }
  };
  
  return tips[userRole]?.[experienceLevel] || tips.developer.beginner;
}

function getRecommendedTutorials(completedTutorial) {
  const recommendations = {
    'first-transaction': ['organization-setup', 'account-management'],
    'organization-setup': ['user-management', 'security-config']
  };
  
  return recommendations[completedTutorial] || [];
}

function generateBusinessContext(concept) {
  const contexts = {
    'double-entry accounting': {
      industries: ['Financial Services', 'E-commerce', 'SaaS', 'Gaming'],
      useCases: ['Payment processing', 'Marketplace settlements', 'Subscription billing', 'Virtual economies'],
      benefits: ['Regulatory compliance', 'Audit trails', 'Financial accuracy', 'Operational transparency']
    }
  };
  
  return contexts[concept.toLowerCase()] || {
    industries: ['General Business'],
    useCases: ['Financial management'],
    benefits: ['Improved accuracy', 'Better reporting']
  };
}

function extractExplanation(content) {
  // Extract first paragraph or section that explains the concept
  const match = content.match(/^([^#\n]*(?:\n[^#\n]*)*)/);
  return match ? match[1].trim().substring(0, 500) + '...' : '';
}

function extractKeyPoints(content) {
  // Extract bullet points or numbered lists
  const bullets = content.match(/^[\s]*[-*+]\s+(.+)$/gm) || [];
  return bullets.slice(0, 5).map(b => b.replace(/^[\s]*[-*+]\s+/, ''));
}

function extractCodeExamples(content) {
  // Extract code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  return codeBlocks.slice(0, 3);
}

function extractDemos(content) {
  // Extract demo sections
  return ['Interactive demo available in tutorial mode'];
}

function extractSteps(content) {
  // Extract numbered steps
  const steps = content.match(/^\d+\.\s+(.+)$/gm) || [];
  return steps.slice(0, 5);
}

function extractCheckpoints(content) {
  return ['Complete the setup', 'Test the integration', 'Verify results'];
}

function extractReferences(content) {
  // Extract links and references
  const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  return links.slice(0, 5);
}

function extractRelatedTopics(content) {
  return ['API Reference', 'Best Practices', 'Architecture Guide'];
}