# 🔒 Security Guide - Lerian MCP Server

This document outlines the security features, best practices, and guidelines for the Lerian MCP Server.

## 🛡️ Security Features

### 🔐 **Encryption & Data Protection**
- **AES-256-GCM encryption** for cached sensitive data
- **Secure key derivation** using PBKDF2
- **Credential masking** in logs and console output
- **Input sanitization** against injection attacks

### 🔍 **Security Monitoring**
- **Automated security audits** with vulnerability scanning
- **Dependency vulnerability tracking** with npm audit
- **Code security pattern detection**
- **Git secrets scanning** with TruffleHog
- **File permission monitoring**

### 🚨 **Audit & Logging**
- **Comprehensive audit logging** for all operations
- **Sensitive data redaction** in logs
- **Security event tracking**
- **Rate limiting** protection

## 🚀 **Quick Security Setup**

### 1. **Generate Secure Keys**
```bash
# Generate encryption key
node -e "console.log('CACHE_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. **Set Secure File Permissions**
```bash
# Secure environment file
chmod 600 .env

# Standard permissions for package files
chmod 644 package.json package-lock.json
```

### 3. **Run Security Audit**
```bash
# Standard security audit
npm run security:audit

# Comprehensive audit (requires Semgrep)
npm run security:audit:comprehensive

# Combined security check
npm run security:check
```

## 📋 **Security Checklist**

### ✅ **Environment Variables**
- [ ] Strong `CACHE_ENCRYPTION_KEY` (64 hex characters)
- [ ] Strong `SESSION_SECRET` (64 hex characters)
- [ ] Real API keys (not placeholder values)
- [ ] Secure file permissions (600 for .env)

### ✅ **Dependencies**
- [ ] Regular dependency updates (`npm run security:update`)
- [ ] No known vulnerabilities (`npm audit`)
- [ ] Latest security patches applied

### ✅ **Configuration**
- [ ] Production-ready settings
- [ ] Localhost-only backend URLs (for local development)
- [ ] Audit logging enabled
- [ ] Rate limiting configured

### ✅ **Monitoring**
- [ ] Security audit scheduled (weekly)
- [ ] Webhook notifications configured
- [ ] Log rotation enabled
- [ ] Security reports reviewed

## 🔧 **Security Configuration**

### **Environment Variables**

| Variable                  | Purpose                  | Security Level | Example              |
| ------------------------- | ------------------------ | -------------- | -------------------- |
| `CACHE_ENCRYPTION_KEY`    | Encrypt cached tokens    | **CRITICAL**   | `64-char hex string` |
| `SESSION_SECRET`          | Session security         | **HIGH**       | `64-char hex string` |
| `MIDAZ_API_KEY`           | API authentication       | **HIGH**       | `sk_live_...`        |
| `SECURITY_SCAN_ENABLED`   | Enable security scanning | **MEDIUM**     | `true`               |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limiting            | **MEDIUM**     | `100`                |

### **File Permissions**

| File                | Recommended Permissions | Reason                  |
| ------------------- | ----------------------- | ----------------------- |
| `.env`              | `600` (owner only)      | Contains sensitive data |
| `package.json`      | `644` (world readable)  | Public configuration    |
| `security-reports/` | `700` (owner only)      | Sensitive audit data    |

## 🚨 **Security Incident Response**

### **High-Severity Issues**
1. **Immediate Actions**:
   - Stop the server if actively compromised
   - Rotate all API keys and secrets
   - Review audit logs for suspicious activity

2. **Investigation**:
   - Run comprehensive security audit
   - Check for unauthorized access patterns
   - Verify data integrity

3. **Recovery**:
   - Apply security patches
   - Update all credentials
   - Implement additional monitoring

### **Vulnerability Disclosure**
- Report security issues to: [security@lerianstudio.com]
- Include detailed reproduction steps
- Allow 90 days for responsible disclosure

## 🔍 **Security Audit Details**

### **Automated Checks**
- **Dependency Vulnerabilities**: npm audit integration
- **Code Security Patterns**: Custom pattern detection
- **Environment Security**: Variable validation
- **File Permissions**: Access control verification
- **Git Secrets**: Historical secret scanning

### **Security Scoring**
- **90-100**: LOW risk (excellent security)
- **70-89**: MEDIUM risk (good security)
- **50-69**: HIGH risk (needs attention)
- **0-49**: CRITICAL risk (immediate action required)

### **Manual Security Review**
Consider professional security review for:
- Production deployments
- Handling sensitive financial data
- Compliance requirements (SOC 2, PCI DSS)
- High-value targets

## 🛠️ **Advanced Security Tools**

### **Semgrep Integration**
```bash
# Install Semgrep
pip install semgrep

# Run comprehensive scan
npm run security:audit:comprehensive
```

### **Custom Security Rules**
Add custom security patterns in `scripts/security-audit.js`:
```javascript
const customPatterns = [
  {
    pattern: /your-custom-pattern/i,
    message: 'Custom security issue detected',
    severity: 'HIGH'
  }
];
```

## 📚 **Security Resources**

### **Documentation**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MCP Security Guidelines](https://modelcontextprotocol.io/security)

### **Tools**
- [Semgrep](https://semgrep.dev/) - Static analysis
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Secret scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency scanning

## 🔄 **Security Maintenance**

### **Weekly Tasks**
- [ ] Review security audit reports
- [ ] Check for dependency updates
- [ ] Verify backup integrity
- [ ] Monitor security alerts

### **Monthly Tasks**
- [ ] Rotate encryption keys
- [ ] Review access logs
- [ ] Update security documentation
- [ ] Test incident response procedures

### **Quarterly Tasks**
- [ ] Comprehensive security review
- [ ] Penetration testing (if applicable)
- [ ] Security training updates
- [ ] Compliance audit

---

## 📞 **Support**

For security-related questions or issues:
- **Documentation**: [GitHub Wiki](https://github.com/LerianStudio/lerian-mcp-server/wiki)
- **Issues**: [GitHub Issues](https://github.com/LerianStudio/lerian-mcp-server/issues)
- **Security**: security@lerianstudio.com

**Remember**: Security is an ongoing process, not a one-time setup. Regular monitoring and updates are essential for maintaining a secure system. 