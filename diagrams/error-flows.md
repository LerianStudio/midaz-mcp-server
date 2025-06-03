# Error Handling and Recovery Flow Diagrams

## Comprehensive Error Detection and Recovery

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant EH as ErrorHandler
    participant TH as ToolHandler
    participant API as Backend API
    participant AL as AuditLogger
    participant SD as SampleData
    
    C->>S: invalid tool request
    S->>EH: handleRequest(invalidRequest)
    EH->>EH: validateRequestFormat()
    EH->>AL: logError("Invalid request format")
    
    alt Parse Error (malformed JSON)
        EH-->>S: JSON-RPC error -32700
        S-->>C: {"error": {"code": -32700, "message": "Parse error"}}
    else Unknown Tool
        EH-->>S: JSON-RPC error -32601
        S-->>C: {"error": {"code": -32601, "message": "Method not found"}}
    else Invalid Parameters
        EH->>TH: validateToolParameters()
        TH->>TH: schema validation
        TH-->>EH: validation failed
        EH->>AL: logValidationError(details)
        EH-->>S: JSON-RPC error -32602
        S-->>C: {"error": {"code": -32602, "message": "Invalid params", "data": {...}}}
    end
```

## Backend Service Failure and Fallback

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant API as Backend Service
    participant SD as SampleData
    participant AL as AuditLogger
    participant CFG as ConfigManager
    
    C->>S: list-organizations
    S->>TH: getOrganizations()
    TH->>AC: makeApiRequest()
    AC->>API: GET /organizations
    
    alt Service Unavailable
        API-->>AC: Connection refused
        AC->>AL: logServiceFailure("onboarding", "connection_refused")
        AC-->>TH: service error
        
        TH->>CFG: checkStubMode()
        CFG-->>TH: stubs enabled
        
        TH->>SD: getSampleOrganizations()
        SD-->>TH: sample data
        TH->>AL: logStubDataUsed("organizations")
        TH-->>S: sample response (marked as fallback)
        S-->>C: organization list (sample data)
        
        Note over C,C: Client receives fallback data
    else Service Returns Error
        API-->>AC: 500 Internal Server Error
        AC->>AL: logApiError(500, "internal_error")
        AC-->>TH: server error
        
        alt Retryable Error
            TH->>AC: retryRequest()
            AC->>API: GET /organizations (retry)
            API-->>AC: 200 OK
            AC-->>TH: success response
            TH-->>S: real data
            S-->>C: organization list (real)
        else Non-Retryable Error
            TH->>SD: getSampleOrganizations()
            SD-->>TH: fallback data
            TH-->>S: sample response
            S-->>C: organization list (sample)
        end
    end
```

## Authentication and Authorization Error Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant AC as ApiClient
    participant API as Backend Service
    participant SM as SecurityManager
    participant AL as AuditLogger
    
    C->>S: get-account (sensitive operation)
    S->>TH: getAccount(account_id)
    TH->>AC: makeAuthenticatedRequest()
    AC->>API: GET /accounts/{id} + Bearer token
    
    alt Invalid/Expired Token
        API-->>AC: 401 Unauthorized
        AC->>AL: logAuthenticationFailure("invalid_token")
        AC-->>TH: auth error
        TH->>SM: handleAuthError()
        SM->>SM: check token refresh capability
        
        alt Token Refresh Possible
            SM->>API: refresh token
            API-->>SM: new token
            SM->>AC: updateAuthToken()
            AC->>API: retry request with new token
            API-->>AC: 200 OK
            AC-->>TH: success response
        else Token Refresh Failed
            SM->>AL: logAuthenticationFailure("refresh_failed")
            SM-->>TH: authentication failed
            TH-->>S: MCP error -32003 (Access Denied)
            S-->>C: authentication error
        end
    else Insufficient Permissions
        API-->>AC: 403 Forbidden
        AC->>AL: logAuthorizationFailure(account_id, "insufficient_permissions")
        AC-->>TH: authorization error
        TH-->>S: MCP error -32003 (Access Denied)
        S-->>C: insufficient permissions
    end
```

## Input Validation and Injection Detection

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant IV as InputValidator
    participant ID as InjectionDetector
    participant AL as AuditLogger
    participant SM as SecurityManager
    
    C->>S: create-transaction (malicious input)
    S->>TH: createTransaction(suspiciousData)
    TH->>IV: validateInput(data)
    
    IV->>IV: check data types
    IV->>IV: validate field lengths
    IV->>IV: check required fields
    
    IV->>ID: detectInjectionPatterns(data)
    ID->>ID: scan for SQL injection
    ID->>ID: scan for script injection
    ID->>ID: scan for command injection
    
    alt Injection Detected
        ID-->>IV: injection patterns found
        IV->>AL: logSecurityViolation("injection_attempt", data)
        IV->>SM: handleSecurityThreat()
        SM->>SM: increment violation count
        SM->>SM: check rate limiting
        
        alt Rate Limit Exceeded
            SM->>AL: logRateLimitViolation("security")
            SM-->>TH: rate limit exceeded
            TH-->>S: MCP error -32005 (Rate Limited)
            S-->>C: too many security violations
        else Within Rate Limit
            SM-->>TH: input rejected
            TH-->>S: MCP error -32602 (Invalid Params)
            S-->>C: input validation failed
        end
    else Validation Passed
        ID-->>IV: no injection detected
        IV-->>TH: input valid
        TH->>TH: proceed with operation
    end
```

