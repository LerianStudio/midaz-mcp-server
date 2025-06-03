# API Flow Diagrams

## Midaz Backend Integration Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant OS as Onboarding Service
    participant TS as Transaction Service
    
    Note over C,TS: Organization Management Flow
    C->>S: list-organizations tool call
    S->>TH: handleListOrganizations()
    TH->>AC: makeRequest('/organizations')
    AC->>AC: determine backend service
    AC->>OS: GET /v1/organizations
    OS-->>AC: organizations data
    AC->>AC: format response
    AC-->>TH: formatted data
    TH-->>S: paginated response
    S-->>C: organization list
    
    Note over C,TS: Transaction Flow (different service)
    C->>S: list-transactions tool call
    S->>TH: handleListTransactions()
    TH->>AC: makeRequest('/transactions', org_id, ledger_id)
    AC->>AC: route to transaction service
    AC->>TS: GET /v1/organizations/{org}/ledgers/{ledger}/transactions
    TS-->>AC: transaction data
    AC-->>TH: formatted data
    TH-->>S: transaction response
    S-->>C: transaction list
```

## Service Auto-Detection Flow

```mermaid
sequenceDiagram
    participant S as McpServer
    participant SD as ServiceDiscovery
    participant OS as Onboarding Service
    participant TS as Transaction Service
    participant CFG as ConfigManager
    
    Note over S,CFG: Startup Service Detection
    S->>SD: discoverServices()
    SD->>CFG: getServiceUrls()
    CFG-->>SD: onboarding: :3000, transaction: :3001
    
    par Onboarding Service Check
        SD->>OS: GET /health
        OS-->>SD: 200 OK (service available)
    and Transaction Service Check  
        SD->>TS: GET /health
        TS-->>SD: 200 OK (service available)
    end
    
    SD->>SD: updateServiceStatus()
    SD-->>S: both services available, useStubs=false
    
    Note over S,CFG: Fallback Mode
    alt Service Unavailable
        SD->>OS: GET /health
        OS-->>SD: connection refused
        SD->>SD: markServiceUnavailable()
        SD-->>S: service down, useStubs=true
        Note over S,CFG: Automatic fallback to sample data
    end
```

## API Request with Retry Logic

```mermaid
sequenceDiagram
    participant TH as ToolHandler
    participant AC as ApiClient
    participant RL as RetryLogic
    participant BS as Backend Service
    participant L as Logger
    
    TH->>AC: makeApiRequest()
    AC->>RL: executeWithRetry()
    
    loop Retry Attempts (max 3)
        RL->>BS: HTTP request
        
        alt Success Response
            BS-->>RL: 200 OK + data
            RL-->>AC: success response
            AC-->>TH: formatted data
        else Retryable Error (5xx, network)
            BS-->>RL: 503 Service Unavailable
            RL->>L: logRetryAttempt(attempt_num)
            RL->>RL: exponential backoff delay
            Note over RL: Wait 1s, 2s, 4s...
        else Non-Retryable Error (4xx)
            BS-->>RL: 404 Not Found
            RL-->>AC: immediate error response
            AC-->>TH: error with details
        end
    end
    
    alt Max Retries Exceeded
        RL->>L: logMaxRetriesExceeded()
        RL-->>AC: final error response
        AC-->>TH: service unavailable error
        TH->>TH: fallback to stub data
        TH-->>TH: sample data response
    end
```

## Hierarchical API Navigation

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant API as Midaz API
    
    Note over C,API: Navigate Organization Hierarchy
    C->>S: list-organizations
    S->>TH: getOrganizations()
    TH->>AC: GET /organizations
    AC->>API: request organizations
    API-->>AC: [{id: "org-1", name: "Acme Corp"}]
    AC-->>TH: organizations
    TH-->>S: response
    S-->>C: organization list
    
    Note over C,API: Drill down to Ledgers
    C->>S: list-ledgers (organization_id: "org-1")
    S->>TH: getLedgers("org-1")
    TH->>AC: GET /organizations/org-1/ledgers
    AC->>API: request ledgers for org-1
    API-->>AC: [{id: "ledger-1", name: "Main Ledger"}]
    AC-->>TH: ledgers
    TH-->>S: response  
    S-->>C: ledger list
    
    Note over C,API: Access Accounts
    C->>S: list-accounts (org_id: "org-1", ledger_id: "ledger-1")
    S->>TH: getAccounts("org-1", "ledger-1")
    TH->>AC: GET /organizations/org-1/ledgers/ledger-1/accounts
    AC->>API: request accounts
    API-->>AC: [{id: "acc-1", name: "Checking", balance: 1000}]
    AC-->>TH: accounts
    TH-->>S: response
    S-->>C: account list
    
    Note over C,API: Complete hierarchy navigation
```

