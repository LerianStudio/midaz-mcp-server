/**
 * HTTP Client with Connection Pooling and Circuit Breaker
 * 
 * This module provides an enhanced HTTP client with:
 * - Connection pooling for better performance
 * - Circuit breaker pattern for resilience
 * - Exponential backoff with jitter for retries
 * - Request/response caching
 */

import fetch from 'node-fetch';
import http from 'http';
import https from 'https';

// Create agents with connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 30000
});

// Circuit breaker states
const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

// Circuit breaker configuration
const circuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  halfOpenRequests: 3
};

// Circuit breakers per host
const circuitBreakers = new Map();

// Response cache
const responseCache = new Map();
const CACHE_TTL = 60000; // 1 minute

/**
 * Get or create circuit breaker for a host
 * @param {string} host - The host URL
 * @returns {Object} Circuit breaker instance
 */
function getCircuitBreaker(host) {
  if (!circuitBreakers.has(host)) {
    circuitBreakers.set(host, {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: null,
      halfOpenAttempts: 0
    });
  }
  return circuitBreakers.get(host);
}

/**
 * Check if circuit breaker allows request
 * @param {string} host - The host URL
 * @returns {boolean} Whether request is allowed
 */
function isRequestAllowed(host) {
  const breaker = getCircuitBreaker(host);
  
  if (breaker.state === CircuitState.CLOSED) {
    return true;
  }
  
  if (breaker.state === CircuitState.OPEN) {
    const now = Date.now();
    if (now - breaker.lastFailureTime > circuitBreakerConfig.resetTimeout) {
      breaker.state = CircuitState.HALF_OPEN;
      breaker.halfOpenAttempts = 0;
      return true;
    }
    return false;
  }
  
  if (breaker.state === CircuitState.HALF_OPEN) {
    return breaker.halfOpenAttempts < circuitBreakerConfig.halfOpenRequests;
  }
  
  return false;
}

/**
 * Record request success
 * @param {string} host - The host URL
 */
function recordSuccess(host) {
  const breaker = getCircuitBreaker(host);
  
  if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.state = CircuitState.CLOSED;
    breaker.failures = 0;
    breaker.halfOpenAttempts = 0;
  }
}

/**
 * Record request failure
 * @param {string} host - The host URL
 */
function recordFailure(host) {
  const breaker = getCircuitBreaker(host);
  
  breaker.failures++;
  breaker.lastFailureTime = Date.now();
  
  if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.halfOpenAttempts++;
    if (breaker.halfOpenAttempts >= circuitBreakerConfig.halfOpenRequests) {
      breaker.state = CircuitState.OPEN;
    }
  } else if (breaker.failures >= circuitBreakerConfig.failureThreshold) {
    breaker.state = CircuitState.OPEN;
  }
}

/**
 * Calculate exponential backoff with jitter
 * @param {number} attempt - Retry attempt number
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
  return exponentialDelay + jitter;
}

/**
 * Get cache key for request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {string} Cache key
 */
function getCacheKey(url, options = {}) {
  return `${options.method || 'GET'}:${url}`;
}

/**
 * Enhanced fetch with circuit breaker, retries, and caching
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function enhancedFetch(url, options = {}) {
  const urlObj = new URL(url);
  const host = urlObj.origin;
  
  // Check circuit breaker
  if (!isRequestAllowed(host)) {
    throw new Error(`Circuit breaker OPEN for ${host}`);
  }
  
  // Check cache for GET requests
  if (!options.method || options.method === 'GET') {
    const cacheKey = getCacheKey(url, options);
    const cached = responseCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.response.clone();
    }
  }
  
  // Configure agent based on protocol
  const agent = urlObj.protocol === 'https:' ? httpsAgent : httpAgent;
  
  // Merge options with agent
  const fetchOptions = {
    ...options,
    agent,
    signal: options.signal || AbortSignal.timeout(options.timeout || 10000)
  };
  
  // Retry logic
  const maxRetries = options.retries || 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      // Record success
      recordSuccess(host);
      
      // Cache successful GET responses
      if ((!options.method || options.method === 'GET') && response.ok) {
        const cacheKey = getCacheKey(url, options);
        responseCache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Record failure
      recordFailure(host);
      
      // Don't retry if circuit breaker opened
      if (!isRequestAllowed(host)) {
        break;
      }
      
      // Don't retry on client errors
      if (error.name === 'AbortError' || error.type === 'aborted') {
        break;
      }
      
      // Wait before retry (except for last attempt)
      if (attempt < maxRetries - 1) {
        const delay = calculateBackoff(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} retries`);
}

/**
 * Clear response cache
 */
export function clearResponseCache() {
  responseCache.clear();
}

/**
 * Get circuit breaker statistics
 * @returns {Object} Circuit breaker stats
 */
export function getCircuitBreakerStats() {
  const stats = {};
  
  for (const [host, breaker] of circuitBreakers.entries()) {
    stats[host] = {
      state: breaker.state,
      failures: breaker.failures,
      lastFailureTime: breaker.lastFailureTime ? new Date(breaker.lastFailureTime).toISOString() : null
    };
  }
  
  return stats;
}

/**
 * Reset circuit breaker for a host
 * @param {string} host - The host URL
 */
export function resetCircuitBreaker(host) {
  if (circuitBreakers.has(host)) {
    const breaker = circuitBreakers.get(host);
    breaker.state = CircuitState.CLOSED;
    breaker.failures = 0;
    breaker.lastFailureTime = null;
    breaker.halfOpenAttempts = 0;
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.error(`[HTTP Cache] Cleaned up ${removed} expired entries`);
  }
}, 60000); // Run every minute