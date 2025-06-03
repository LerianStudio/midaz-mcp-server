# Configuration and Service Discovery Flow Diagrams

## Multi-Source Configuration Loading

```mermaid
sequenceDiagram
    participant S as McpServer
    participant CM as ConfigManager
    participant ENV as Environment
    participant CF as ConfigFile
    participant CLI as CommandLineArgs
    participant DEF as DefaultConfig
    participant VAL as Validator
    
    Note over S,VAL: Server Startup Configuration
    S->>CM: loadConfiguration()
    
    CM->>DEF: loadDefaults()
    DEF-->>CM: base configuration
    
    CM->>CF: loadConfigFiles()
    CF->>CF: search standard locations
    CF->>CF: read midaz-mcp-config.json
    CF->>CF: read .env file
    CF-->>CM: file-based config
    
    CM->>ENV: loadEnvironmentVariables()
    ENV->>ENV: extract MIDAZ_* variables
    ENV->>ENV: filter secure variables
    ENV-->>CM: environment config
    
    CM->>CLI: parseCommandLineArgs()
    CLI->>CLI: parse --option=value pairs
    CLI-->>CM: command line config
    
    CM->>CM: mergeConfigurations()
    CM->>CM: apply precedence rules
    Note over CM: CLI > ENV > Files > Defaults
    
    CM->>VAL: validateConfiguration(mergedConfig)
    VAL->>VAL: check required fields
    VAL->>VAL: validate URL formats
    VAL->>VAL: verify API key format
    VAL->>VAL: check port ranges
    
    alt Validation Successful
        VAL-->>CM: configuration valid
        CM-->>S: configuration loaded
    else Validation Failed
        VAL-->>CM: validation errors
        CM->>CM: log configuration errors
        CM-->>S: startup failed with config errors
    end
```

## Service Discovery and Health Checking

```mermaid
sequenceDiagram
    participant S as McpServer
    participant SD as ServiceDiscovery
    participant HM as HealthMonitor
    participant OS as Onboarding Service
    participant TS as Transaction Service
    participant CM as ConfigManager
    participant L as Logger
    
    S->>SD: discoverServices()
    SD->>CM: getServiceUrls()
    CM-->>SD: {
        onboarding: "http://localhost:3000",
        transaction: "http://localhost:3001"
    }
    
    par Health Check Onboarding Service
        SD->>HM: checkHealth("onboarding")
        HM->>OS: GET /health
        alt Service Available
            OS-->>HM: 200 OK {"status": "healthy"}
            HM->>L: logServiceHealth("onboarding", "healthy")
            HM-->>SD: onboarding service available
        else Service Unavailable
            OS-->>HM: connection refused
            HM->>L: logServiceHealth("onboarding", "unavailable")
            HM-->>SD: onboarding service down
        end
    and Health Check Transaction Service
        SD->>HM: checkHealth("transaction")
        HM->>TS: GET /health
        alt Service Available
            TS-->>HM: 200 OK {"status": "healthy"}
            HM->>L: logServiceHealth("transaction", "healthy")
            HM-->>SD: transaction service available
        else Service Unavailable
            TS-->>HM: connection refused
            HM->>L: logServiceHealth("transaction", "unavailable")
            HM-->>SD: transaction service down
        end
    end
    
    SD->>SD: evaluateServiceAvailability()
    
    alt All Services Available
        SD->>CM: setStubMode(false)
        SD-->>S: services ready, live mode enabled
    else Some Services Down
        SD->>CM: setStubMode(true)
        SD-->>S: fallback to stub mode
    else All Services Down
        SD->>CM: setStubMode(true)
        SD->>L: logCritical("all_services_unavailable")
        SD-->>S: operating in full stub mode
    end
```

## Dynamic Configuration Updates

```mermaid
sequenceDiagram
    participant A as Admin/Client
    participant S as McpServer
    participant CM as ConfigManager
    parameter WM as WatchManager
    participant CF as ConfigFile
    participant VAL as Validator
    participant SR as ServiceRegistry
    
    Note over A,SR: Configuration File Change
    A->>CF: update midaz-mcp-config.json
    CF->>WM: file changed event
    WM->>CM: configurationChanged()
    
    CM->>CM: reloadConfiguration()
    CM->>CF: readUpdatedConfig()
    CF-->>CM: new configuration
    
    CM->>VAL: validateNewConfig(config)
    VAL->>VAL: check configuration validity
    
    alt Configuration Valid
        VAL-->>CM: validation passed
        CM->>CM: applyConfiguration()
        CM->>SR: updateServiceUrls()
        CM-->>S: configuration updated
        S->>S: restart affected components
        S-->>A: configuration applied successfully
    else Configuration Invalid
        VAL-->>CM: validation failed
        CM->>CM: keep current configuration
        CM-->>S: configuration update rejected
        S-->>A: configuration error (kept previous)
    end
    
    Note over A,SR: Environment Variable Change
    A->>ENV: export MIDAZ_API_KEY=new_key
    S->>CM: periodicConfigCheck()
    CM->>ENV: checkEnvironmentChanges()
    ENV-->>CM: API key changed
    CM->>CM: updateApiKeyConfiguration()
    CM->>SR: refreshApiAuthentication()
    SR-->>CM: authentication updated
    CM-->>S: live configuration update applied
```

## Secure Configuration Management

