/**
 * Tool Registry with Client-Aware Filtering
 * Manages tool registration and filtering based on client capabilities
 */

import { createLogger } from './mcp-logging.js';
import { ToolComplexity, adaptationManager } from './client-adaptation.js';

const logger = createLogger('tool-registry');

/**
 * Tool category definitions for better organization
 */
export const ToolCategories = {
  FINANCIAL: 'financial',
  ADMINISTRATIVE: 'administrative', 
  DOCUMENTATION: 'documentation',
  ANALYSIS: 'analysis',
  SYSTEM: 'system'
};

/**
 * Tool metadata structure
 */
export class ToolMetadata {
  constructor(options = {}) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category || ToolCategories.FINANCIAL;
    this.complexity = options.complexity || ToolComplexity.MEDIUM;
    this.requiresBinaryContent = options.requiresBinaryContent || false;
    this.requiresImages = options.requiresImages || false;
    this.requiresStreaming = options.requiresStreaming || false;
    this.estimatedDuration = options.estimatedDuration || 1000; // ms
    this.rateLimit = options.rateLimit || { calls: 60, window: 60000 };
    this.dependencies = options.dependencies || [];
    this.minClientVersion = options.minClientVersion || '1.0.0';
    this.tags = options.tags || [];
  }

  /**
   * Check if tool is compatible with client
   */
  isCompatibleWith(clientContext) {
    if (!clientContext) return true;

    // Check complexity support
    if (!clientContext.supportsToolComplexity(this.complexity)) {
      return false;
    }

    // Check binary content requirement
    if (this.requiresBinaryContent && !clientContext.supports('supportsBinaryContent')) {
      return false;
    }

    // Check image requirement
    if (this.requiresImages && !clientContext.supports('supportsImages')) {
      return false;
    }

    // Check streaming requirement
    if (this.requiresStreaming && !clientContext.supports('supportsStreaming')) {
      return false;
    }

    return true;
  }

  /**
   * Get compatibility score (0-1) with client
   */
  getCompatibilityScore(clientContext) {
    if (!clientContext) return 1.0;

    let score = 1.0;
    let factors = 0;

    // Complexity alignment
    const complexityLevels = { low: 1, medium: 2, high: 3 };
    const toolLevel = complexityLevels[this.complexity] || 2;
    const clientLevel = complexityLevels[clientContext.capabilities.toolComplexity] || 2;
    
    if (toolLevel <= clientLevel) {
      score += 0.2;
    } else {
      score -= 0.3;
    }
    factors++;

    // Feature requirements
    if (this.requiresBinaryContent) {
      score += clientContext.supports('supportsBinaryContent') ? 0.1 : -0.4;
      factors++;
    }

    if (this.requiresImages) {
      score += clientContext.supports('supportsImages') ? 0.1 : -0.4;
      factors++;
    }

    if (this.requiresStreaming) {
      score += clientContext.supports('supportsStreaming') ? 0.1 : -0.2;
      factors++;
    }

    // Rate limit compatibility
    const clientRateLimit = clientContext.capabilities.rateLimit?.requests || 60;
    const toolRequiredRate = this.rateLimit.calls;
    
    if (toolRequiredRate <= clientRateLimit) {
      score += 0.1;
    } else {
      score -= 0.2;
    }
    factors++;

    return Math.max(0, Math.min(1, score / factors));
  }
}

