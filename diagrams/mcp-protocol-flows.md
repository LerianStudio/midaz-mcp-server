# MCP Protocol Flow Diagrams

## MCP Server Initialization and Client Connection

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant CI as ClientIntegrationManager
    participant SEC as SecurityManager
    participant CFG as ConfigManager
    
    Note over S,CFG: Server Startup
    S->>CFG: loadConfiguration()
    CFG->>CFG: merge env, file, and default configs
    CFG-->>S: configuration loaded
    
    S->>SEC: initializeSecurity()
    SEC->>SEC: setup audit logging
    SEC->>SEC: create secure environment
    SEC-->>S: security initialized
    
    S->>CI: initializeClientIntegration()
    CI->>CI: prepare client adapters
    CI-->>S: client integration ready
    
    Note over C,S: Client Connection
    C->>S: stdio connection
    S->>S: setup stdio transport
    S->>CI: detectClient(connection)
    CI->>CI: analyze client characteristics
    CI-->>S: client profile created
    
    S->>S: register tools and resources
    S-->>C: server ready
    
    Note over C,CFG: MCP handshake complete
```

## Tool Discovery and Registration Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TR as ToolRegistry
    participant FT as FinancialTools
    participant UT as UnifiedTools
    
    C->>S: tools/list request
    S->>TR: getAvailableTools()
    
    TR->>FT: registerFinancialTools()
    FT->>FT: register organization tools
    FT->>FT: register ledger tools  
    FT->>FT: register account tools
    FT->>FT: register transaction tools
    FT->>FT: register balance tools
    FT->>FT: register asset tools
    FT->>FT: register portfolio tools
    FT->>FT: register segment tools
    FT->>FT: register SDK tools
    FT-->>TR: 18 financial tools registered
    
    TR->>UT: registerUnifiedTools()
    UT->>UT: register docs-unified (13 operations)
    UT->>UT: register learn-unified (4 operations) 
    UT-->>TR: 2 unified tools registered
    
    TR-->>S: 21 tools available
    S-->>C: tools list (21 tools)
    
    Note over C,UT: Complete tool registry exposed
```

## Resource Discovery Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant CI as ClientIntegrationManager
    
    C->>S: resources/list request
    S->>CI: checkClientCapabilities()
    CI->>CI: analyze client resource support
    
    alt Client supports resources
        CI-->>S: resources enabled
        S-->>C: empty resource list (resources disabled by design)
        Note over C,S: Resources intentionally disabled for tool-based approach
    else Client limited capabilities
        CI-->>S: resources not supported
        S-->>C: resource capability not available
        Note over C,S: Client directed to tool-based interface
    end
```

## Tool Invocation Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant CI as ClientIntegrationManager
    participant TH as ToolHandler
    participant V as Validator
    participant AL as AuditLogger
    
    C->>S: tools/call request (tool_name, arguments)
    S->>CI: adaptRequest(request)
    CI->>CI: analyze client capabilities
    CI->>CI: modify parameters if needed
    CI-->>S: adapted request
    
    S->>TH: invokeool(tool_name, args)
    TH->>AL: logToolInvocation(tool_name, args)
    AL->>AL: write audit log entry
    
    TH->>V: validateArgs(args, schema)
    V->>V: check parameter types
    V->>V: validate business rules
    V->>V: detect injection patterns
    
    alt Validation successful
        V-->>TH: args validated
        TH->>TH: execute tool logic
        TH-->>S: tool result
        S->>CI: adaptResponse(result)
        CI->>CI: format for client
        CI-->>S: adapted response
        S-->>C: tool response
    else Validation failed
        V-->>TH: validation error
        TH->>AL: logError(validation_error)
        TH-->>S: error response (-32602 Invalid Params)
        S-->>C: JSON-RPC error
    end
    
    Note over C,AL: Complete tool execution with security
```

## MCP Protocol Error Handling

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant EH as ErrorHandler
    participant AL as AuditLogger
    
    C->>S: malformed JSON-RPC request
    S->>EH: handleProtocolError()
    
    EH->>EH: identify error type
    EH->>AL: logProtocolError()
    
    alt Parse Error
        EH-->>S: error code -32700
        S-->>C: {"error": {"code": -32700, "message": "Parse error"}}
    else Invalid Request
        EH-->>S: error code -32600
        S-->>C: {"error": {"code": -32600, "message": "Invalid Request"}}
    else Method Not Found
        EH-->>S: error code -32601
        S-->>C: {"error": {"code": -32601, "message": "Method not found"}}
    else Invalid Params
        EH-->>S: error code -32602
        S-->>C: {"error": {"code": -32602, "message": "Invalid params"}}
    else Internal Error
        EH-->>S: error code -32603
        S-->>C: {"error": {"code": -32603, "message": "Internal error"}}
    end
    
    Note over C,AL: JSON-RPC 2.0 compliant error handling
```

## Prompt System Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant PS as PromptSystem
    participant CI as ClientIntegrationManager
    
    C->>S: prompts/list request
    S->>PS: getAvailablePrompts()
    
    PS->>PS: prepare discovery prompts
    PS->>PS: create help-me-start prompt
    PS->>PS: create help-with-api prompt  
    PS->>PS: create help-me-learn prompt
    PS-->>S: 3 discovery prompts
    
    S->>CI: adaptPrompts(prompts)
    CI->>CI: filter based on client capabilities
    CI-->>S: client-appropriate prompts
    S-->>C: prompts list
    
    Note over C,S: Later: Prompt execution
    C->>S: prompts/get request (prompt_name, arguments)
    S->>PS: executePrompt(prompt_name, args)
    PS->>PS: generate contextual guidance
    PS-->>S: prompt response with tool suggestions
    S-->>C: guidance with recommended tools
    
    Note over C,PS: Tool discovery through prompts
```

## Session Management Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant SM as SessionManager
    participant AL as AuditLogger
    participant RL as RateLimiter
    
    Note over C,SM: Session Initialization
    C->>S: first request
    S->>SM: createSession(client_id)
    SM->>SM: generate session identifier
    SM->>RL: initializeRateLimit(session_id)
    SM->>AL: logSessionStart(session_id)
    SM-->>S: session created
    
    Note over C,SM: Request Processing
    C->>S: tool request
    S->>RL: checkRateLimit(session_id)
    RL->>RL: validate request frequency
    
    alt Rate limit OK
        RL-->>S: request allowed
        S->>S: process request normally
        S-->>C: response
    else Rate limit exceeded
        RL-->>S: rate limit exceeded
        S->>AL: logRateLimitViolation(session_id)
        S-->>C: error 429 Too Many Requests
    end
    
    Note over C,SM: Session Cleanup
    C->>S: connection closed
    S->>SM: cleanupSession(session_id)
    SM->>AL: logSessionEnd(session_id)
    SM->>RL: releaseRateLimit(session_id)
    SM-->>S: session cleaned up
    
    Note over C,AL: Complete session lifecycle
```