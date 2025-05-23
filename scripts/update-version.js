#!/usr/bin/env node

/**
 * Updates the version in source files based on package.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Updating version to ${version}`);

// Update version in index.ts
const indexPath = join(rootDir, 'src', 'index.ts');
let indexContent = readFileSync(indexPath, 'utf8');

// Replace version in McpServer configuration
indexContent = indexContent.replace(
  /version:\s*['"][\d.]+['"]/,
  `version: '${version}'`
);

writeFileSync(indexPath, indexContent);
console.log(`✓ Updated version in ${indexPath}`);

// You can add more files to update here if needed
console.log('Version update complete!');