## API Error Handling and Fallback

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant API as Midaz API
    participant SD as SampleData
    participant L as Logger
    
    C->>S: get-account (id: "invalid-id")
    S->>TH: getAccount("invalid-id")
    TH->>AC: GET /accounts/invalid-id
    AC->>API: request account
    API-->>AC: 404 Not Found
    
    AC->>L: logApiError(404, "Account not found")
    AC-->>TH: API error (404)
    
    alt useStubs enabled
        TH->>SD: getSampleAccount("invalid-id")
        SD-->>TH: sample account data
        TH->>L: logStubDataUsed("account", "invalid-id")
        TH-->>S: sample response (marked as stub)
        S-->>C: account data (sample)
        Note over C,C: Client receives sample data
    else useStubs disabled
        TH->>L: logApiFailure("account", "invalid-id")
        TH-->>S: MCP error (-32002 Resource Not Found)
        S-->>C: JSON-RPC error response
        Note over C,C: Client receives error
    end
```

## Paginated API Response Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant API as Midaz API
    participant PR as PaginationHelper
    
    Note over C,API: First Page Request
    C->>S: list-transactions (limit: 10)
    S->>TH: getTransactions({limit: 10})
    TH->>PR: createPaginatedRequest({limit: 10})
    PR-->>TH: {limit: 10, cursor: null}
    
    TH->>AC: GET /transactions?limit=10
    AC->>API: paginated request
    API-->>AC: {items: [...], nextCursor: "page2_token"}
    AC-->>TH: paginated response
    
    TH->>PR: formatPaginatedResponse(response)
    PR->>PR: add pagination metadata
    PR-->>TH: {items: [...], pagination: {nextCursor: "page2_token", hasMore: true}}
    TH-->>S: paginated result
    S-->>C: transactions page 1
    
    Note over C,API: Next Page Request
    C->>S: list-transactions (cursor: "page2_token", limit: 10)
    S->>TH: getTransactions({cursor: "page2_token", limit: 10})
    TH->>AC: GET /transactions?cursor=page2_token&limit=10
    AC->>API: next page request
    API-->>AC: {items: [...], nextCursor: null}
    AC-->>TH: final page response
    
    TH->>PR: formatPaginatedResponse(response)
    PR-->>TH: {items: [...], pagination: {nextCursor: null, hasMore: false}}
    TH-->>S: final page
    S-->>C: transactions page 2 (last)
```

## Authentication and API Key Management

```mermaid
sequenceDiagram
    participant S as McpServer
    participant CFG as ConfigManager
    participant AC as ApiClient
    participant API as Midaz API
    participant SM as SecurityManager
    
    Note over S,SM: API Key Setup
    S->>CFG: loadApiKey()
    CFG->>CFG: check environment variables
    CFG->>CFG: check config files
    CFG-->>S: API_KEY loaded
    
    S->>SM: validateApiKey(API_KEY)
    SM->>SM: check key format and length
    SM-->>S: key validated
    
    S->>AC: setAuthenticationHeaders(API_KEY)
    AC->>AC: configure Bearer token
    AC-->>S: authentication configured
    
    Note over S,SM: API Request with Authentication
    C->>S: any tool request
    S->>TH: execute tool
    TH->>AC: makeAuthenticatedRequest()
    AC->>AC: add Authorization header
    AC->>API: HTTP request + Bearer {API_KEY}
    
    alt Valid API Key
        API->>API: validate Bearer token
        API-->>AC: 200 OK + data
        AC-->>TH: successful response
    else Invalid API Key
        API-->>AC: 401 Unauthorized
        AC->>SM: logAuthenticationFailure()
        AC-->>TH: authentication error
        TH-->>S: error response
    end
```