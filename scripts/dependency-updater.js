#!/usr/bin/env node

/**
 * Automated Dependency Update Script for Lerian MCP Server
 * Safely updates dependencies with security validation
 * 
 * @since 3.0.0
 */

import fs from 'fs';
import { execSync } from 'child_process';
import semver from 'semver';

class DependencyUpdater {
    constructor() {
        this.packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        this.results = {
            updated: [],
            skipped: [],
            failed: [],
            securityFixes: []
        };
    }

    async updateDependencies() {
        console.log('📦 Starting dependency update process...\n');

        try {
            // First, check for security vulnerabilities
            await this.checkSecurityVulnerabilities();

            // Update dependencies
            await this.updatePackages();

            // Run tests to ensure nothing broke
            await this.runTests();

            // Generate update report
            this.generateReport();

        } catch (error) {
            console.error('❌ Dependency update failed:', error.message);
            throw error;
        }
    }

    async checkSecurityVulnerabilities() {
        console.log('🔍 Checking for security vulnerabilities...');

        try {
            const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
            const auditData = JSON.parse(auditOutput);

            if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
                console.log('⚠️  Security vulnerabilities found, attempting to fix...');

                try {
                    execSync('npm audit fix', { stdio: 'inherit' });
                    this.results.securityFixes.push('Automatic security fixes applied');
                } catch (error) {
                    console.log('❌ Some vulnerabilities require manual intervention');
                }
            } else {
                console.log('✅ No security vulnerabilities found');
            }
        } catch (error) {
            if (error.status === 1) {
                console.log('⚠️  Security vulnerabilities detected');
            }
        }
    }

    async updatePackages() {
        console.log('📦 Updating packages...');

        // Update to latest compatible versions
        try {
            execSync('npm update', { stdio: 'inherit' });
            console.log('✅ Packages updated successfully');
        } catch (error) {
            console.error('❌ Failed to update packages:', error.message);
            throw error;
        }
    }

    async runTests() {
        console.log('🧪 Running tests to verify updates...');

        try {
            execSync('npm test', { stdio: 'inherit' });
            console.log('✅ All tests passed');
        } catch (error) {
            console.error('❌ Tests failed after update');
            throw error;
        }
    }

    generateReport() {
        console.log('\n📊 Dependency Update Report');
        console.log('='.repeat(40));
        console.log(`✅ Security fixes: ${this.results.securityFixes.length}`);
        console.log(`📦 Packages updated: ${this.results.updated.length}`);
        console.log(`⏭️  Packages skipped: ${this.results.skipped.length}`);
        console.log(`❌ Failed updates: ${this.results.failed.length}`);
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const updater = new DependencyUpdater();

    updater.updateDependencies()
        .then(() => {
            console.log('✅ Dependency update completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Dependency update failed:', error);
            process.exit(1);
        });
}

export default DependencyUpdater; 