/**
 * Enhanced Tool Registry
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.handlers = new Map();
    this.categories = new Map();
    this.usageStats = new Map();
  }

  /**
   * Register a tool with metadata
   */
  register(toolName, toolDefinition, handler, metadata = {}) {
    const toolMeta = metadata instanceof ToolMetadata ? metadata : new ToolMetadata({
      name: toolName,
      ...metadata
    });

    this.tools.set(toolName, {
      definition: toolDefinition,
      metadata: toolMeta,
      registeredAt: new Date().toISOString()
    });

    this.handlers.set(toolName, handler);

    // Index by category
    if (!this.categories.has(toolMeta.category)) {
      this.categories.set(toolMeta.category, new Set());
    }
    this.categories.get(toolMeta.category).add(toolName);

    // Initialize usage stats
    this.usageStats.set(toolName, {
      calls: 0,
      errors: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastUsed: null
    });

    // Register with adaptation manager
    adaptationManager.registerTool(toolName, toolDefinition, toolMeta.complexity);

    logger.info('Tool registered', { 
      tool: toolName, 
      category: toolMeta.category,
      complexity: toolMeta.complexity
    });
  }

  /**
   * Get all tools filtered by client capabilities
   */
  getFilteredTools(clientContext = null) {
    if (!clientContext) {
      return Array.from(this.tools.values()).map(t => t.definition);
    }

    const compatibleTools = [];
    const maxTools = clientContext.getCapability('maxToolsPerCall', 20);
    const toolScores = [];

    // Score all tools for compatibility
    for (const [toolName, toolInfo] of this.tools) {
      const score = toolInfo.metadata.getCompatibilityScore(clientContext);
      if (score > 0.3) { // Minimum compatibility threshold
        toolScores.push({ toolName, toolInfo, score });
      }
    }

    // Sort by compatibility score and usage statistics
    toolScores.sort((a, b) => {
      const usageA = this.usageStats.get(a.toolName);
      const usageB = this.usageStats.get(b.toolName);
      
      // Combine compatibility score with usage frequency
      const scoreA = a.score + (usageA.calls * 0.001);
      const scoreB = b.score + (usageB.calls * 0.001);
      
      return scoreB - scoreA;
    });

    // Take top tools up to limit
    const selectedTools = toolScores.slice(0, maxTools);
    
    logger.info('Tools filtered for client', {
      client: clientContext.client.id,
      totalTools: this.tools.size,
      compatibleTools: toolScores.length,
      selectedTools: selectedTools.length,
      avgCompatibility: toolScores.reduce((sum, t) => sum + t.score, 0) / toolScores.length
    });

    return selectedTools.map(t => t.toolInfo.definition);
  }

  /**
   * Get tools by category with client filtering
   */
  getToolsByCategory(category, clientContext = null) {
    const categoryTools = this.categories.get(category) || new Set();
    const tools = [];

    for (const toolName of categoryTools) {
      const toolInfo = this.tools.get(toolName);
      if (!toolInfo) continue;

      if (!clientContext || toolInfo.metadata.isCompatibleWith(clientContext)) {
        tools.push(toolInfo.definition);
      }
    }

    return tools;
  }

  /**
   * Get tool recommendations based on context
   */
  getRecommendedTools(context, clientContext = null) {
    const { operation, entity, complexity } = context;
    const recommendations = [];

    for (const [toolName, toolInfo] of this.tools) {
      let relevanceScore = 0;

      // Match by tags
      if (toolInfo.metadata.tags.includes(operation)) relevanceScore += 0.4;
      if (toolInfo.metadata.tags.includes(entity)) relevanceScore += 0.3;

      // Match by category
      if (toolInfo.metadata.category === this.inferCategory(operation, entity)) {
        relevanceScore += 0.2;
      }

      // Match by complexity
      if (toolInfo.metadata.complexity === complexity) relevanceScore += 0.1;

      // Client compatibility
      if (clientContext) {
        const compatScore = toolInfo.metadata.getCompatibilityScore(clientContext);
        relevanceScore *= compatScore;
      }

      if (relevanceScore > 0.3) {
        recommendations.push({
          tool: toolInfo.definition,
          relevance: relevanceScore,
          reason: this.generateRecommendationReason(toolInfo.metadata, context)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  }

  /**
   * Execute tool with tracking
   */
  async executeTool(toolName, params, clientContext = null) {
    const handler = this.handlers.get(toolName);
    const toolInfo = this.tools.get(toolName);
    
    if (!handler || !toolInfo) {
      throw new Error(`Tool ${toolName} not found`);
    }

    // Check client compatibility
    if (clientContext && !toolInfo.metadata.isCompatibleWith(clientContext)) {
      throw new Error(`Tool ${toolName} not compatible with client ${clientContext.client.id}`);
    }

    const startTime = Date.now();
    const stats = this.usageStats.get(toolName);
    
    try {
      // Execute tool
      const result = await handler(params);
      
      // Update success stats
      const duration = Date.now() - startTime;
      stats.calls++;
      stats.totalDuration += duration;
      stats.avgDuration = stats.totalDuration / stats.calls;
      stats.lastUsed = new Date().toISOString();

      logger.debug('Tool executed successfully', { 
        tool: toolName, 
        duration,
        calls: stats.calls
      });

      return result;
    } catch (error) {
      // Update error stats
      stats.errors++;
      stats.lastUsed = new Date().toISOString();

      logger.error('Tool execution failed', { 
        tool: toolName,
        error: error.message,
        errorRate: stats.errors / (stats.calls + stats.errors)
      });

      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats = {
      totalTools: this.tools.size,
      categories: {},
      mostUsed: [],
      recentlyUsed: [],
      errorRates: {}
    };

    // Category breakdown
    for (const [category, tools] of this.categories) {
      stats.categories[category] = tools.size;
    }

    // Usage analysis
    const usageData = Array.from(this.usageStats.entries())
      .map(([toolName, usage]) => ({ toolName, ...usage }))
      .sort((a, b) => b.calls - a.calls);

    stats.mostUsed = usageData.slice(0, 10);
    stats.recentlyUsed = usageData
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);

    // Error rates
    for (const [toolName, usage] of this.usageStats) {
      const totalCalls = usage.calls + usage.errors;
      if (totalCalls > 0) {
        stats.errorRates[toolName] = usage.errors / totalCalls;
      }
    }

    return stats;
  }

  /**
   * Infer category from operation and entity
   */
  inferCategory(operation, entity) {
    const financialEntities = ['account', 'transaction', 'balance', 'asset', 'portfolio'];
    const adminEntities = ['organization', 'ledger', 'segment'];
    const docEntities = ['docs', 'documentation', 'help'];

    if (financialEntities.some(e => entity?.includes(e))) {
      return ToolCategories.FINANCIAL;
    }
    if (adminEntities.some(e => entity?.includes(e))) {
      return ToolCategories.ADMINISTRATIVE;
    }
    if (docEntities.some(e => entity?.includes(e))) {
      return ToolCategories.DOCUMENTATION;
    }

    return ToolCategories.FINANCIAL; // Default
  }

  /**
   * Generate recommendation reason
   */
  generateRecommendationReason(metadata, context) {
    const reasons = [];
    
    if (metadata.tags.includes(context.operation)) {
      reasons.push(`supports ${context.operation} operations`);
    }
    if (metadata.tags.includes(context.entity)) {
      reasons.push(`works with ${context.entity}`);
    }
    if (metadata.complexity === context.complexity) {
      reasons.push(`matches complexity level (${context.complexity})`);
    }

    return reasons.join(', ') || 'general compatibility';
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();

export default {
  ToolRegistry,
  ToolMetadata,
  ToolCategories,
  toolRegistry
};