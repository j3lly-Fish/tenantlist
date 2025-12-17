# Build Validation Script

## Overview

The `validate-build.sh` script tests that the TypeScript build configuration is correctly set up to exclude test files and frontend code from the production build.

## What It Tests

### Configuration Tests (Always Run)
1. ✅ `tsconfig.server.json` exists
2. ✅ Test files (`src/__tests__/**/*`) are excluded in `tsconfig.server.json`
3. ✅ Frontend files (`src/frontend/**/*`) are excluded in `tsconfig.server.json`
4. ✅ Build script in `package.json` uses `tsconfig.server.json`
5. ✅ Auth service correctly exports `JwtPayload` as a type

### Build Tests (Require TypeScript Installation)
6. TypeScript build succeeds (`npm run build`)
7. `dist` directory is created
8. Test files are NOT in `dist` directory
9. Frontend files are NOT in `dist` directory
10. Expected backend files ARE in `dist` directory
11. No TypeScript errors in backend source

## Usage

### Basic Usage (Configuration Tests Only)
```bash
./scripts/validate-build.sh
```

This will run all tests but some may fail if TypeScript isn't installed globally on your host machine. **This is expected and normal.**

### Full Validation (Inside Docker)
To run all tests including build validation:

```bash
# Build and enter the Docker container
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml run --rm api sh

# Inside the container, run the tests
npm run build
ls -la dist/  # Verify dist directory contents
```

### CI/CD Usage
The validation script is designed to be run in CI/CD pipelines where all dependencies are available:

```yaml
# Example GitHub Actions workflow
- name: Validate Build Configuration
  run: |
    npm ci
    ./scripts/validate-build.sh
```

## What Was Fixed

### Problem
The Docker build was failing with 100+ TypeScript errors because:
1. The build script used the default `tsconfig.json` which included test files
2. Test files had TypeScript errors that were acceptable for tests but failed the build
3. Frontend files with JSX were being included in the backend build

### Solution
1. **Updated build script** in `package.json`:
   - Changed from: `"build": "tsc"`
   - Changed to: `"build": "tsc --project tsconfig.server.json"`

2. **Created `tsconfig.server.json`** with proper exclusions:
   ```json
   {
     "exclude": [
       "node_modules",
       "dist",
       "src/frontend/**/*",
       "src/__tests__/**/*"
     ]
   }
   ```

3. **Fixed type re-export** in `src/services/auth/index.ts`:
   - Changed from: `export { JwtService, JwtPayload } from './JwtService';`
   - Changed to:
     ```typescript
     export { JwtService } from './JwtService';
     export type { JwtPayload } from './JwtService';
     ```

## Exit Codes

- **Exit 0**: All tests passed
- **Exit 1**: One or more tests failed

## Example Output

```
======================================
Build Validation Test Suite
======================================

TEST: Check tsconfig.server.json exists
✓ PASS: tsconfig.server.json found

TEST: Check tsconfig.server.json excludes test files
✓ PASS: Test files are excluded in tsconfig.server.json

TEST: Check tsconfig.server.json excludes frontend files
✓ PASS: Frontend files are excluded in tsconfig.server.json

TEST: Check package.json build script uses tsconfig.server.json
✓ PASS: Build script uses tsconfig.server.json

...

======================================
TEST SUMMARY
======================================
Total Tests: 11
Passed: 11
Failed: 0

All tests passed!
```

## Troubleshooting

### "tsc: not found" Errors
This means TypeScript isn't installed globally on your system. This is normal. Either:
1. Install dependencies: `npm install`
2. Run inside Docker where all dependencies are available
3. Focus on the configuration tests (tests 1-5, 10) which will still pass

### Build Tests Fail
If configuration tests pass but build tests fail:
1. Clear Docker cache: `docker compose -f docker-compose.prod.yml build --no-cache api`
2. Ensure `node_modules` is up to date: `npm ci`
3. Check that `dist` directory was removed before running

## Integration

This script can be integrated into:
- Pre-commit hooks
- CI/CD pipelines
- Docker health checks
- Development workflows

## Maintenance

To add new tests:
1. Create a new test function following the existing pattern
2. Use `print_test`, `print_pass`, and `print_fail` for consistent output
3. Update the test count in documentation
4. Test both passing and failing scenarios
