#!/usr/bin/env node

/**
 * Dual NPM Publish Script
 * Publishes to both @lerianstudio/lerian-mcp-server and @lerianstudio/midaz-mcp-server
 * for backward compatibility
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

const packageJsonPath = 'package.json';
const backupPath = 'package.json.backup';

function log(message) {
    console.log(`🔄 ${message}`);
}

function error(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}

function success(message) {
    console.log(`✅ ${message}`);
}

async function main() {
    try {
        log('Starting dual NPM publish process...');

        // Read current package.json
        const originalPkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const version = originalPkg.version;

        log(`Current version: ${version}`);
        log(`Current package name: ${originalPkg.name}`);

        // Backup original package.json
        copyFileSync(packageJsonPath, backupPath);
        log('Backed up package.json');

        // Build the project
        log('Building project...');
        execSync('npm run build', { stdio: 'inherit' });
        success('Build completed');

        // Publish to new package name (current)
        if (originalPkg.name === '@lerianstudio/lerian-mcp-server') {
            log('Publishing to @lerianstudio/lerian-mcp-server...');
            execSync('npm publish --access public', { stdio: 'inherit' });
            success('Published to @lerianstudio/lerian-mcp-server');

            // Update package.json for legacy package
            log('Preparing legacy package...');
            const legacyPkg = { ...originalPkg };
            legacyPkg.name = '@lerianstudio/midaz-mcp-server';
            legacyPkg.description = 'DEPRECATED: Use @lerianstudio/lerian-mcp-server instead. ' + legacyPkg.description;
            legacyPkg.deprecated = 'This package has been renamed to @lerianstudio/lerian-mcp-server. Please update your dependencies.';

            writeFileSync(packageJsonPath, JSON.stringify(legacyPkg, null, 2));
            log('Updated package.json for legacy package');

            // Publish to legacy package name
            log('Publishing to @lerianstudio/midaz-mcp-server (deprecated)...');
            execSync('npm publish --access public', { stdio: 'inherit' });
            success('Published to @lerianstudio/midaz-mcp-server (deprecated)');

        } else if (originalPkg.name === '@lerianstudio/midaz-mcp-server') {
            // If we're still on the old name, publish to both
            log('Publishing to @lerianstudio/midaz-mcp-server...');
            execSync('npm publish --access public', { stdio: 'inherit' });
            success('Published to @lerianstudio/midaz-mcp-server');

            // Update package.json for new package
            log('Preparing new package...');
            const newPkg = { ...originalPkg };
            newPkg.name = '@lerianstudio/lerian-mcp-server';
            newPkg.description = newPkg.description.replace('DEPRECATED: Use @lerianstudio/lerian-mcp-server instead. ', '');
            delete newPkg.deprecated;

            writeFileSync(packageJsonPath, JSON.stringify(newPkg, null, 2));
            log('Updated package.json for new package');

            // Publish to new package name
            log('Publishing to @lerianstudio/lerian-mcp-server...');
            execSync('npm publish --access public', { stdio: 'inherit' });
            success('Published to @lerianstudio/lerian-mcp-server');
        }

        // Restore original package.json
        copyFileSync(backupPath, packageJsonPath);
        execSync(`rm ${backupPath}`);
        log('Restored original package.json');

        success('Dual publish completed successfully!');

        console.log('\n📦 Published Packages:');
        console.log(`   • @lerianstudio/lerian-mcp-server@${version} (current)`);
        console.log(`   • @lerianstudio/midaz-mcp-server@${version} (deprecated)`);

        console.log('\n🔄 Migration Instructions:');
        console.log('   npm uninstall @lerianstudio/midaz-mcp-server');
        console.log('   npm install @lerianstudio/lerian-mcp-server');

    } catch (err) {
        error(`Dual publish failed: ${err.message}`);
    }
}

main(); 