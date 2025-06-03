# Financial Workflow Diagrams

## Complete Financial Entity Creation Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant API as Midaz API
    participant DB as Database
    
    Note over C,DB: Create Organization
    C->>S: create-organization tool
    S->>TH: createOrganization(data)
    TH->>API: POST /organizations
    API->>DB: INSERT organization
    DB-->>API: organization created
    API-->>TH: {id: "org-123", ...}
    TH-->>S: organization response
    S-->>C: organization created
    
    Note over C,DB: Create Ledger in Organization
    C->>S: create-ledger (organization_id: "org-123")
    S->>TH: createLedger("org-123", data)
    TH->>API: POST /organizations/org-123/ledgers
    API->>DB: INSERT ledger
    DB-->>API: ledger created
    API-->>TH: {id: "ledger-456", ...}
    TH-->>S: ledger response
    S-->>C: ledger created
    
    Note over C,DB: Create Account in Ledger
    C->>S: create-account (org_id: "org-123", ledger_id: "ledger-456")
    S->>TH: createAccount("org-123", "ledger-456", data)
    TH->>API: POST /organizations/org-123/ledgers/ledger-456/accounts
    API->>DB: INSERT account
    DB-->>API: account created
    API-->>TH: {id: "acc-789", balance: 0, ...}
    TH-->>S: account response
    S-->>C: account ready for transactions
```

## Double-Entry Transaction Processing

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant TS as Transaction Service
    participant DB as Database
    participant AS as Account Service
    
    Note over C,AS: Transfer Between Accounts
    C->>S: create-transaction (debit: "acc-1", credit: "acc-2", amount: 100)
    S->>TH: createTransaction(transferData)
    TH->>TS: POST /transactions
    
    TS->>AS: validateAccounts([acc-1, acc-2])
    AS->>DB: SELECT accounts WHERE id IN (acc-1, acc-2)
    DB-->>AS: account details
    AS-->>TS: accounts valid
    
    TS->>DB: BEGIN TRANSACTION
    
    par Double-Entry Operations
        TS->>DB: INSERT operation (debit, acc-1, 100)
    and
        TS->>DB: INSERT operation (credit, acc-2, 100)
    end
    
    TS->>DB: UPDATE account SET balance = balance - 100 WHERE id = acc-1
    TS->>DB: UPDATE account SET balance = balance + 100 WHERE id = acc-2
    
    alt All Operations Successful
        TS->>DB: COMMIT
        TS-->>TH: transaction completed
        TH-->>S: {id: "tx-123", status: "completed"}
        S-->>C: transfer successful
    else Any Operation Failed
        TS->>DB: ROLLBACK
        TS-->>TH: transaction failed
        TH-->>S: transaction error
        S-->>C: transfer failed
    end
```

## Balance Inquiry and Calculation

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant BS as Balance Service
    participant OS as Operation Service
    participant CS as Cache Service
    participant DB as Database
    
    C->>S: get-balance (account_id: "acc-123")
    S->>TH: getBalance("acc-123")
    TH->>BS: calculateBalance("acc-123")
    
    BS->>CS: checkBalanceCache("acc-123")
    CS-->>BS: cache miss
    
    BS->>OS: getAccountOperations("acc-123")
    OS->>DB: SELECT operations WHERE account_id = "acc-123"
    DB-->>OS: operation history
    OS-->>BS: operations list
    
    BS->>BS: calculateRunningBalance()
    loop For each operation
        BS->>BS: apply debit/credit to balance
    end
    
    BS->>CS: cacheBalance("acc-123", calculatedBalance)
    CS-->>BS: balance cached
    
    BS-->>TH: {balance: 1500.00, currency: "USD", asOf: "2024-01-01T10:00:00Z"}
    TH-->>S: balance response
    S-->>C: current balance
    
    Note over C,DB: Real-time balance calculation with caching
```

## Portfolio Management Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant PS as Portfolio Service
    participant AS as Account Service
    participant DB as Database
    
    Note over C,DB: Create Portfolio
    C->>S: create-portfolio (name: "Investment Portfolio")
    S->>TH: createPortfolio(data)
    TH->>PS: POST /portfolios
    PS->>DB: INSERT portfolio
    DB-->>PS: portfolio created
    PS-->>TH: {id: "port-456", ...}
    TH-->>S: portfolio response
    S-->>C: portfolio created
    
    Note over C,DB: Add Accounts to Portfolio
    C->>S: add-account-to-portfolio (portfolio_id: "port-456", account_id: "acc-789")
    S->>TH: addAccountToPortfolio("port-456", "acc-789")
    TH->>PS: POST /portfolios/port-456/accounts
    
    PS->>AS: validateAccount("acc-789")
    AS->>DB: SELECT account WHERE id = "acc-789"
    DB-->>AS: account exists
    AS-->>PS: account valid
    
    PS->>DB: INSERT portfolio_account (portfolio_id, account_id)
    DB-->>PS: relationship created
    PS-->>TH: account added to portfolio
    TH-->>S: success response
    S-->>C: account added
    
    Note over C,DB: Get Portfolio Summary
    C->>S: get-portfolio (id: "port-456")
    S->>TH: getPortfolio("port-456")
    TH->>PS: GET /portfolios/port-456
    PS->>DB: SELECT portfolio with accounts and balances
    DB-->>PS: portfolio summary
    PS-->>TH: {accounts: [...], totalValue: 5000.00}
    TH-->>S: portfolio details
    S-->>C: portfolio summary
```

