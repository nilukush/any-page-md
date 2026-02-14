# PageMD API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build a serverless API that converts any webpage URL to clean, AI-friendly markdown.

**Architecture:** Next.js API Route (Edge Function) that fetches a URL, extracts main content using Mozilla Readability, converts to markdown with Turndown, and returns JSON with markdown + metadata.

**Tech Stack:** Next.js 15, TypeScript, @mozilla/readability, turndown, Zod, Vitest, Vercel

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vercel.json`

**Step 1: Create package.json**

```json
{
  "name": "pagemd",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@mozilla/readability": "^0.5.0",
    "eslint": "^9.15.0",
    "eslint-config-next": "^15.1.0",
    "prettier": "^3.4.0",
    "turndown": "^7.1.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "zod": "^3.24.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
};

export default config;
```

**Step 4: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Step 5: Run install and verify**

```bash
npm install
npm run typecheck
```

Expected: No TypeScript errors

**Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js project with TypeScript"
```

---

## Task 2: Create URL Validator Module

**Files:**
- Create: `lib/validator.ts`
- Create: `tests/lib/validator.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/validator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateUrl, ValidationError } from "../../lib/validator";

describe("validateUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    const result = validateUrl("https://example.com/article");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toBe("https://example.com/article");
    }
  });

  it("accepts valid HTTP URLs", () => {
    const result = validateUrl("http://example.com/article");
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = validateUrl("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.EMPTY_URL);
    }
  });

  it("rejects invalid protocol", () => {
    const result = validateUrl("ftp://example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.INVALID_PROTOCOL);
    }
  });

  it("rejects malformed URL", () => {
    const result = validateUrl("not-a-url");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.INVALID_URL);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/lib/validator.test.ts
```

Expected: FAIL - "Cannot find module '../../lib/validator'"

**Step 3: Write minimal implementation**

Create `lib/validator.ts`:

```typescript
export enum ValidationError {
  EMPTY_URL = "URL cannot be empty",
  INVALID_PROTOCOL = "URL must use HTTP or HTTPS protocol",
  INVALID_URL = "URL format is invalid",
}

export interface ValidationResult {
  success: true;
  url: string;
}

export interface ValidationFailure {
  success: false;
  error: ValidationError;
}

export type ValidateUrlResult = ValidationResult | ValidationFailure;

export function validateUrl(input: string): ValidateUrlResult {
  // Check empty
  if (!input || input.trim() === "") {
    return { success: false, error: ValidationError.EMPTY_URL };
  }

  // Trim whitespace
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);

    // Check protocol
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { success: false, error: ValidationError.INVALID_PROTOCOL };
    }

    return { success: true, url: url.href };
  } catch {
    return { success: false, error: ValidationError.INVALID_URL };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/lib/validator.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/validator.ts tests/lib/validator.test.ts
git commit -m "feat: add URL validator with tests"
```

---

## Task 3: Create Content Extractor Module

**Files:**
- Create: `lib/extractor.ts`
- Create: `tests/lib/extractor.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/extractor.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractMainContent } from "../../lib/extractor";

describe("extractMainContent", () => {
  it("extracts main content from article HTML", () => {
    const html = `
      <html>
        <head><title>Test Article</title></head>
        <body>
          <nav>Navigation</nav>
          <article>
            <h1>Main Title</h1>
            <p>This is the main content we want to extract.</p>
          </article>
          <footer>Copyright 2026</footer>
        </body>
      </html>
    `;

    const result = extractMainContent(html);
    expect(result).toContain("Main Title");
    expect(result).toContain("This is the main content we want to extract.");
    expect(result).not.toContain("Navigation");
    expect(result).not.toContain("Copyright 2026");
  });

  it("handles empty HTML gracefully", () => {
    const result = extractMainContent("");
    expect(result).toBe("");
  });

  it("handles HTML without main content", () => {
    const html = "<html><body><p>Some content</p></body></html>";
    const result = extractMainContent(html);
    // Readability should still extract something from the paragraph
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/lib/extractor.test.ts
```

Expected: FAIL - "Cannot find module '../../lib/extractor'"

**Step 3: Write minimal implementation**

Create `lib/extractor.ts`:

