# PageMD Phase 1 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 1 of PageMD by fixing remaining issues, adding missing infrastructure, and implementing tests with TDD discipline.

**Architecture:** Maintain existing lazy-loading pattern for jsmon dependencies. Add environment-controlled SSL flag. Add minimal integration and E2E tests.

**Tech Stack:** Next.js 15, TypeScript 5.7, Vitest 2.1, @mozilla/readability, jsdom 24, Turndown 7.2

---

## File Structure

**Files to modify:**
- `tests/lib/converter.test.ts` - Fix list format assertion
- `app/api/convert/route.ts` - Add SSL environment flag
- `package.json` - Update version to 0.1.0

**Files to create:**
- `.gitignore` - Standard Node.js ignore patterns
- `README.md` - Project documentation
- `tests/api/convert.test.ts` - Integration tests
- `tests/e2e/convert.test.ts` - E2E tests

---

## Task 1: Fix Failing Converter Test

**Files:**
- Modify: `tests/lib/converter.test.ts:18-19`

- [ ] **Step 1: Update list assertion to match Turndown output**

The test expects `- Item 1` but Turndown outputs `* Item 1` by default. Update the assertions:

```typescript
expect(result).toContain("* Item 1");
expect(result).toContain("* Item 2");
```

Full context of the change in `tests/lib/converter.test.ts`:

```typescript
    it("converts HTML to markdown", () => {
      const html = `
        <h1>Title</h1>
        <p>This is a paragraph with <a href="https://example.com">a link</a>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;

      const result = htmlToMarkdown(html);
      expect(result).toContain("# Title");
      expect(result).toContain("This is a paragraph with [a link](https://example.com).");
      expect(result).toContain("* Item 1");  // CHANGED: was "- Item 1"
      expect(result).toContain("* Item 2");  // CHANGED: was "- Item 2"
    });
```

- [ ] **Step 2: Run the test to verify it passes**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm test tests/lib/converter.test.ts
```

Expected output:
```
✓ tests/lib/converter.test.ts (4 tests)
```

- [ ] **Step 3: Commit the fix**

```bash
git add tests/lib/converter.test.ts
git commit -m "fix: update test expectation to match Turndown list format"
```

---

## Task 2: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore file**

```bash
cat > /Users/nileshkumar/gh/any-page-md/.gitignore << 'EOF'
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
EOF
```

- [ ] **Step 2: Verify .gitignore exists**

```bash
cat /Users/nileshkumar/gh/any-page-md/.gitignore
```

Expected: Output should show the gitignore contents above.

- [ ] **Step 3: Commit .gitignore**

```bash
git add .gitignore
git commit -m "chore: add .gitignore to exclude node_modules and build artifacts"
```

---

## Task 3: Create README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```bash
cat > /Users/nileshkumar/gh/any-page-md/README.md << 'EOF'
# PageMD

Convert any webpage to clean, AI-friendly markdown.

## What It Does

PageMD is a Next.js API service that fetches webpages, extracts the main content using Mozilla Readability, and converts it to clean markdown.

**Deployed at:** https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app

## Quick Start

### API Usage

```bash
curl -X POST https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

### Response Format

```json
{
  "markdown": "# Article Title\n\nContent here...",
  "meta": {
    "title": "Article Title",
    "url": "https://example.com/article",
    "wordCount": 542,
    "excerpt": "A brief excerpt...",
    "byline": "Author Name",
    "extractionTime": "2026-04-19T12:30:00Z"
  }
}
```

### CLI Usage

```bash
# Convert a URL and print markdown
npm run cli -- https://example.com/article

# Save to file
npm run cli -- https://example.com/article > article.md
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type check
npm run typecheck

# Lint
npm run lint
```

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ALLOW_UNSAFE_SSL` | Disable SSL verification (development only) | `undefined` |

**⚠️ Security Note:** Setting `ALLOW_UNSAFE_SSL=true` disables SSL certificate verification. Only use this for development with specific URLs that have certificate issues. Never use in production.

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript 5.7** (strict mode)
- **@mozilla/readability** - Main content extraction
- **jsdom 24** - DOM parsing
- **Turndown** - HTML to markdown conversion
- **Vitest** - Testing framework

## Architecture

```
/app/api/convert/route.ts  -> Main API endpoint (POST with {url})
  -> Fetches HTML (30s timeout)
  -> Extracts main content with Readability
  -> Converts to markdown with Turndown
  -> Returns { markdown, meta: {...} }

/lib/
  converter.ts   -> htmlToMarkdown() using Turndown
  extractor.ts   -> extractMainContent() using Readability + JSDOM
  validator.ts   -> validateUrl() with enum ValidationError

/cli/index.ts    -> CLI tool calling the API
```

## Project Status

**Phase 1:** ~75% complete
- ✅ API endpoint working
- ✅ CLI tool built
- ✅ Unit tests passing
- ✅ Deployed to Vercel

## License