## Transaction Rollback and Consistency

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant TS as Transaction Service
    participant DB as Database
    participant AL as AuditLogger
    participant NS as Notification Service
    
    C->>S: create-transaction (transfer $1000)
    S->>TH: createTransaction(transferData)
    TH->>TS: processTransfer(from, to, amount)
    TS->>DB: BEGIN TRANSACTION
    
    TS->>DB: UPDATE account SET balance = balance - 1000 WHERE id = from_account
    
    alt Insufficient Funds
        DB-->>TS: CHECK constraint violation (balance < 0)
        TS->>AL: logTransactionError("insufficient_funds", transferData)
        TS->>DB: ROLLBACK
        TS-->>TH: transaction failed (insufficient funds)
        TH-->>S: business logic error
        S-->>C: insufficient funds error
    else Database Constraint Violation
        TS->>DB: UPDATE account SET balance = balance + 1000 WHERE id = to_account
        DB-->>TS: FOREIGN KEY constraint violation (invalid account)
        TS->>AL: logTransactionError("invalid_account", transferData)
        TS->>DB: ROLLBACK
        TS-->>TH: transaction failed (invalid account)
        TH-->>S: data integrity error
        S-->>C: invalid account error
    else Database Connection Lost
        TS->>DB: COMMIT
        DB-->>TS: connection lost
        TS->>AL: logSystemError("db_connection_lost", transferData)
        TS->>TS: assume rollback occurred
        TS->>NS: notifySystemAdmins("db_connection_issue")
        TS-->>TH: system error
        TH-->>S: MCP error -32603 (Internal Error)
        S-->>C: system temporarily unavailable
    else Success
        TS->>DB: COMMIT
        DB-->>TS: transaction committed
        TS->>AL: logSuccessfulTransaction(transferData)
        TS-->>TH: transfer completed
        TH-->>S: success response
        S-->>C: transfer successful
    end
```

## Rate Limiting and Abuse Prevention

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant RL as RateLimiter
    participant TH as ToolHandler
    participant AL as AuditLogger
    participant BL as BlockList
    participant SM as SecurityManager
    
    loop Multiple Rapid Requests
        C->>S: tool request
        S->>RL: checkRateLimit(client_id)
        RL->>RL: increment request count
        RL->>RL: check time window
        
        alt Within Rate Limit
            RL-->>S: request allowed
            S->>TH: process normally
            TH-->>S: response
            S-->>C: normal response
        else Rate Limit Exceeded
            RL->>AL: logRateLimitViolation(client_id)
            RL-->>S: rate limit exceeded
            S-->>C: HTTP 429 Too Many Requests
        end
    end
    
    alt Persistent Abuse
        RL->>SM: reportPersistentAbuse(client_id)
        SM->>SM: analyze violation patterns
        SM->>BL: addToBlockList(client_id, duration)
        SM->>AL: logSecurityAction("client_blocked", client_id)
        
        Note over C,SM: Subsequent requests blocked
        C->>S: any request
        S->>BL: isBlocked(client_id)
        BL-->>S: client blocked
        S-->>C: access denied (blocked)
    end
```

## Circuit Breaker Pattern for Service Health

```mermaid
sequenceDiagram
    participant TH as ToolHandler
    participant CB as CircuitBreaker
    participant API as Backend Service
    participant HM as HealthMonitor
    participant AL as AuditLogger
    participant SD as SampleData
    
    Note over TH,SD: Normal Operation (Circuit Closed)
    TH->>CB: makeRequest()
    CB->>CB: check circuit state (CLOSED)
    CB->>API: forward request
    API-->>CB: success response
    CB->>HM: recordSuccess()
    CB-->>TH: response
    
    Note over TH,SD: Failures Accumulate
    loop Multiple Failures
        TH->>CB: makeRequest()
        CB->>API: forward request
        API-->>CB: error response
        CB->>HM: recordFailure()
        HM->>HM: increment failure count
    end
    
    Note over TH,SD: Circuit Opens (Failure Threshold Exceeded)
    HM->>CB: failureThresholdExceeded()
    CB->>CB: setState(OPEN)
    CB->>AL: logCircuitBreakerOpen("backend_service")
    
    Note over TH,SD: Requests Fail Fast
    TH->>CB: makeRequest()
    CB->>CB: check circuit state (OPEN)
    CB->>SD: getSampleData()
    SD-->>CB: fallback data
    CB-->>TH: fallback response (no API call)
    
    Note over TH,SD: Half-Open State (Recovery Attempt)
    CB->>CB: timeout expired, setState(HALF_OPEN)
    TH->>CB: makeRequest()
    CB->>API: test request
    
    alt Recovery Successful
        API-->>CB: success response
        CB->>CB: setState(CLOSED)
        CB->>AL: logCircuitBreakerClosed("backend_service")
        CB-->>TH: success response
    else Recovery Failed
        API-->>CB: error response
        CB->>CB: setState(OPEN)
        CB->>SD: getSampleData()
        SD-->>CB: fallback data
        CB-->>TH: fallback response
    end
```