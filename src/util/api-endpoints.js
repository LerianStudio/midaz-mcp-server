/**
 * API endpoint definitions for Midaz backend
 * Maps the MCP tools to actual Midaz API endpoints
 */

// Base API paths for different components
const API_VERSION = 'v1';

// API endpoint definitions
export const ENDPOINTS = {
    // Organization endpoints
    ORGANIZATIONS: {
        LIST: `${API_VERSION}/organizations`,
        GET: (id) => `${API_VERSION}/organizations/${id}`,
    },

    // Ledger endpoints
    LEDGERS: {
        LIST: (organizationId) => `${API_VERSION}/organizations/${organizationId}/ledgers`,
        GET: (organizationId, id) => `${API_VERSION}/organizations/${organizationId}/ledgers/${id}`,
    },

    // Account endpoints
    ACCOUNTS: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts/${id}`,
        GET_BY_ALIAS: (organizationId, ledgerId, alias) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts/alias/${alias}`,
    },

    // Transaction endpoints
    TRANSACTIONS: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${id}`,
        CREATE: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/json`,
        CREATE_DSL: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/dsl`,
        CREATE_TEMPLATE: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/templates`,
        UPDATE: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${id}`,
        COMMIT: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${id}/commit`,
        REVERT: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${id}/revert`,
    },

    // Operation endpoints
    OPERATIONS: {
        LIST: (organizationId, ledgerId, transactionId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${transactionId}/operations`,
        LIST_BY_ACCOUNT: (organizationId, ledgerId, accountId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts/${accountId}/operations`,
        GET: (organizationId, ledgerId, transactionId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${transactionId}/operations/${id}`,
        GET_BY_ACCOUNT: (organizationId, ledgerId, accountId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${id}`,
        UPDATE: (organizationId, ledgerId, transactionId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/transactions/${transactionId}/operations/${id}`,
    },

    // Balance endpoints
    BALANCES: {
        GET_ACCOUNT_BALANCE: (organizationId, ledgerId, accountId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/accounts/${accountId}/balances`,
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/balances`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/balances/${id}`,
        UPDATE: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/balances/${id}`,
        DELETE: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/balances/${id}`,
    },

    // Asset endpoints
    ASSETS: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/assets`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/assets/${id}`,
    },

    // Asset Rate endpoints
    ASSET_RATES: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/asset-rates`,
        CREATE_OR_UPDATE: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/asset-rates`,
        GET_BY_EXTERNAL_ID: (organizationId, ledgerId, externalId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/asset-rates/${externalId}`,
        GET_BY_ASSET_CODE: (organizationId, ledgerId, assetCode) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/asset-rates/from/${assetCode}`,
    },

    // Portfolio endpoints
    PORTFOLIOS: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/portfolios`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/portfolios/${id}`,
    },

    // Segment endpoints
    SEGMENTS: {
        LIST: (organizationId, ledgerId) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/segments`,
        GET: (organizationId, ledgerId, id) =>
            `${API_VERSION}/organizations/${organizationId}/ledgers/${ledgerId}/segments/${id}`,
    },
};

export default ENDPOINTS; 