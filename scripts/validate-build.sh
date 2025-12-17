#!/bin/bash
# Build Validation Script
# Tests that the TypeScript build process works correctly

# Disabled: set -e  # Exit on any error - handled manually instead

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_test() {
  echo -e "\n${YELLOW}TEST: $1${NC}"
}

print_pass() {
  echo -e "${GREEN}✓ PASS: $1${NC}"
  ((TESTS_PASSED++))
}

print_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  ((TESTS_FAILED++))
}

print_summary() {
  echo -e "\n${YELLOW}======================================${NC}"
  echo -e "${YELLOW}TEST SUMMARY${NC}"
  echo -e "${YELLOW}======================================${NC}"
  echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
  echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
  else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
  fi
}

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  rm -rf dist
}

# Register cleanup on script exit
trap cleanup EXIT

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}Build Validation Test Suite${NC}"
echo -e "${YELLOW}======================================${NC}"

# Test 1: Check tsconfig.server.json exists
print_test "Check tsconfig.server.json exists"
if [ -f "tsconfig.server.json" ]; then
  print_pass "tsconfig.server.json found"
else
  print_fail "tsconfig.server.json not found"
fi

# Test 2: Check tsconfig.server.json excludes tests
print_test "Check tsconfig.server.json excludes test files"
if grep -q 'src/__tests__' tsconfig.server.json; then
  print_pass "Test files are excluded in tsconfig.server.json"
else
  print_fail "Test files are NOT excluded in tsconfig.server.json"
fi

# Test 3: Check tsconfig.server.json excludes frontend
print_test "Check tsconfig.server.json excludes frontend files"
if grep -q 'src/frontend' tsconfig.server.json; then
  print_pass "Frontend files are excluded in tsconfig.server.json"
else
  print_fail "Frontend files are NOT excluded in tsconfig.server.json"
fi

# Test 4: Check build script uses correct tsconfig
print_test "Check package.json build script uses tsconfig.server.json"
if grep -q 'tsc --project tsconfig.server.json' package.json; then
  print_pass "Build script uses tsconfig.server.json"
else
  print_fail "Build script does NOT use tsconfig.server.json"
fi

# Test 5: Run TypeScript build
print_test "Run TypeScript build (npm run build)"
if npm run build > /tmp/build-output.log 2>&1; then
  print_pass "TypeScript build succeeded"
else
  print_fail "TypeScript build failed"
  echo "Build output:"
  cat /tmp/build-output.log
fi

# Test 6: Check dist directory was created
print_test "Check dist directory was created"
if [ -d "dist" ]; then
  print_pass "dist directory exists"
else
  print_fail "dist directory was not created"
fi

# Test 7: Check test files are NOT in dist
print_test "Check test files are excluded from dist"
if [ -d "dist/__tests__" ]; then
  print_fail "Test files found in dist directory (should be excluded)"
else
  print_pass "Test files correctly excluded from dist"
fi

# Test 8: Check frontend files are NOT in dist
print_test "Check frontend files are excluded from dist"
if [ -d "dist/frontend" ]; then
  print_fail "Frontend files found in dist directory (should be excluded)"
else
  print_pass "Frontend files correctly excluded from dist"
fi

# Test 9: Check main backend files ARE in dist
print_test "Check main backend files are included in dist"
EXPECTED_FILES=("dist/index.js" "dist/database/pool.js" "dist/controllers/AuthController.js")
MISSING_FILES=()

for file in "${EXPECTED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  print_pass "All expected backend files are in dist"
else
  print_fail "Missing backend files: ${MISSING_FILES[*]}"
fi

# Test 10: Check auth service type export fix
print_test "Check auth service uses 'export type' for JwtPayload"
if grep -q 'export type' src/services/auth/index.ts; then
  print_pass "JwtPayload correctly exported as type"
else
  print_fail "JwtPayload not correctly exported (should use 'export type')"
fi

# Test 10a: Check Dockerfile uses hardcoded TypeScript command
print_test "Check Dockerfile uses hardcoded tsc command"
if grep -q 'npx tsc --project tsconfig.server.json' Dockerfile; then
  print_pass "Dockerfile uses hardcoded TypeScript command"
else
  print_fail "Dockerfile should use 'npx tsc --project tsconfig.server.json'"
fi

# Test 11: Check no TypeScript errors in backend source
print_test "Check for TypeScript errors in backend source (verbose)"
if npx tsc --project tsconfig.server.json --noEmit > /tmp/tsc-check.log 2>&1; then
  print_pass "No TypeScript errors in backend source"
else
  print_fail "TypeScript errors found in backend source"
  echo "TypeScript errors:"
  cat /tmp/tsc-check.log
fi

# Print summary
print_summary