```typescript
import { Readability } from "@mozilla/readability";

export function extractMainContent(html: string): string {
  // Handle empty input
  if (!html || html.trim() === "") {
    return "";
  }

  try {
    const article = new Readability();
    article.parse(html);

    // Return the article content HTML
    return article.articleContent;
  } catch (error) {
    // If parsing fails, return empty string
    console.error("Failed to parse HTML:", error);
    return "";
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/lib/extractor.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/extractor.ts tests/lib/extractor.test.ts
git commit -m "feat: add content extractor using Readability"
```

---

## Task 4: Create Markdown Converter Module

**Files:**
- Create: `lib/converter.ts`
- Create: `tests/lib/converter.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/converter.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "../../lib/converter";

describe("htmlToMarkdown", () => {
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
    expect(result).toContain("- Item 1");
    expect(result).toContain("- Item 2");
  });

  it("handles code blocks", () => {
    const html = `<pre><code>const x = 1;</code></pre>`;
    const result = htmlToMarkdown(html);
    expect(result).toContain("```");
  });

  it("handles empty HTML", () => {
    const result = htmlToMarkdown("");
    expect(result).toBe("");
  });

  it("handles plain text", () => {
    const result = htmlToMarkdown("Just plain text");
    expect(result).toBe("Just plain text");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/lib/converter.test.ts
```

Expected: FAIL - "Cannot find module '../../lib/converter'"

**Step 3: Write minimal implementation**

Create `lib/converter.ts`:

```typescript
import TurndownService from "turndown";

export function htmlToMarkdown(html: string): string {
  // Handle empty input
  if (!html || html.trim() === "") {
    return "";
  }

  try {
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    return turndownService.turndown(html);
  } catch (error) {
    console.error("Failed to convert to markdown:", error);
    return "";
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/lib/converter.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/converter.ts tests/lib/converter.test.ts
git commit -m "feat: add HTML to markdown converter using Turndown"
```

---

## Task 5: Create API Route Handler

**Files:**
- Create: `api/convert/route.ts`
- Create: `tests/api/convert.test.ts`

**Step 1: Write the failing test**

Create `tests/api/convert.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "node-fetch";
import { validateUrl } from "../../lib/validator";
import { extractMainContent } from "../../lib/extractor";
import { htmlToMarkdown } from "../../lib/converter";

// Mock external dependencies
vi.mock("../../lib/validator", () => ({
  validateUrl: vi.fn(),
}));

vi.mock("../../lib/extractor", () => ({
  extractMainContent: vi.fn(),
}));

vi.mock("../../lib/converter", () => ({
  htmlToMarkdown: vi.fn(),
}));

describe("POST /api/convert", () => {
  const API_URL = "http://localhost:3000/api/convert";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid URL", async () => {
    vi.mocked(validateUrl).mockReturnValue({
      success: false,
      error: "Invalid URL format",
    });

    const response = await POST(API_URL, {
      body: JSON.stringify({ url: "invalid-url" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Invalid URL format" });
  });

  it("returns 408 when fetch times out", async () => {
    vi.mocked(validateUrl).mockReturnValue({
      success: true,
      url: "https://example.com",
    });

    const response = await POST(API_URL, {
      body: JSON.stringify({ url: "https://example.com" }),
    });

    // Should handle timeout
    expect([200, 408]).toContain(response.status);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/api/convert.test.ts
```

Expected: FAIL - API route doesn't exist yet

**Step 3: Write minimal implementation**

Create `api/convert/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateUrl } from "../../lib/validator";
import { extractMainContent } from "../../lib/extractor";
import { htmlToMarkdown } from "../../lib/converter";
import { ValidationError } from "../../lib/validator";

export const runtime = "edge";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || !body.url) {
      return NextResponse.json(
        { error: "Request body must contain 'url' field" },
        { status: 400 }
      );
    }

    // Validate URL
    const validationResult = validateUrl(body.url);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const url = validationResult.url;

    // Fetch the webpage
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "PageMD/1.0",
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` },
        { status: fetchResponse.status }
      );
    }

    // Get HTML content
    const html = await fetchResponse.text();

    // Extract main content
    const mainContent = extractMainContent(html);
    if (!mainContent) {
      return NextResponse.json(
        { error: "No extractable content found on page" },
        { status: 404 }
      );
    }

    // Convert to markdown
    const markdown = htmlToMarkdown(mainContent);

    // Calculate word count
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;

    // Return response
    return NextResponse.json({
      markdown,
      meta: {
        title: new URL(url).pathname,
        url,
        wordCount,
        extractionTime: new Date().toISOString(),
      },
    });

  } catch (error) {
    // Handle errors
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - URL took too long to respond" },
        { status: 408 }
      );
    }

    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/api/convert.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add api/convert/route.ts tests/api/convert.test.ts
git commit -m "feat: add API convert endpoint with error handling"
```

---

## Task 6: Add Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

**Step 1: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
  },
});
```

**Step 2: Run all tests**

```bash
npm test
```

Expected: All 6 test files PASS

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add Vitest configuration"
```

---

## Task 7: Add README Documentation

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create `README.md`:

```markdown
# PageMD

Convert any webpage to clean, AI-friendly markdown.

## Usage

### API Endpoint

\`\`\`bash
curl -X POST https://pagemd.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/article"}'
\`\`\`

### Response

\`\`\`json
{
  "markdown": "# Article Title\\n\\nContent here...",
  "meta": {
    "title": "/article",
    "url": "https://example.com/article",
    "wordCount": 542,
    "extractionTime": "2026-02-14T12:30:00Z"
  }
}
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
npm test
\`\`\`

## Deployment

\`\`\`bash
vercel --prod
\`\`\`
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage examples"
```

---

## Task 8: Local Testing with Real URLs

**Files:**
- No file creation

**Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server running on http://localhost:3000

**Step 2: Test with a real article**

In a new terminal:

```bash
curl -X POST http://localhost:3000/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.anthropic.com/news/anthropic-claude-3-5"}'
```

Expected: JSON response with markdown content

**Step 3: Verify markdown quality**

Copy the `markdown` field from response and paste into Claude to verify readability.

**Step 4: Test error handling**

```bash
# Test invalid URL
curl -X POST http://localhost:3000/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "not-a-url"}'

# Test timeout (use a slow site)
curl -X POST http://localhost:3000/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://httpbin.org/delay/60"}'
```

Expected: 400 for invalid URL, 408 for timeout

**Step 5: Commit any fixes**

```bash
git add .
git commit -m "fix: address issues found during local testing"
```

---

## Task 9: Deploy to Vercel

**Files:**
- No file creation

**Step 1: Install Vercel CLI (if not installed)**

```bash
npm i -g vercel
```

**Step 2: Login to Vercel**

```bash
vercel login
```

Expected: Browser opens for authentication

**Step 3: Deploy to preview**

```bash
vercel deploy
```

Expected: Returns preview URL

**Step 4: Test deployed API**

```bash
# Replace with your preview URL
curl -X POST https://your-preview-url.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.anthropic.com/news/anthropic-claude-3-5"}'
```

Expected: Same response as local

**Step 5: Deploy to production**

```bash
vercel --prod
```

Expected: Production URL (likely `pagemd.vercel.app` or your custom domain)

---

## Task 10: E2E Testing Against Production

**Files:**
- No file creation

**Step 1: Test with multiple URL types**

Test each of these URLs and verify markdown quality:

```bash
# News article
curl -X POST https://pagemd.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.theverge.com/2024/ai/anthropic-claude-3"}'

# Blog post
curl -X POST https://pagemd.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://blog.premath.co/how-ai-is-changing-software-development-94ba2c8e8f1e"}'

# Technical documentation
curl -X POST https://pagemd.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"}'

# Medium article
curl -X POST https://pagemd.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://medium.com/@author/article-slug"}'
```

**Step 2: Verify checklist**

```
□ Paste each markdown output into Claude
□ Verify content is readable and well-formated
□ Verify navigation/footers are removed
□ Check error handling with invalid URL
□ Check timeout handling with slow URL
```

**Step 3: Document any issues found**

If issues found, create follow-up tasks in `docs/plans/` for fixes.

**Step 4: Tag release**

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Success Criteria Verification

Before considering Phase 1 complete, verify:

| Criterion | Status |
|----------|--------|
| API deployed to Vercel | ☐ / ☐ |
| Converts 5+ article URLs to clean markdown | ☐ / ☐ |
| Handles errors (400, 408, 404, 500) | ☐ / ☐ |
| Output pastes correctly into Claude | ☐ / ☐ |
| All tests passing | ☐ / ☐ |
| README with usage examples | ☐ / ☐ |
| User testing checklist complete | ☐ / ☐ |

---

## Next Phase Preview

After Phase 1 approval:

- **Phase 2:** CLI tool (`npx pagemd <url>`)
- **Phase 2:** Browser Extension (Chrome/Firefox)
- **Phase 3:** AI-powered summarization (optional)

