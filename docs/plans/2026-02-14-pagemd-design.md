# PageMD Design Document

**Date:** 2026-02-14
**Status:** Approved
**Approach:** Serverless Next.js API

---

## Overview

**PageMD** is a serverless web service that converts any webpage into clean, AI-friendly markdown. Users can interact via:

1. **CLI tool** - `pagemd https://example.com`
2. **REST API** - Simple POST endpoint with URL
3. **Browser Extension** - One-click conversion from any page

The core value is **smart content extraction** using Mozilla Readability combined with Turndown to produce markdown that captures meaningful content while stripping navigation, ads, and boilerplate.

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CLI Client   │     │  Browser Extension  │     │  Direct API Call  │
│  (TypeScript)  │     │    (Chrome/Firefox)  │     │   (cURL/Postman)  │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────────┐
         │         Next.js API (Vercel Edge)         │
         │  ┌──────────────────────────────────────┐ │
         │  │   /api/convert  (POST)              │ │
         │  └──────────────┬──────────────────────┘ │
         └─────────────────┼────────────────────────┘
                           │
         ┌─────────────────┼────────────────────────┐
         │  Content Extraction Layer                │
         │  ├─ Mozilla Readability (main content)   │
         │  ├─ Turndown (HTML → Markdown)        │
         │  └─ Optional: Anthropic API (summarize) │
         └─────────────────┬────────────────────────┘
                           │
                           ▼
         ┌─────────────────┴────────────────────────┐
         │     Markdown Response (JSON)              │
         │  { markdown: "...", meta: {...} }      │
         └──────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Layer** | Next.js API Routes | Edge functions, auto-scaling, TypeScript |
| **Content Extraction** | @mozilla/readability | Extracts main content, removes boilerplate |
| **Markdown Conversion** | Turndown | HTML to clean markdown |
| **CLI** | Commander/Chalk | Terminal interface for users |
| **Browser Extension** | Chrome Extensions API | One-click page conversion |

---

## Output & User Experience

**Output Format:** All interfaces return markdown as **plain text** that can be:

1. **Copied to clipboard** - One-action copy from CLI, browser extension, or API response
2. **Saved to .md file** - CLI has `--output` flag to save directly
3. **Pasted anywhere** - Slack, Discord, Claude, email, etc.

**Three Interfaces Explained:**

| Interface | How User Gets Markdown |
|----------|---------------------|
| **CLI** | `pagemd https://example.com` → prints to terminal (copy) <br> `pagemd https://example.com -o page.md` → saves to file |
| **API** | POST request returns JSON: `{ "markdown": "content..." }` <br> User copies from response body |
| **Browser Extension** | Click icon → markdown auto-copied to clipboard <br> Shows notification: "Markdown copied!" |

---

## Data Flow & Error Handling

### Happy Path Flow

```
User Request (URL)
       │
       ▼
┌──────────────────┐
│  Validate URL    │ → Must be HTTP/HTTPS, well-formed
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Fetch Page     │ → Use fetch() with timeout (30s)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Extract Content │ → Mozilla Readability finds main content
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Convert to MD   │ → Turndown transforms HTML → Markdown
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Return Result   │ → { markdown: "...", meta: {...} }
└──────────────────┘
```

### Error Cases

| Error | Response | User Action |
|-------|---------|-------------|
| Invalid URL | `400: { error: "Invalid URL format" }` | Fix URL and retry |
| Timeout | `408: Request Timeout` | Check site is accessible, retry |
| Blocked by CORS | `403: Unable to fetch` | Try CLI or browser extension |
| No content found | `404: No extractable content` | Page may be JS-rendered, not supported |
| Rate limited | `429: Too many requests` | Wait and retry |

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 15 (App Router) | Edge Functions, TypeScript, Vercel-optimized |
| **Deployment** | Vercel | Zero-config deploys, free tier, HTTPS |
| **Content Extraction** | `@mozilla/readability` | Industry-standard main content extraction |
| **Markdown** | Turndown (`turndown`) | Reliable HTML → Markdown conversion |
| **HTTP Client** | Native `fetch` | Built into Edge runtime, no deps |
| **Validation** | Zod | URL validation, type safety |
| **Testing** | Vitest | Fast, native ESM support |
| **Linting** | ESLint + Prettier | Code quality |

### Project Structure

