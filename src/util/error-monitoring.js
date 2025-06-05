/**
 * Enhanced Error Monitoring and Performance Tracking Utility
 * Provides comprehensive error handling, performance metrics, and debugging capabilities
 * for the Lerian MCP Server.
 * 
 * @version 2.27.0
 * @author Lerian Studio
 */

import { performance } from 'perf_hooks';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Performance monitoring thresholds (in milliseconds)
 */
export const PerformanceThresholds = {
    FAST: 100,
    NORMAL: 500,
    SLOW: 1000,
    CRITICAL: 3000
};

/**
 * Enhanced Error Monitoring Class
 */
export class ErrorMonitor {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.logToFile = options.logToFile !== false;
        this.logDirectory = options.logDirectory || './logs';
        this.maxLogFiles = options.maxLogFiles || 10;
        this.performanceTracking = options.performanceTracking !== false;

        // Initialize metrics
        this.metrics = {
            errors: new Map(),
            performance: new Map(),
            operations: new Map(),
            startTime: Date.now(),
            totalDuration: 0,
            totalOperations: 0
        };

        // Ensure log directory exists
        if (this.logToFile && !existsSync(this.logDirectory)) {
            mkdirSync(this.logDirectory, { recursive: true });
        }

        // Setup global error handlers
        this.setupGlobalHandlers();
    }

    /**
     * Setup global error handlers for unhandled errors
     */
    setupGlobalHandlers() {
        if (!this.enabled) return;

        process.on('uncaughtException', (error) => {
            this.logError(error, ErrorSeverity.CRITICAL, {
                type: 'uncaughtException',
                timestamp: new Date().toISOString()
            });
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logError(reason, ErrorSeverity.HIGH, {
                type: 'unhandledRejection',
                promise: promise.toString(),
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Log an error with enhanced context
     */
    logError(error, severity = ErrorSeverity.MEDIUM, context = {}) {
        if (!this.enabled) return;

        const errorEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            severity,
            message: error.message || error.toString(),
            stack: error.stack,
            context,
            uptime: Date.now() - this.metrics.startTime
        };

        // Update metrics
        const errorKey = `${severity}:${error.name || 'Unknown'}`;
        this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);

        // Console output with color coding
        this.logToConsole(errorEntry);

        // File logging
        if (this.logToFile) {
            this.logToFileSystem(errorEntry);
        }

        return errorEntry.id;
    }

    /**
     * Track operation performance
     */
    startPerformanceTracking(operationName, context = {}) {
        if (!this.enabled || !this.performanceTracking) return null;

        const trackingId = this.generateId();
        const startTime = performance.now();

        const tracker = {
            id: trackingId,
            operation: operationName,
            startTime,
            context,
            end: () => this.endPerformanceTracking(trackingId, operationName, startTime, context)
        };

        return tracker;
    }

    /**
     * End performance tracking and log results
     */
    endPerformanceTracking(trackingId, operationName, startTime, context) {
        if (!this.enabled || !this.performanceTracking) return;

        const endTime = performance.now();
        const duration = endTime - startTime;
        const performanceLevel = this.categorizePerformance(duration);

        const performanceEntry = {
            id: trackingId,
            timestamp: new Date().toISOString(),
            operation: operationName,
            duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
            performanceLevel,
            context
        };

        // Update metrics
        const perfKey = `${operationName}:${performanceLevel}`;
        this.metrics.performance.set(perfKey, (this.metrics.performance.get(perfKey) || 0) + 1);

        // Update totals for average calculation
        this.metrics.totalDuration += duration;
        this.metrics.totalOperations += 1;

        // Log slow operations
        if (duration > PerformanceThresholds.SLOW) {
            console.warn(`🐌 Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
        }

        // File logging for performance data
        if (this.logToFile && duration > PerformanceThresholds.NORMAL) {
            this.logPerformanceToFile(performanceEntry);
        }

        return performanceEntry;
    }

    /**
     * Categorize performance based on duration
     */
    categorizePerformance(duration) {
        if (duration <= PerformanceThresholds.FAST) return 'fast';
        if (duration <= PerformanceThresholds.NORMAL) return 'normal';
        if (duration <= PerformanceThresholds.SLOW) return 'slow';
        return 'critical';
    }

    /**
     * Get comprehensive metrics report
     */
    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;

        return {
            uptime: {
                milliseconds: uptime,
                seconds: Math.round(uptime / 1000),
                minutes: Math.round(uptime / 60000),
                formatted: this.formatUptime(uptime)
            },
            errors: {
                total: Array.from(this.metrics.errors.values()).reduce((sum, count) => sum + count, 0),
                byType: Object.fromEntries(this.metrics.errors),
                critical: this.getErrorCountBySeverity(ErrorSeverity.CRITICAL),
                high: this.getErrorCountBySeverity(ErrorSeverity.HIGH),
                medium: this.getErrorCountBySeverity(ErrorSeverity.MEDIUM),
                low: this.getErrorCountBySeverity(ErrorSeverity.LOW)
            },
            performance: {
                total: Array.from(this.metrics.performance.values()).reduce((sum, count) => sum + count, 0),
                byLevel: Object.fromEntries(this.metrics.performance),
                averageResponseTime: this.calculateAverageResponseTime()
            },
            health: this.calculateHealthScore()
        };
    }

    /**
 * Calculate health score based on error rates and performance
 */
    calculateHealthScore() {
        let score = 100;

        // Deduct points for errors using direct helper methods
        score -= this.getErrorCountBySeverity(ErrorSeverity.CRITICAL) * 20;
        score -= this.getErrorCountBySeverity(ErrorSeverity.HIGH) * 10;
        score -= this.getErrorCountBySeverity(ErrorSeverity.MEDIUM) * 5;
        score -= this.getErrorCountBySeverity(ErrorSeverity.LOW) * 1;

        // Deduct points for poor performance
        const slowOps = this.getPerformanceCountByLevel('slow');
        const criticalOps = this.getPerformanceCountByLevel('critical');
        score -= slowOps * 2;
        score -= criticalOps * 10;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Helper methods
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getErrorCountBySeverity(severity) {
        return Array.from(this.metrics.errors.entries())
            .filter(([key]) => key.startsWith(severity))
            .reduce((sum, [, count]) => sum + count, 0);
    }

    getPerformanceCountByLevel(level) {
        return Array.from(this.metrics.performance.entries())
            .filter(([key]) => key.endsWith(level))
            .reduce((sum, [, count]) => sum + count, 0);
    }

    calculateAverageResponseTime() {
        if (this.metrics.totalOperations === 0) {
            return 'N/A - No operations tracked yet';
        }

        const average = this.metrics.totalDuration / this.metrics.totalOperations;
        return Math.round(average * 100) / 100; // Round to 2 decimal places
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    logToConsole(errorEntry) {
        const colors = {
            [ErrorSeverity.LOW]: '\x1b[36m',      // Cyan
            [ErrorSeverity.MEDIUM]: '\x1b[33m',   // Yellow
            [ErrorSeverity.HIGH]: '\x1b[31m',     // Red
            [ErrorSeverity.CRITICAL]: '\x1b[35m'  // Magenta
        };

        const reset = '\x1b[0m';
        const color = colors[errorEntry.severity] || colors[ErrorSeverity.MEDIUM];

        console.error(`${color}[${errorEntry.severity.toUpperCase()}]${reset} ${errorEntry.timestamp} - ${errorEntry.message}`);

        if (errorEntry.context && Object.keys(errorEntry.context).length > 0) {
            console.error('Context:', errorEntry.context);
        }
    }

    logToFileSystem(errorEntry) {
        const logFile = join(this.logDirectory, `errors-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(errorEntry) + '\n';

        try {
            writeFileSync(logFile, logLine, { flag: 'a' });
        } catch (err) {
            console.error('Failed to write error log to file:', err.message);
        }
    }

    logPerformanceToFile(performanceEntry) {
        const logFile = join(this.logDirectory, `performance-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(performanceEntry) + '\n';

        try {
            writeFileSync(logFile, logLine, { flag: 'a' });
        } catch (err) {
            console.error('Failed to write performance log to file:', err.message);
        }
    }
}

/**
 * Global error monitor instance
 */
export const globalErrorMonitor = new ErrorMonitor({
    enabled: process.env.NODE_ENV !== 'test',
    logToFile: process.env.ERROR_LOGGING !== 'false',
    performanceTracking: process.env.PERFORMANCE_TRACKING !== 'false'
});

/**
 * Convenience function for tracking async operations
 */
export async function trackAsyncOperation(operationName, asyncFunction, context = {}) {
    const tracker = globalErrorMonitor.startPerformanceTracking(operationName, context);

    try {
        const result = await asyncFunction();
        tracker?.end();
        return result;
    } catch (error) {
        tracker?.end();
        globalErrorMonitor.logError(error, ErrorSeverity.HIGH, {
            operation: operationName,
            ...context
        });
        throw error;
    }
}

/**
 * Convenience function for tracking sync operations
 */
export function trackSyncOperation(operationName, syncFunction, context = {}) {
    const tracker = globalErrorMonitor.startPerformanceTracking(operationName, context);

    try {
        const result = syncFunction();
        tracker?.end();
        return result;
    } catch (error) {
        tracker?.end();
        globalErrorMonitor.logError(error, ErrorSeverity.HIGH, {
            operation: operationName,
            ...context
        });
        throw error;
    }
}

export default ErrorMonitor; 