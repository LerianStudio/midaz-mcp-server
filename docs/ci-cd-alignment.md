# CI/CD Pipeline Alignment

This document explains how to run the same commands locally that are executed in the CI/CD pipeline, ensuring consistency between local development and automated builds.

## 🎯 **Problem Solved**

Previously, developers couldn't easily replicate the exact CI/CD pipeline locally, leading to:
- ❌ Surprises when CI/CD failed after local tests passed
- ❌ Different linting/testing behavior between local and CI
- ❌ No easy way to validate changes before pushing

## ✅ **Solution: Aligned Commands**

### **CI/CD Pipeline Commands**
The GitHub Actions pipeline runs these exact commands:

```bash
# 1. Install dependencies (exact versions)
npm ci

# 2. Lint with ESLint
npm run lint

# 3. TypeScript type checking  
npx tsc --noEmit

# 4. Build TypeScript
npm run build

# 5. Run tests
npm test

# 6. Security audit
npm audit --json || true
```

### **Local Equivalent Commands**

#### **Option 1: Individual Commands**
```bash
# Match CI exactly
npm run typecheck          # Same as: npx tsc --noEmit
npm run audit              # Same as: npm audit
npm run ci:lint            # Same as: npm run lint && npm run typecheck
npm run ci:test            # Same as: npm run build && npm test
npm run ci:audit           # Same as: npm audit --json || true

# Complete pipeline
npm run ci:all             # Runs: ci:lint + ci:test + ci:audit
```

#### **Option 2: Makefile Commands**
```bash
# Individual commands
make typecheck             # TypeScript type checking
make audit                 # Security audit
make ci-lint               # Lint + typecheck (like CI)
make ci-test               # Build + test (like CI)
make ci-audit              # Security audit (like CI)

# Complete pipeline
make ci-all                # Run complete CI pipeline locally
```

## 📊 **Command Mapping**

| **CI/CD Step** | **Local npm Command** | **Local Makefile** | **Description** |
|---|---|---|---|
| `npm ci` | `npm run ci:install` | `make ci-install` | Install exact dependency versions |
| `npm run lint` | `npm run lint` | `make lint` | ESLint code analysis |
| `npx tsc --noEmit` | `npm run typecheck` | `make typecheck` | TypeScript type checking |
| `npm run build` | `npm run build` | `make build` | Compile TypeScript to JavaScript |
| `npm test` | `npm test` | `make test` | Run test suite |
| `npm audit --json` | `npm run ci:audit` | `make ci-audit` | Security vulnerability scan |
| **Complete Pipeline** | `npm run ci:all` | `make ci-all` | **All CI steps locally** |

## 🚀 **Recommended Workflow**

### **Before Pushing Code**
```bash
# Quick validation (recommended)
make ci-all

# Or step by step
make ci-lint      # Verify code quality
make ci-test      # Verify functionality  
make ci-audit     # Verify security
```

### **During Development**
```bash
# Fast feedback loop
make lint-fix     # Fix linting issues automatically
make typecheck    # Check types without building
make test         # Run tests without full build
```

### **Before Creating PR**
```bash
# Complete validation (matches CI exactly)
make clean        # Clean previous builds
make ci-all       # Run full CI pipeline
```

## 🔍 **Differences from Standard Commands**

### **Enhanced Commands**
- **`npm run ci:lint`**: Runs both ESLint AND TypeScript checking (like CI)
- **`npm run ci:test`**: Ensures fresh build before testing (like CI)  
- **`npm run ci:audit`**: JSON output with error tolerance (like CI)
- **`npm run ci:all`**: Complete pipeline in correct order (like CI)

### **New Commands Added**
- **`npm run typecheck`**: TypeScript type checking without build
- **`npm run audit`**: Standard security audit
- **`npm run ci:install`**: Uses `npm ci` for exact dependency matching

## 🛡️ **Benefits**

### **Consistency**
- ✅ Same commands locally and in CI/CD
- ✅ Same dependency versions (`npm ci`)
- ✅ Same error detection and reporting

### **Faster Development**
- ✅ Catch issues before pushing to CI/CD
- ✅ Reduce failed builds and pipeline iterations
- ✅ Faster feedback during development

### **Confidence**
- ✅ If `make ci-all` passes locally, CI/CD will pass
- ✅ No surprises from environment differences
- ✅ Reliable builds across all environments

## 📝 **Example Output**

```bash
$ make ci-all
🤖 Running complete CI pipeline locally...

> npm run ci:lint
✅ ESLint: 0 errors
✅ TypeScript: 0 errors

> npm run ci:test  
✅ Build: successful
✅ Tests: all passed

> npm run ci:audit
✅ Security: 0 vulnerabilities

✅ CI/CD cycle complete!
```

## 🔧 **Troubleshooting**

### **If CI passes but local fails:**
```bash
# Ensure exact dependency versions
npm run ci:install  # Use npm ci instead of npm install
```

### **If local passes but CI fails:**
```bash
# Check for environment differences
npm run ci:audit    # Verify no security issues
npm run typecheck   # Verify TypeScript issues
```

### **Performance Issues:**
```bash
# Use individual commands for faster feedback
make lint           # Just linting
make typecheck      # Just type checking
make test          # Just tests
```

---

**💡 Pro Tip:** Run `make ci-all` before every commit to ensure your changes will pass CI/CD validation!