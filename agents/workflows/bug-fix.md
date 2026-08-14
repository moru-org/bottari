# Workflow: Bug Fix

## Purpose
Systematic approach to debugging and fixing issues.

## Steps

### 1. Reproduce
- Understand the exact steps to reproduce
- Check if it's a frontend, backend, or infra issue

### 2. Locate Source
- Search for relevant error messages or patterns
- Check the layer that handles the feature in question
- Look at recent git changes if regression

### 3. Fix
- Make minimal changes
- Follow security model (no bypassing checks)
- Add defensive code (null checks, validation)

### 4. Test
- `pnpm test` — run all tests
- `pnpm lint` — check code quality
- Manual verification in dev server

### 5. Verify No Regression
- Check related features still work
- Ensure no new warnings or errors