MIT
EOF
```

- [ ] **Step 2: Verify README.md exists**

```bash
head -20 /Users/nileshkumar/gh/any-page-md/README.md
```

Expected: Should show the README header and introduction.

- [ ] **Step 3: Commit README.md**

```bash
git add README.md
git commit -m "docs: add README with usage examples and project documentation"
```

---

## Task 4: Implement SSL Environment Flag

**Files:**
- Modify: `app/api/convert/route.ts:39-69`

- [ ] **Step 1: Add SSL flag constant at top of function**

Add this constant after the console.log statements in `app/api/convert/route.ts`:

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("[PageMD] ===== REQUEST START =====");
  console.log("[PageMD] Method:", request.method);
  console.log("[PageMD] URL:", request.url);

  // ADD THIS: SSL flag - disabled by default, only enabled in development with explicit flag
  const ALLOW_UNSAFE_SSL = process.env.ALLOW_UNSAFE_SSL === "true";

  try {
    // ... rest of function
```

- [ ] **Step 2: Replace the fetch block with conditional SSL handling**

Replace lines 39-69 in `app/api/convert/route.ts` with this code:

```typescript
    // Fetch webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let fetchResponse: Response;
    try {
      if (ALLOW_UNSAFE_SSL) {
        // Development mode: Allow self-signed certificates
        console.warn("[PageMD] WARNING: SSL verification disabled - development only");
        const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        try {
          fetchResponse = await fetch(url.href, {
            method: "GET",
            headers: {
              "User-Agent": "PageMD/1.0",
            },
            signal: controller.signal,
          });
        } finally {
          // Restore original setting
          if (originalRejectUnauthorized !== undefined) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
          } else {
            delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          }
        }
      } else {
        // Production mode: Normal secure fetch
        fetchResponse = await fetch(url.href, {
          method: "GET",
          headers: {
            "User-Agent": "PageMD/1.0",
          },
          signal: controller.signal,
        });
      }
      console.log("[PageMD] Fetch response status:", fetchResponse.status, fetchResponse.statusText);
    } catch (fetchError) {
      console.log("[PageMD] Fetch error:", fetchError);
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
```

- [ ] **Step 3: Run type check to verify changes**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm run typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit SSL flag changes**

```bash
git add app/api/convert/route.ts
git commit -m "feat: add ALLOW_UNSAFE_SSL environment flag for SSL certificate handling"
```

---

## Task 5: Add Integration Tests

**Files:**
- Create: `tests/api/convert.test.ts`

- [ ] **Step 1: Create tests/api directory**

```bash
mkdir -p /Users/nileshkumar/gh/any-page-md/tests/api
```

- [ ] **Step 2: Create integration test file**

```bash
cat > /Users/nileshkumar/gh/any-page-md/tests/api/convert.test.ts << 'EOF'
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/convert/route";

// Mock external dependencies
vi.mock("@mozilla/readability", () => ({
  Readability: vi.fn().mockImplementation(function() {
    return {
      parse: vi.fn().mockReturnValue({
        title: "Test Article",
        content: "<h1>Test Article</h1><p>Test content</p>",
        excerpt: "Test excerpt",
        byline: "Test Author"
      })
    };
  })
}));

vi.mock("jsdom", () => ({
  JSDOM: vi.fn().mockImplementation(function() {
    return {
      window: {
        document: {}
      }
    };
  })
}));

vi.mock("turndown", () => ({
  default: vi.fn().mockImplementation(function() {
    return {
      turndown: vi.fn().mockReturnValue("# Test Article\n\nTest content")
    };
  })
}));

describe("POST /api/convert - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns markdown for valid URL", async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "<html><body><h1>Test</h1></body></html>"
    }) as any;

    const request = new Request("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/article" })
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.markdown).toBeTruthy();
    expect(data.meta).toBeTruthy();
    expect(data.meta.url).toBe("https://example.com/article");
    expect(data.meta.wordCount).toBeGreaterThan(0);
  });

  it("returns 400 for invalid URL", async () => {
    const request = new Request("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-valid-url" })
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 for missing URL field", async () => {
    const request = new Request("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({})
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("url");
  });

  it("returns 408 when request times out", async () => {
    // Mock fetch that throws AbortError
    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error("Timeout");
      error.name = "AbortError";
      throw error;
    }) as any;

    const request = new Request("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/article" })
    });

    const response = await POST(request as any);

    expect(response.status).toBe(408);

    const data = await response.json();
    expect(data.error).toContain("timeout");
  });
});
EOF
```

- [ ] **Step 3: Run integration tests**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm test tests/api/convert.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 4: Commit integration tests**

```bash
git add tests/api/convert.test.ts
git commit -m "test: add integration tests for API convert endpoint"
```

---

## Task 6: Add E2E Tests

