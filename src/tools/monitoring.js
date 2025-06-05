/**
 * Monitoring Tools for Lerian MCP Server
 * Provides access to error monitoring, performance metrics, and health status
 * 
 * @version 2.27.0
 * @author Lerian Studio
 */

import { z } from "zod";
import { globalErrorMonitor } from '../util/error-monitoring.js';
import { wrapToolHandler, logToolInvocation } from "../util/mcp-helpers.js";

/**
 * Register monitoring tools with the MCP server
 */
export const registerMonitoringTools = (server) => {
    // Health Status Tool
    server.tool(
        'lerian-health-status',
        'Get comprehensive health status and metrics for the Lerian MCP Server including error rates, performance, and uptime',
        {},
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("lerian-health-status", args, extra);

            try {
                const metrics = globalErrorMonitor.getMetrics();

                const healthReport = {
                    status: metrics.health >= 80 ? 'healthy' : metrics.health >= 60 ? 'warning' : 'critical',
                    score: metrics.health,
                    uptime: metrics.uptime.formatted,
                    summary: {
                        totalErrors: metrics.errors.total,
                        criticalErrors: metrics.errors.critical,
                        highErrors: metrics.errors.high,
                        performanceOperations: metrics.performance.total,
                        averageResponseTime: metrics.performance.averageResponseTime
                    },
                    details: {
                        errors: metrics.errors,
                        performance: metrics.performance,
                        uptime: metrics.uptime
                    },
                    recommendations: generateHealthRecommendations(metrics)
                };

                return {
                    status: healthReport.status,
                    score: healthReport.score,
                    uptime: healthReport.uptime,
                    summary: healthReport.summary,
                    details: healthReport.details,
                    recommendations: healthReport.recommendations,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                globalErrorMonitor.logError(error, 'medium', {
                    tool: 'lerian-health-status',
                    operation: 'get_health_metrics'
                });

                throw new Error(`Error retrieving health status: ${error.message}`);
            }
        })
    );

    // Error Metrics Tool
    server.tool(
        'lerian-error-metrics',
        'Get detailed error monitoring metrics including error counts by severity, types, and trends',
        {},
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("lerian-error-metrics", args, extra);

            try {
                const metrics = globalErrorMonitor.getMetrics();

                return {
                    errorSummary: {
                        total: metrics.errors.total,
                        critical: metrics.errors.critical,
                        high: metrics.errors.high,
                        medium: metrics.errors.medium,
                        low: metrics.errors.low
                    },
                    errorBreakdown: metrics.errors.byType,
                    performanceImpact: {
                        totalOperations: metrics.performance.total,
                        performanceBreakdown: metrics.performance.byLevel
                    },
                    healthScore: metrics.health,
                    uptime: metrics.uptime.formatted,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                globalErrorMonitor.logError(error, 'medium', {
                    tool: 'lerian-error-metrics',
                    operation: 'get_error_metrics'
                });

                throw new Error(`Error retrieving error metrics: ${error.message}`);
            }
        })
    );

    // Performance Metrics Tool
    server.tool(
        'lerian-performance-metrics',
        'Get performance monitoring data including operation timing, slow operations, and performance trends',
        {},
        wrapToolHandler(async (args, extra) => {
            logToolInvocation("lerian-performance-metrics", args, extra);

            try {
                const metrics = globalErrorMonitor.getMetrics();
                const performanceAnalysis = analyzePerformance(metrics.performance);

                return {
                    overview: {
                        totalOperations: metrics.performance.total,
                        averageResponseTime: metrics.performance.averageResponseTime,
                        uptime: metrics.uptime.formatted
                    },
                    distribution: performanceAnalysis.distributionData,
                    breakdown: metrics.performance.byLevel,
                    insights: performanceAnalysis.insights,
                    recommendations: performanceAnalysis.recommendations,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                globalErrorMonitor.logError(error, 'medium', {
                    tool: 'lerian-performance-metrics',
                    operation: 'get_performance_metrics'
                });

                throw new Error(`Error retrieving performance metrics: ${error.message}`);
            }
        })
    );
};

/**
 * Generate health recommendations based on metrics
 */
function generateHealthRecommendations(metrics) {
    const recommendations = [];

    if (metrics.errors.critical > 0) {
        recommendations.push('🚨 Critical errors detected - immediate attention required');
    }

    if (metrics.errors.high > 5) {
        recommendations.push('⚠️ High number of high-severity errors - investigate error patterns');
    }

    if (metrics.health < 70) {
        recommendations.push('📉 Health score below 70 - review error logs and performance metrics');
    }

    const slowOps = Object.entries(metrics.performance.byLevel)
        .filter(([key]) => key.includes('slow'))
        .reduce((sum, [, count]) => sum + count, 0);

    if (slowOps > 10) {
        recommendations.push('🐌 Multiple slow operations detected - consider performance optimization');
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ System is operating normally - no immediate action required');
    }

    return recommendations;
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(performanceMetrics) {
    const total = performanceMetrics.total;
    const byLevel = performanceMetrics.byLevel;

    // Calculate distribution
    const fast = Object.entries(byLevel).filter(([key]) => key.includes('fast')).reduce((sum, [, count]) => sum + count, 0);
    const normal = Object.entries(byLevel).filter(([key]) => key.includes('normal')).reduce((sum, [, count]) => sum + count, 0);
    const slow = Object.entries(byLevel).filter(([key]) => key.includes('slow')).reduce((sum, [, count]) => sum + count, 0);
    const critical = Object.entries(byLevel).filter(([key]) => key.includes('critical')).reduce((sum, [, count]) => sum + count, 0);

    const distributionData = {
        fast: { count: fast, percentage: total > 0 ? Math.round((fast / total) * 100) : 0 },
        normal: { count: normal, percentage: total > 0 ? Math.round((normal / total) * 100) : 0 },
        slow: { count: slow, percentage: total > 0 ? Math.round((slow / total) * 100) : 0 },
        critical: { count: critical, percentage: total > 0 ? Math.round((critical / total) * 100) : 0 }
    };

    // Generate insights
    const insights = [];
    if (fast / total > 0.8) {
        insights.push('🚀 Excellent performance - 80%+ operations are fast');
    }
    if (slow / total > 0.2) {
        insights.push('⚠️ 20%+ operations are slow - performance optimization recommended');
    }
    if (critical > 0) {
        insights.push('🚨 Critical performance issues detected - immediate optimization needed');
    }

    // Generate recommendations
    const recommendations = [];
    if (slow > 5) {
        recommendations.push('Consider implementing caching for frequently accessed data');
        recommendations.push('Review database queries and API calls for optimization opportunities');
    }
    if (critical > 0) {
        recommendations.push('Investigate critical performance bottlenecks immediately');
        recommendations.push('Consider implementing request timeouts and circuit breakers');
    }
    if (recommendations.length === 0) {
        recommendations.push('Performance is within acceptable ranges');
    }

    return {
        distributionData,
        insights,
        recommendations
    };
}

export default registerMonitoringTools; 