```mermaid
sequenceDiagram
    participant S as McpServer
    participant CM as ConfigManager
    participant SM as SecurityManager
    participant FS as FileSystem
    participant ENV as Environment
    participant KM as KeyManager
    participant AL as AuditLogger
    
    Note over S,AL: Secure Configuration Loading
    S->>CM: loadSecureConfiguration()
    CM->>SM: initializeSecurityContext()
    SM->>SM: setup secure environment
    SM-->>CM: security context ready
    
    CM->>FS: readConfigFile(secure_mode=true)
    FS->>FS: check file permissions (600/400)
    FS->>FS: verify file ownership
    FS->>FS: detect symlink attacks
    
    alt File Security OK
        FS-->>CM: secure file access
        CM->>KM: extractSensitiveData()
        KM->>KM: identify API keys
        KM->>KM: identify passwords
        KM->>KM: identify tokens
        KM->>AL: logSensitiveDataAccess()
        KM-->>CM: sanitized configuration
    else File Security Risk
        FS-->>CM: insecure file detected
        CM->>AL: logSecurityRisk("insecure_config_file")
        CM-->>S: refuse to load insecure configuration
    end
    
    CM->>ENV: secureEnvironmentScan()
    ENV->>ENV: filter environment variables
    ENV->>ENV: remove debugging variables
    ENV->>ENV: mask sensitive values in logs
    ENV-->>CM: secure environment config
    
    CM->>SM: validateSecuritySettings()
    SM->>SM: check authentication requirements
    SM->>SM: validate encryption settings
    SM->>SM: verify audit log permissions
    SM-->>CM: security validation passed
    
    CM-->>S: secure configuration loaded
```

## Auto-Detection and Fallback Configuration

```mermaid
sequenceDiagram
    participant S as McpServer
    participant AD as AutoDetector
    participant NS as NetworkScanner
    participant PS as PortScanner
    participant CM as ConfigManager
    participant FB as FallbackConfig
    participant L as Logger
    
    S->>AD: autoDetectServices()
    AD->>CM: getAutoDetectionSettings()
    CM-->>AD: {
        enableAutoDetection: true,
        scanPorts: [3000, 3001, 8080, 8081],
        scanTimeout: 5000
    }
    
    AD->>NS: scanLocalNetwork()
    NS->>PS: scanPorts([3000, 3001, 8080, 8081])
    
    par Port 3000 Scan
        PS->>PS: connect to localhost:3000
        PS-->>NS: port 3000 open
    and Port 3001 Scan
        PS->>PS: connect to localhost:3001
        PS-->>NS: port 3001 open
    and Port 8080 Scan
        PS->>PS: connect to localhost:8080
        PS-->>NS: port 8080 closed
    and Port 8081 Scan
        PS->>PS: connect to localhost:8081
        PS-->>NS: port 8081 closed
    end
    
    NS-->>AD: discovered services on 3000, 3001
    AD->>AD: detectServiceTypes()
    AD->>AD: test API endpoints
    
    alt Services Detected
        AD->>CM: updateAutoDetectedConfig()
        CM->>L: logServiceDiscovery("auto_detected", [3000, 3001])
        CM-->>S: services auto-configured
    else No Services Found
        AD->>FB: loadFallbackConfiguration()
        FB->>FB: prepare stub mode config
        FB->>L: logFallbackMode("no_services_detected")
        FB-->>AD: fallback configuration
        AD->>CM: setFallbackMode()
        CM-->>S: fallback mode configured
    end
    
    Note over S,L: Continuous monitoring for service changes
    loop Service Monitoring
        AD->>PS: periodicServiceCheck()
        PS-->>AD: service status update
        alt Service Status Changed
            AD->>CM: updateServiceConfiguration()
            CM->>L: logServiceStatusChange()
            CM-->>S: configuration updated dynamically
        end
    end
```

## Configuration Validation and Error Recovery

```mermaid
sequenceDiagram
    participant S as McpServer
    participant CM as ConfigManager
    participant VAL as Validator
    participant ER as ErrorRecovery
    participant BU as BackupConfig
    participant L as Logger
    participant Admin as Administrator
    
    S->>CM: validateCurrentConfiguration()
    CM->>VAL: performFullValidation()
    
    VAL->>VAL: validate URL formats
    VAL->>VAL: check port accessibility
    VAL->>VAL: verify API key validity
    VAL->>VAL: test service connections
    
    alt Validation Error - Invalid URL
        VAL-->>CM: validation failed (invalid_url)
        CM->>ER: handleConfigurationError("invalid_url")
        ER->>BU: loadLastKnownGoodConfig()
        BU-->>ER: backup configuration
        ER->>L: logConfigurationRecovery("invalid_url")
        ER-->>CM: recovered configuration
        CM-->>S: using backup configuration
    else Validation Error - Service Unreachable
        VAL-->>CM: validation failed (service_unreachable)
        CM->>ER: handleConfigurationError("service_unreachable")
        ER->>ER: enable stub mode temporarily
        ER->>L: logServiceFallback("temporary_stub_mode")
        ER-->>CM: fallback configuration
        CM-->>S: temporary fallback mode
    else Validation Error - Authentication Failed
        VAL-->>CM: validation failed (auth_failed)
        CM->>ER: handleConfigurationError("auth_failed")
        ER->>L: logAuthenticationError("invalid_api_key")
        ER->>Admin: notifyConfigurationProblem("authentication")
        ER-->>CM: configuration error logged
        CM-->>S: authentication configuration required
    else Validation Successful
        VAL-->>CM: validation passed
        CM->>BU: saveCurrentAsBackup()
        BU-->>CM: backup saved
        CM-->>S: configuration validated and ready
    end
```