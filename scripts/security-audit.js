#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script for Lerian MCP Server
 * Implements automated security scanning, dependency updates, and monitoring
 * 
 * @since 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import crypto from 'crypto';

// Configuration
const CONFIG = {
    auditLevel: process.env.SECURITY_AUDIT_LEVEL || 'standard', // basic, standard, comprehensive
    webhookUrl: process.env.SECURITY_AUDIT_WEBHOOK_URL,
    enableNotifications: process.env.SECURITY_SCAN_ENABLED === 'true',
    outputDir: './security-reports',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

class SecurityAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            vulnerabilities: [],
            warnings: [],
            recommendations: [],
            score: 100,
            passed: true
        };

        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }
    }

    async runFullAudit() {
        console.log('🔒 Starting Comprehensive Security Audit...\n');

        try {
            await this.checkDependencyVulnerabilities();
            await this.auditEnvironmentVariables();
            await this.checkFilePermissions();
            await this.scanCodeForSecurityIssues();
            await this.checkGitSecrets();
            await this.validateSecurityConfiguration();

            if (CONFIG.auditLevel === 'comprehensive') {
                await this.runAdvancedScans();
            }

            this.generateReport();
            await this.sendNotifications();

        } catch (error) {
            console.error('❌ Security audit failed:', error.message);
            this.results.passed = false;
            this.results.vulnerabilities.push({
                type: 'AUDIT_FAILURE',
                severity: 'HIGH',
                message: `Security audit failed: ${error.message}`
            });
        }

        return this.results;
    }

    async checkDependencyVulnerabilities() {
        console.log('📦 Checking dependency vulnerabilities...');

        try {
            // Run npm audit
            const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
            const auditData = JSON.parse(auditOutput);

            if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
                for (const [pkg, vuln] of Object.entries(auditData.vulnerabilities)) {
                    this.results.vulnerabilities.push({
                        type: 'DEPENDENCY_VULNERABILITY',
                        severity: vuln.severity?.toUpperCase() || 'UNKNOWN',
                        package: pkg,
                        message: `${pkg}: ${vuln.title || 'Vulnerability found'}`,
                        via: vuln.via,
                        fixAvailable: vuln.fixAvailable
                    });
                }
                this.results.score -= Math.min(30, Object.keys(auditData.vulnerabilities).length * 5);
            }

            console.log(`   ✅ Found ${Object.keys(auditData.vulnerabilities || {}).length} dependency vulnerabilities`);

        } catch (error) {
            if (error.status === 1) {
                // npm audit returns exit code 1 when vulnerabilities are found
                console.log('   ⚠️  Vulnerabilities found in dependencies');
            } else {
                console.log('   ❌ Failed to run npm audit:', error.message);
            }
        }
    }

    async auditEnvironmentVariables() {
        console.log('🔐 Auditing environment variables...');

        const sensitivePatterns = [
            /password/i,
            /secret/i,
            /token/i,
            /key/i,
            /credential/i,
            /auth/i
        ];

        // Check .env files
        const envFiles = ['.env', '.env.local', '.env.production'];

        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                const content = fs.readFileSync(envFile, 'utf8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                    if (line.trim() && !line.startsWith('#')) {
                        const [key, value] = line.split('=');

                        if (value && sensitivePatterns.some(pattern => pattern.test(key))) {
                            // Check for weak values
                            if (value.includes('your_') || value.includes('change_me') || value.length < 16) {
                                this.results.warnings.push({
                                    type: 'WEAK_ENV_VALUE',
                                    file: envFile,
                                    line: index + 1,
                                    message: `Weak or placeholder value for sensitive variable: ${key}`
                                });
                                this.results.score -= 5;
                            }
                        }
                    }
                });
            }
        }

        // Check for missing critical environment variables
        const criticalVars = ['CACHE_ENCRYPTION_KEY'];
        for (const varName of criticalVars) {
            if (!process.env[varName]) {
                this.results.warnings.push({
                    type: 'MISSING_ENV_VAR',
                    message: `Critical environment variable missing: ${varName}`
                });
                this.results.score -= 10;
            }
        }

        console.log('   ✅ Environment variables audited');
    }

    async checkFilePermissions() {
        console.log('📁 Checking file permissions...');

        const sensitiveFiles = [
            '.env',
            '.env.local',
            '.env.production',
            'package.json',
            'package-lock.json'
        ];

        for (const file of sensitiveFiles) {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const mode = stats.mode & parseInt('777', 8);

                // Check if file is world-readable
                if (mode & parseInt('004', 8)) {
                    this.results.warnings.push({
                        type: 'INSECURE_FILE_PERMISSIONS',
                        file,
                        message: `File ${file} is world-readable (permissions: ${mode.toString(8)})`
                    });
                    this.results.score -= 5;
                }
            }
        }

        console.log('   ✅ File permissions checked');
    }

    async scanCodeForSecurityIssues() {
        console.log('🔍 Scanning code for security issues...');

        // Basic security pattern detection
        const securityPatterns = [
            {
                pattern: /console\.log.*(?:password|secret|token)(?!\s*:|.*mask)/i,
                message: 'Potential credential logging detected',
                severity: 'HIGH'
            },
            {
                pattern: /console\.log.*(?:apikey|api_key|authkey|auth_key|secretkey|secret_key)\s*[:=](?!.*maskSensitiveData)/i,
                message: 'Potential credential logging detected',
                severity: 'HIGH'
            },
            {
                pattern: /console\.log.*API\s+Key.*\$\{(?!.*maskSensitiveData)/i,
                message: 'Potential credential logging detected',
                severity: 'HIGH'
            },
            {
                pattern: /eval\s*\(/,
                message: 'Use of eval() detected - potential code injection risk',
                severity: 'HIGH'
            },
            {
                pattern: /exec\s*\(/,
                message: 'Use of exec() detected - potential command injection risk',
                severity: 'MEDIUM'
            },
            {
                pattern: /innerHTML\s*=/,
                message: 'Use of innerHTML detected - potential XSS risk',
                severity: 'MEDIUM'
            },
            {
                pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]*['"]/,
                message: 'Hardcoded fallback for environment variable',
                severity: 'LOW'
            }
        ];

        const scanDirectory = (dir) => {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(file)) {
                    scanDirectory(filePath);
                } else if (file.endsWith('.js') || file.endsWith('.ts')) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');

                    lines.forEach((line, index) => {
                        for (const { pattern, message, severity } of securityPatterns) {
                            if (pattern.test(line)) {
                                this.results.vulnerabilities.push({
                                    type: 'CODE_SECURITY_ISSUE',
                                    severity,
                                    file: filePath,
                                    line: index + 1,
                                    message,
                                    code: line.trim()
                                });

                                if (severity === 'HIGH') this.results.score -= 15;
                                else if (severity === 'MEDIUM') this.results.score -= 10;
                                else this.results.score -= 5;
                            }
                        }
                    });
                }
            }
        };

        scanDirectory('./src');
        console.log('   ✅ Code security scan completed');
    }

    async checkGitSecrets() {
        console.log('🔑 Checking for secrets in git history...');

        try {
            // Check recent commits for potential secrets
            const gitLog = execSync('git log --oneline -10', { encoding: 'utf8' });
            const secretPatterns = [
                /(?:password|passwd|pwd)[\s]*[:=][\s]*[^\s]+/i,
                /(?:secret|token|key)[\s]*[:=][\s]*[^\s]+/i,
                /[a-zA-Z0-9]{32,}/  // Long strings that might be tokens
            ];

            // This is a basic check - in production, use tools like git-secrets or truffleHog
            if (secretPatterns.some(pattern => pattern.test(gitLog))) {
                this.results.warnings.push({
                    type: 'POTENTIAL_GIT_SECRETS',
                    message: 'Potential secrets detected in recent git commits'
                });
                this.results.score -= 10;
            }

            console.log('   ✅ Git secrets check completed');

        } catch (error) {
            console.log('   ⚠️  Could not check git history:', error.message);
        }
    }

    async validateSecurityConfiguration() {
        console.log('⚙️  Validating security configuration...');

        // Check if security utilities are being used
        const securityUtilsPath = './src/util/security-utils.js';
        if (!fs.existsSync(securityUtilsPath)) {
            this.results.warnings.push({
                type: 'MISSING_SECURITY_UTILS',
                message: 'Security utilities module not found'
            });
            this.results.score -= 15;
        }

        // Check package.json for security-related scripts
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const securityScripts = ['audit', 'security-check', 'security-audit'];

        if (!securityScripts.some(script => packageJson.scripts?.[script])) {
            this.results.recommendations.push({
                type: 'MISSING_SECURITY_SCRIPTS',
                message: 'Consider adding security audit scripts to package.json'
            });
        }

        console.log('   ✅ Security configuration validated');
    }

    async runAdvancedScans() {
        console.log('🚀 Running advanced security scans...');

        // Try to run semgrep if available
        try {
            execSync('which semgrep', { stdio: 'ignore' });
            console.log('   🔍 Running Semgrep scan...');

            const semgrepOutput = execSync('semgrep --config=auto --json .', {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const semgrepResults = JSON.parse(semgrepOutput);
            if (semgrepResults.results && semgrepResults.results.length > 0) {
                semgrepResults.results.forEach(result => {
                    this.results.vulnerabilities.push({
                        type: 'SEMGREP_FINDING',
                        severity: result.extra?.severity?.toUpperCase() || 'MEDIUM',
                        file: result.path,
                        line: result.start?.line,
                        message: result.extra?.message || result.check_id,
                        rule: result.check_id
                    });
                });
            }

        } catch (error) {
            console.log('   ⚠️  Semgrep not available, skipping advanced scan');
            this.results.recommendations.push({
                type: 'INSTALL_SEMGREP',
                message: 'Consider installing Semgrep for advanced security scanning: pip install semgrep'
            });
        }
    }

    generateReport() {
        console.log('\n📊 Generating Security Report...');

        const report = {
            ...this.results,
            summary: {
                totalVulnerabilities: this.results.vulnerabilities.length,
                totalWarnings: this.results.warnings.length,
                totalRecommendations: this.results.recommendations.length,
                securityScore: Math.max(0, this.results.score),
                riskLevel: this.getRiskLevel()
            }
        };

        // Save detailed report
        const reportPath = path.join(CONFIG.outputDir, `security-audit-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generate human-readable summary
        this.printSummary(report);

        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    getRiskLevel() {
        const score = this.results.score;
        if (score >= 90) return 'LOW';
        if (score >= 70) return 'MEDIUM';
        if (score >= 50) return 'HIGH';
        return 'CRITICAL';
    }

    printSummary(report) {
        console.log('\n' + '='.repeat(60));
        console.log('🔒 SECURITY AUDIT SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 Security Score: ${report.summary.securityScore}/100`);
        console.log(`⚠️  Risk Level: ${report.summary.riskLevel}`);
        console.log(`🚨 Vulnerabilities: ${report.summary.totalVulnerabilities}`);
        console.log(`⚠️  Warnings: ${report.summary.totalWarnings}`);
        console.log(`💡 Recommendations: ${report.summary.totalRecommendations}`);

        if (report.vulnerabilities.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            report.vulnerabilities
                .filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL')
                .forEach(v => {
                    console.log(`   • ${v.message} (${v.file}:${v.line || '?'})`);
                });
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.slice(0, 5).forEach(r => {
                console.log(`   • ${r.message}`);
            });
        }

        console.log('='.repeat(60));
    }

    async sendNotifications() {
        if (!CONFIG.enableNotifications || !CONFIG.webhookUrl) {
            return;
        }

        console.log('📢 Sending security notifications...');

        const payload = {
            timestamp: this.results.timestamp,
            score: Math.max(0, this.results.score),
            riskLevel: this.getRiskLevel(),
            vulnerabilities: this.results.vulnerabilities.length,
            warnings: this.results.warnings.length,
            criticalIssues: this.results.vulnerabilities.filter(v =>
                v.severity === 'HIGH' || v.severity === 'CRITICAL'
            ).length
        };

        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('   ✅ Notifications sent successfully');
            } else {
                console.log('   ❌ Failed to send notifications:', response.statusText);
            }
        } catch (error) {
            console.log('   ❌ Failed to send notifications:', error.message);
        }
    }

    // Cleanup old reports
    static cleanupOldReports() {
        if (!fs.existsSync(CONFIG.outputDir)) return;

        const files = fs.readdirSync(CONFIG.outputDir);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(CONFIG.outputDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > CONFIG.maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Cleaned up old report: ${file}`);
            }
        });
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const auditor = new SecurityAuditor();

    // Cleanup old reports first
    SecurityAuditor.cleanupOldReports();

    // Run the audit
    auditor.runFullAudit()
        .then(results => {
            process.exit(results.passed ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Security audit failed:', error);
            process.exit(1);
        });
}

export default SecurityAuditor; 