**Files:**
- Create: `tests/e2e/convert.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Create tests/e2e directory**

```bash
mkdir -p /Users/nileshkumar/gh/any-page-md/tests/e2e
```

- [ ] **Step 2: Create E2E test file**

```bash
cat > /Users/nileshkumar/gh/any-page-md/tests/e2e/convert.test.ts << 'EOF'
import { describe, it, expect } from "vitest";

const API_URL = "https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app/api/convert";

describe("E2E: POST /api/convert (deployed API)", () => {

  it("converts example.com to markdown", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.markdown).toBeTruthy();
    expect(typeof data.markdown).toBe("string");
    expect(data.markdown.length).toBeGreaterThan(0);

    expect(data.meta).toBeTruthy();
    expect(data.meta.url).toBe("https://example.com");
    expect(data.meta.wordCount).toBeGreaterThan(0);
    expect(data.meta.extractionTime).toBeTruthy();
  });

  it("handles invalid URL with clear error", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
    expect(typeof data.error).toBe("string");
  });

  it("returns error for missing URL field", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});
EOF
```

- [ ] **Step 3: Update vitest.config.ts to include E2E tests**

Read the current config first:
```bash
cat /Users/nileshkumar/gh/any-page-md/vitest.config.ts
```

Then update it (the file should look like this):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next", "dist"],
    environment: "node",
  },
});
```

The existing config already includes `**/*.test.ts` which will pick up our E2E tests.

- [ ] **Step 4: Run E2E tests (requires network access)**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm test tests/e2e/convert.test.ts
```

Expected: All 3 tests pass (may take 10-30 seconds due to network requests).

- [ ] **Step 5: Commit E2E tests**

```bash
git add tests/e2e/convert.test.ts
git commit -m "test: add E2E tests against deployed API"
```

---

## Task 7: Run Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm test -- --run
```

Expected output:
```
✓ tests/lib/validator.test.ts (5 tests)
✓ tests/lib/converter.test.ts (4 tests)
✓ tests/lib/extractor.test.ts (3 tests)
✓ tests/api/convert.test.ts (4 tests)

Test Files  4 passed (4)
     Tests  16 passed (16)
```

Note: E2E tests are run separately due to network dependency.

- [ ] **Step 2: Run type check**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No critical errors (warnings may exist).

---

## Task 8: Manual Verification Checklist

- [ ] **Step 1: Start dev server**

```bash
cd /Users/nileshkumar/gh/any-page-md
npm run dev
```

Keep this running in a terminal.

- [ ] **Step 2: Test with example.com**

In a new terminal:
```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: "application/json" \
  -d '{"url": "https://example.com"}'
```

Expected: JSON response with markdown content.

- [ ] **Step 3: Test with invalid URL**

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: "application/json" \
  -d '{"url": "not-a-url"}'
```

Expected: 400 status with error message.

- [ ] **Step 4: Test CLI tool**

```bash
npm run cli -- https://example.com
```

Expected: Markdown printed to terminal.

- [ ] **Step 5: Copy output and verify in Claude**

Copy the markdown from Step 2 or 4 and verify it renders correctly in a markdown preview or Claude chat.

---

## Task 9: Deploy and Verify

- [ ] **Step 1: Deploy to Vercel**

```bash
cd /Users/nileshkumar/gh/any-page-md
vercel deploy
```

Expected: Returns a preview URL.

- [ ] **Step 2: Test deployed API**

```bash
curl -X POST https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app/api/convert \
  -H "Content-Type: "application/json" \
  -d '{"url": "https://example.com"}'
```

Expected: Same response as local.

- [ ] **Step 3: Run E2E tests against deployed API**

```bash
npm test tests/e2e/convert.test.ts
```

Expected: All E2E tests pass.

---

## Task 10: Tag v0.1.0 Release

- [ ] **Step 1: Update package.json version**

Update the version in `package.json`:
```json
{
  "name": "pagemd",
  "version": "0.1.0",
  ...
}
```

- [ ] **Step 2: Commit version update**

```bash
git add package.json
git commit -m "chore: bump version to 0.1.0"
```

- [ ] **Step 3: Create git tag**

```bash
git tag v0.1.0
```

- [ ] **Step 4: Push to remote**

```bash
git push origin main
git push origin --tags
```

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

---

## Verification Summary

After completing all tasks, verify:

- [ ] All 16 unit + integration tests pass
- [ ] All 3 E2E tests pass
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Manual checklist completed
- [ ] v0.1.0 tagged and pushed
- [ ] Deployed API works

---

## Completion Checklist

- [ ] Task 1: Fix failing converter test
- [ ] Task 2: Add .gitignore
- [ ] Task 3: Create README.md
- [ ] Task 4: Implement SSL environment flag
- [ ] Task 5: Add integration tests
- [ ] Task 6: Add E2E tests
- [ ] Task 7: Run full test suite
- [ ] Task 8: Manual verification
- [ ] Task 9: Deploy and verify
- [ ] Task 10: Tag v0.1.0

**Phase 1 Complete!** 🎉