## Asset Rate and Conversion Flow

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant ARS as Asset Rate Service
    participant ES as External Service
    participant CS as Cache Service
    participant DB as Database
    
    C->>S: get-asset-rate (from: "USD", to: "EUR")
    S->>TH: getAssetRate("USD", "EUR")
    TH->>ARS: fetchExchangeRate("USD", "EUR")
    
    ARS->>CS: checkRateCache("USD", "EUR")
    
    alt Cache Hit (rate < 5 minutes old)
        CS-->>ARS: cached rate: 0.85
        ARS-->>TH: {rate: 0.85, cached: true}
    else Cache Miss or Expired
        CS-->>ARS: cache miss
        
        ARS->>ES: GET /rates?from=USD&to=EUR
        ES-->>ARS: {rate: 0.86, timestamp: "..."}
        
        ARS->>DB: INSERT asset_rate (from, to, rate, timestamp)
        ARS->>CS: cacheRate("USD", "EUR", 0.86)
        
        ARS-->>TH: {rate: 0.86, cached: false}
    end
    
    TH-->>S: exchange rate response
    S-->>C: current USD/EUR rate
    
    Note over C,DB: Multi-currency conversion with caching
```

## Financial Reporting and Analytics

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant RS as Reporting Service
    participant AS as Analytics Service
    participant DB as Database
    participant CS as Cache Service
    
    C->>S: generate-financial-report (account_id: "acc-123", period: "monthly")
    S->>TH: generateReport("acc-123", "monthly")
    TH->>RS: createFinancialReport("acc-123", "monthly")
    
    RS->>CS: checkReportCache("acc-123", "monthly")
    CS-->>RS: cache miss
    
    RS->>DB: SELECT transactions WHERE account_id = "acc-123" AND date >= start_date
    DB-->>RS: transaction history
    
    RS->>AS: calculateMetrics(transactions)
    AS->>AS: compute total debits
    AS->>AS: compute total credits
    AS->>AS: compute net change
    AS->>AS: compute average transaction size
    AS-->>RS: calculated metrics
    
    RS->>RS: formatReport(metrics)
    RS->>CS: cacheReport("acc-123", "monthly", report)
    
    RS-->>TH: {
        period: "monthly",
        totalDebits: 5000.00,
        totalCredits: 3000.00,
        netChange: -2000.00,
        transactionCount: 45,
        averageAmount: 177.78
    }
    TH-->>S: financial report
    S-->>C: comprehensive analytics
```

## Segment-Based Account Organization

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as McpServer
    participant TH as ToolHandler
    participant SS as Segment Service
    participant AS as Account Service
    participant DB as Database
    
    Note over C,DB: Create Business Segment
    C->>S: create-segment (name: "Retail Banking", criteria: {...})
    S->>TH: createSegment(segmentData)
    TH->>SS: POST /segments
    SS->>DB: INSERT segment
    DB-->>SS: segment created
    SS-->>TH: {id: "seg-789", ...}
    TH-->>S: segment response
    S-->>C: segment created
    
    Note over C,DB: Assign Accounts to Segment
    C->>S: assign-accounts-to-segment (segment_id: "seg-789", account_ids: ["acc-1", "acc-2"])
    S->>TH: assignAccountsToSegment("seg-789", ["acc-1", "acc-2"])
    TH->>SS: PUT /segments/seg-789/accounts
    
    par Validate Each Account
        SS->>AS: validateAccount("acc-1")
        AS->>DB: SELECT account WHERE id = "acc-1"
        DB-->>AS: account valid
        AS-->>SS: account exists
    and
        SS->>AS: validateAccount("acc-2")
        AS->>DB: SELECT account WHERE id = "acc-2"
        DB-->>AS: account valid
        AS-->>SS: account exists
    end
    
    SS->>DB: UPDATE accounts SET segment_id = "seg-789" WHERE id IN ("acc-1", "acc-2")
    DB-->>SS: accounts assigned
    SS-->>TH: assignment successful
    TH-->>S: accounts assigned to segment
    S-->>C: segment assignment complete
    
    Note over C,DB: Get Segment Analytics
    C->>S: get-segment-summary (id: "seg-789")
    S->>TH: getSegmentSummary("seg-789")
    TH->>SS: GET /segments/seg-789/summary
    SS->>DB: SELECT segment with account balances and metrics
    DB-->>SS: {accountCount: 2, totalBalance: 10000.00, ...}
    SS-->>TH: segment analytics
    TH-->>S: segment summary
    S-->>C: business segment overview
```