# PageMD Phase 1 Completion Design

**Date:** 2026-04-19
**Status:** Approved
**Type:** Feature Completion

---

## Overview

Complete Phase 1 of PageMD — a webpage-to-markdown API service — by addressing remaining blockers and quality gates.

**Goal:** Not a new feature — completing and hardening existing functionality.

**Success Criteria:**
- All 12 tests passing (unit + integration)
- README.md exists with working examples
- `.gitignore` excludes node_modules and build artifacts
- SSL workaround controlled by `ALLOW_UNSAFE_SSL` flag
- E2E tests pass against deployed API
- v0.1.0 tagged and released

---

## Current State

**Completed:**
- ✅ Core API working and deployed to Vercel
- ✅ CLI tool built
- ✅ 11/12 unit tests passing (1 minor failure)
- ✅ URL validation, content extraction, markdown conversion

**Remaining:**
- ❌ 1 failing test (list format expectation)
- ❌ No `.gitignore` (node_modules tracked)
- ❌ No README.md
- 🔴 SSL security workaround always active
- ❌ No integration tests
- ❌ No E2E tests

---

## Part 1: Phase 1a — Quick Fixes (~15 min)

### 1.1 Fix Failing Test

**Issue:** Test expects `- Item 1` but Turndown outputs `* Item 1` for unordered lists.

**Root Cause:** Turndown's default bullet style is `*` (asterisk), not `-` (hyphen).

**Solution:** Update test assertion in `tests/lib/converter.test.ts`:
```typescript
expect(result).toContain("* Item 1");  // was "- Item 1"
expect(result).toContain("* Item 2");  // was "- Item 2"
```

**Files:** `tests/lib/converter.test.ts`

---

### 1.2 Add `.gitignore`

**Issue:** `node_modules` and build artifacts are tracked in git.

**Solution:** Create `.gitignore` with standard Node.js patterns:
```
# Dependencies
node_modules/

# Build outputs
.next/
dist/
*.tsbuildinfo

# Environment
.env
.env*.local

# IDE
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
```

**Files:** `.gitignore` (create)

---

### 1.3 Create README.md

**Structure:**
- Project description
- Quick start (API + CLI examples)
- Response format
- Development commands
- Configuration (`ALLOW_UNSAFE_SSL`)
- License

**Files:** `README.md` (create)

---

## Part 2: Phase 1b — Security & Quality (~45 min)

### 2.1 SSL Certificate Handling

**Current:** SSL verification always disabled via `NODE_TLS_REJECT_UNAUTHORIZED="0"`.

**New:** Environment-controlled flag with security-by-default.

**Implementation Pattern:**
```typescript
const ALLOW_UNSAFE_SSL = process.env.ALLOW_UNSAFE_SSL === "true";

// Inside fetch block:
if (ALLOW_UNSAFE_SSL) {
  console.warn("[PageMD] WARNING: SSL verification disabled - development only");
  // Apply workaround with try/finally for cleanup
} else {
  // Normal secure fetch (default)
}
```

**Behavior Matrix:**

| Environment | ALLOW_UNSAFE_SSL | Behavior |
|-------------|------------------|----------|
| Vercel Production | (undefined) | Secure ✅ |
| Local Development | (undefined) | Secure ✅ |
| Local Development | "true" | Unsecured with warning ⚠️ |

**Files:** `app/api/convert/route.ts`

---

### 2.2 Integration Tests

**Approach:** Minimal integration tests using Vitest's built-in mocking. No MSW dependency.

**Test Cases:**
1. Returns markdown for valid URL (happy path)
2. Returns 400 for invalid URL (validation)
3. Returns 404 when page not found (fetch error)
4. Returns 408 when request times out (timeout)

**Mocking Strategy:**
- Mock `global.fetch` directly
- Mock Readability/JSDOM/Turndown to return predictable data
- Tests verify request flow, not actual content extraction

**Files:** `tests/api/convert.test.ts` (create)

---

## Part 3: Phase 1c — Verification (~35 min)

### 3.1 E2E Tests

**Approach:** Test against deployed Vercel API with real URLs.

**Test Cases:**
1. Converts a basic URL (example.com)
2. Handles invalid URL with clear error

**URL Selection:**
- Use `example.com` for reliable testing (RFC 2606 reserved)
- Avoid real sites that might change or rate-limit

**Files:** `tests/e2e/convert.test.ts` (create)

---

### 3.2 User Testing Checklist

Before v0.1.0:
```
□ Test with: https://example.com (basic HTML)
□ Test with: https://www.anthropic.com/news (real article)
□ Test with invalid URL → verify 400 error
□ Test CLI tool works
□ Paste markdown into Claude → verify readable
□ Check deployed API responds in <10 seconds
```

---

### 3.3 Release

**Commands:**
```bash
git add .
git commit -m "feat: complete Phase 1 - tests, docs, and security improvements"
git tag v0.1.0
git push origin main --tags
```

**Update:** `package.json` version to `0.1.0`

---

## Implementation Order

| Step | Task | Time |
|------|------|------|
| 1 | Fix failing test | 1 min |
| 2 | Add .gitignore | 2 min |
| 3 | Create README.md | 10 min |
| 4 | Implement SSL environment flag | 15 min |
| 5 | Add integration tests | 30 min |
| 6 | Add E2E tests | 15 min |
| 7 | Run full test suite | 5 min |
| 8 | Manual verification checklist | 10 min |
| 9 | Deploy and verify | 5 min |
| 10 | Tag v0.1.0 | 2 min |
| **Total** | | **~95 min** |

---

## Architecture Notes

### Existing Patterns (Must Follow)

1. **Lazy Loading:** jsdom, Readability, Turndown must be imported inside request handler
2. **Logging:** Use `[PageMD]` prefix for all console output
3. **Error Handling:** Return appropriate HTTP status codes (400, 404, 408, 500)

### File Structure

```
any-page-md/
├── app/api/convert/route.ts    # Main API (modify for SSL flag)
├── tests/
│   ├── lib/                    # Unit tests (modify converter.test.ts)
│   ├── api/                    # Integration tests (create)
│   └── e2e/                    # E2E tests (create)
├── .gitignore                  # Create
├── README.md                   # Create
└── package.json                # Update version
```

---

## Testing Summary

| Level | Status | Action |
|-------|--------|--------|
| Unit | 11/12 passing | Fix 1 test |
| Integration | 0 tests | Add 4 tests |
| E2E | 0 tests | Add 2 tests |

---

## Success Verification

After implementation, verify:

- [ ] All 12 unit tests pass
- [ ] All 4 integration tests pass
- [ ] All 2 E2E tests pass against deployed API
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] Manual checklist completed
- [ ] v0.1.0 tagged
- [ ] Deployed API still works

---

## Next Phase Preview

After v0.1.0:
- **Phase 2:** Browser Extension (Chrome/Firefox)
- **Phase 3:** AI-powered summarization
