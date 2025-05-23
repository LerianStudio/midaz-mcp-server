/**
 * API utilities for communicating with the Midaz backend
 */

import config from '../config.js';
import ENDPOINTS from './api-endpoints.js';
import fetch from 'node-fetch';

// Maximum number of retries for API calls
const MAX_RETRIES = config.backend.retries;

/**
 * Determine which backend URL to use for a given endpoint
 * @param {string} endpoint - The API endpoint 
 * @returns {Object} - Backend configuration with baseUrl and apiKey
 */
function getBackendForEndpoint(endpoint) {
    // Since onboarding handles organizations, ledgers, accounts, we route
    // those endpoints to the onboarding service
    if (endpoint.startsWith('v1/organizations')) {
        const parts = endpoint.split('/');
        // Check if we're dealing with transactions or balances
        // Format: v1/organizations/{orgId}/ledgers/{ledgerId}/transactions
        // or: v1/organizations/{orgId}/ledgers/{ledgerId}/accounts/{accountId}/balances
        if (
            (parts.length >= 6 && parts[5] === 'transactions') ||
            (parts.length >= 6 && parts[5] === 'asset-rates') ||
            (parts.length >= 8 && parts[7] === 'balances') ||
            (parts.length >= 8 && parts[7] === 'operations')
        ) {
            return config.backend.transaction;
        }
        return config.backend.onboarding;
    }

    // Default to onboarding for anything that doesn't match transaction patterns
    return config.backend.onboarding;
}

/**
 * Make an API call to the Midaz backend
 * @param {string} endpoint - The endpoint to call (without leading slash)
 * @param {Object} options - Fetch options
 * @param {Object} params - URL query parameters
 * @returns {Promise<Object>} - The response as JSON
 */