```
pagemd/
├── api/
│   └── convert/
│       └── route.ts          # POST /api/convert
├── lib/
│   ├── extractor.ts      # Readability wrapper
│   ├── converter.ts       # Turndown wrapper
│   └── validator.ts       # URL validation
├── tests/
│   └── api.test.ts       # API route tests
│   └── extractor.test.ts # Extraction tests
├── package.json
├── tsconfig.json
└── vercel.json              # Deployment config
```

---

## Testing Strategy

### Test Levels

| Level | What | Tools |
|-------|------|-------|
| **Unit** | Extractor, Converter, Validator in isolation | Vitest |
| **Integration** | API route with mocked fetch | Vitest + MSW |
| **E2E** | Real URLs against deployed API | Playwright |

### Key Test Scenarios

```
Unit Tests (lib/):
├── extractor.test.ts
│   ✅ extracts main content from article HTML
│   ✅ removes navigation/footers
│   ✅ handles empty content
│   ✅ handles malformed HTML
│
├── converter.test.ts
│   ✅ converts HTML to markdown
│   ✅ preserves headings structure
│   ✅ converts links to MD format
│   ✅ handles code blocks
│
└── validator.test.ts
    ✅ accepts valid http/https URLs
    ✅ rejects invalid URLs
    ✅ rejects empty strings

Integration Tests (tests/):
└── api.test.ts
    ✅ POST /api/convert returns markdown
    ✅ validates request body
    ✅ handles fetch errors
    ✅ handles timeout
    ✅ returns 400 for invalid URL

E2E Tests (deployed):
└── e2e.test.ts
    ✅ real article URL → clean markdown
    ✅ blog URL → clean markdown
    ✅ news site → clean markdown
```

---

## Deployment & DevOps

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Environment Variables

| Variable | Purpose |
|---------|---------|
| `ANTHROPIC_API_KEY` | Optional: For AI summarization (Phase 3+) |
| `NODE_ENV` | Set to `production` by Vercel |

### Commands

```bash
# Local development
npm run dev

# Run tests
npm run test

# Deploy preview
vercel deploy

# Deploy to production
vercel --prod
```

---

## MVP Feature Scope (Phase 1)

For the first version, we're building **one feature**:

**Feature 1: API Endpoint**

```
POST /api/convert
Content-Type: application/json

Request:
{
  "url": "https://example.com/article"
}

Response:
{
  "markdown": "# Article Title\n\nContent here...",
  "meta": {
    "title": "Article Title",
    "url": "https://example.com/article",
    "wordCount": 542,
    "extractionTime": "2026-02-14T12:30:00Z"
  }
}
```

**What's NOT in Phase 1:**
- ❌ CLI tool
- ❌ Browser extension
- ❌ AI summarization
- ❌ User accounts / rate limiting
- ❌ Database / history

### Success Criteria for Phase 1

| Criterion | How to Verify |
|----------|-----------------|
| API deployed | Accessible at `https://<project>.vercel.app/api/convert` |
| Converts articles | Test with 5+ article URLs produces clean markdown |
| Handles errors | Invalid URL returns 400, timeout returns 408 |
| Can paste into Claude | Output renders correctly in Claude chat |
| Tests passing | All unit + integration tests pass |
| Documentation | README with usage examples |

### User Testing Checklist

```
□ Test with: news article URL
□ Test with: blog post URL
□ Test with: Medium/Substack article
□ Test with: technical documentation
□ Test with: long-form content
□ Paste output into Claude → verify readability
□ Try invalid URL → verify error message
□ Try unreachable URL → verify timeout handling
```

---

## Future Phases

**Phase 2:** CLI tool and Browser Extension
**Phase 3:** AI-powered summarization (Anthropic API integration)
**Phase 4:** User accounts, history, rate limiting
**Phase 5:** Advanced features (batch processing, webhooks)

---

## Sources

- [Webpage to Markdown - Apify](https://apify.com/extractorscapes/webpage-to-markdown)
- [Trafilatura - Read the Docs](https://trafilatura.readthedocs.io/)
- [markdowner by supermemoryai - GitHub](https://github.com/supermemoryai/markdowner)
- [Webpage to Markdown - Chrome Web Store](https://chromewebstore.google.com/detail/webpage-to-markdown/ajeinonckioeekcfanjndliandidilid)
- [Bright Data Guide](https://brightdata.com/blog/web-data/scrape-websites-to-markdown)