export async function callApi(endpoint, options = {}, params = {}) {
    // If using stubs, skip real API calls
    if (config.useStubs) {
        throw new Error('Using stub data, real API calls are disabled');
    }

    // Determine which backend to use based on the endpoint
    const backend = getBackendForEndpoint(endpoint);
    const url = new URL(`${backend.baseUrl}/${endpoint}`);

    // Add query parameters
    if (params) {
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
    }

    // Set default options
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(backend.apiKey ? { 'Authorization': `Bearer ${backend.apiKey}` } : {}),
        },
        timeout: config.backend.timeout,
        ...options,
    };

    // JSON stringify the body if it's an object
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    // Implement retry logic
    let retries = 0;
    let lastError;

    while (retries < MAX_RETRIES) {
        try {
            const response = await enhancedFetch(url.toString(), fetchOptions);

            // Handle error responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            // Parse JSON response
            return await response.json();
        } catch (error) {
            lastError = error;
            retries++;

            // Only retry on network errors or 5xx status codes
            if (!error.message.includes('API Error (5') && !error.code) {
                break;
            }

            // Log retry attempt
            console.error(`API call failed (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);

            // Exponential backoff
            const delay = Math.min(1000 * 2 ** retries, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('API call failed');
}

/**
 * Make a GET request to the Midaz API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response data
 */
export function get(endpoint, params = {}) {
    return callApi(endpoint, { method: 'GET' }, params);
}

/**
 * Make a POST request to the Midaz API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - POST data
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response data
 */
export function post(endpoint, data = {}, params = {}) {
    return callApi(
        endpoint,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
        params
    );
}

/**
 * Make a PUT request to the Midaz API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - PUT data
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response data
 */
export function put(endpoint, data = {}, params = {}) {
    return callApi(
        endpoint,
        {
            method: 'PUT',
            body: JSON.stringify(data),
        },
        params
    );
}

/**
 * Make a DELETE request to the Midaz API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response data
 */
export function remove(endpoint, params = {}) {
    return callApi(endpoint, { method: 'DELETE' }, params);
}

// Organization API
export const organizations = {
    list: (params = {}) => get(ENDPOINTS.ORGANIZATIONS.LIST, params),
    get: (id) => get(ENDPOINTS.ORGANIZATIONS.GET(id)),
};

// Ledger API
export const ledgers = {
    list: (organizationId, params = {}) =>
        get(ENDPOINTS.LEDGERS.LIST(organizationId), params),
    get: (organizationId, id) =>
        get(ENDPOINTS.LEDGERS.GET(organizationId, id)),
};

// Account API
export const accounts = {
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.ACCOUNTS.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.ACCOUNTS.GET(organizationId, ledgerId, id)),
    getByAlias: (organizationId, ledgerId, alias) =>
        get(ENDPOINTS.ACCOUNTS.GET_BY_ALIAS(organizationId, ledgerId, alias)),
};

// Transaction API
export const transactions = {
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.TRANSACTIONS.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.TRANSACTIONS.GET(organizationId, ledgerId, id)),
    create: (organizationId, ledgerId, data) =>
        post(ENDPOINTS.TRANSACTIONS.CREATE(organizationId, ledgerId), data),
    createDSL: (organizationId, ledgerId, data) =>
        post(ENDPOINTS.TRANSACTIONS.CREATE_DSL(organizationId, ledgerId), data),
    createTemplate: (organizationId, ledgerId, data) =>
        post(ENDPOINTS.TRANSACTIONS.CREATE_TEMPLATE(organizationId, ledgerId), data),
    update: (organizationId, ledgerId, id, data) =>
        put(ENDPOINTS.TRANSACTIONS.UPDATE(organizationId, ledgerId, id), data),
    commit: (organizationId, ledgerId, id) =>
        post(ENDPOINTS.TRANSACTIONS.COMMIT(organizationId, ledgerId, id)),
    revert: (organizationId, ledgerId, id) =>
        post(ENDPOINTS.TRANSACTIONS.REVERT(organizationId, ledgerId, id)),
};

// Operation API
export const operations = {
    list: (organizationId, ledgerId, accountId, params = {}) => {
        return get(ENDPOINTS.OPERATIONS.LIST(organizationId, ledgerId, accountId), params);
    },
    get: (organizationId, ledgerId, accountId, operationId) => {
        return get(ENDPOINTS.OPERATIONS.GET(organizationId, ledgerId, accountId, operationId));
    },
    listByAccount: (organizationId, ledgerId, accountId, params = {}) =>
        get(ENDPOINTS.OPERATIONS.LIST_BY_ACCOUNT(organizationId, ledgerId, accountId), params),
    getByAccount: (organizationId, ledgerId, accountId, operationId) =>
        get(ENDPOINTS.OPERATIONS.GET_BY_ACCOUNT(organizationId, ledgerId, accountId, operationId)),
    update: (organizationId, ledgerId, transactionId, operationId, data) =>
        put(ENDPOINTS.OPERATIONS.UPDATE(organizationId, ledgerId, transactionId, operationId), data),
};

// Balance API
export const balances = {
    getAccountBalance: (organizationId, ledgerId, accountId, params = {}) =>
        get(ENDPOINTS.BALANCES.GET_ACCOUNT_BALANCE(organizationId, ledgerId, accountId), params),
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.BALANCES.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.BALANCES.GET(organizationId, ledgerId, id)),
    update: (organizationId, ledgerId, id, data) =>
        put(ENDPOINTS.BALANCES.UPDATE(organizationId, ledgerId, id), data),
    delete: (organizationId, ledgerId, id) =>
        remove(ENDPOINTS.BALANCES.DELETE(organizationId, ledgerId, id)),
};

// Asset API
export const assets = {
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.ASSETS.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.ASSETS.GET(organizationId, ledgerId, id)),
};

// Asset Rate API
export const assetRates = {
    list: (organizationId, ledgerId, params = {}) => {
        return Promise.reject(new Error('Asset rates API is not currently supported'));
    },
    createOrUpdate: (organizationId, ledgerId, data) =>
        put(ENDPOINTS.ASSET_RATES.CREATE_OR_UPDATE(organizationId, ledgerId), data),
    getByExternalId: (organizationId, ledgerId, externalId) =>
        get(ENDPOINTS.ASSET_RATES.GET_BY_EXTERNAL_ID(organizationId, ledgerId, externalId)),
    getByAssetCode: (organizationId, ledgerId, assetCode, params = {}) =>
        get(ENDPOINTS.ASSET_RATES.GET_BY_ASSET_CODE(organizationId, ledgerId, assetCode), params),
};

// Portfolio API
export const portfolios = {
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.PORTFOLIOS.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.PORTFOLIOS.GET(organizationId, ledgerId, id)),
};

// Segment API
export const segments = {
    list: (organizationId, ledgerId, params = {}) =>
        get(ENDPOINTS.SEGMENTS.LIST(organizationId, ledgerId), params),
    get: (organizationId, ledgerId, id) =>
        get(ENDPOINTS.SEGMENTS.GET(organizationId, ledgerId, id)),
};

export default {
    get,
    post,
    put,
    delete: remove,
    organizations,
    ledgers,
    accounts,
    transactions,
    operations,
    balances,
    assets,
    assetRates,
    portfolios,
    segments,
}; 