# PageMD Project

Convert any webpage URL to clean, AI-friendly markdown.

## What It Does

PageMD is a Next.js API service that fetches webpages, extracts the main content using Mozilla Readability, and converts it to clean markdown. Deployed at: https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript 5.7** (strict mode enabled)
- **@mozilla/readability** - Main content extraction
- **jsdom 24** - DOM parsing
- **Turndown** - HTML to markdown conversion
- **Vitest** - Testing framework
- **CLI** - Commander.js, chalk, ora

## Architecture

```
/app/api/convert/route.ts  -> Main API endpoint (POST with {url})
  -> Fetches HTML (30s timeout, NODE_TLS_REJECT_UNAUTHORIZED="0")
  -> Extracts main content with Readability
  -> Converts to markdown with Turndown
  -> Returns { markdown, meta: { title, url, wordCount, excerpt, ... } }

/lib/
  converter.ts   -> htmlToMarkdown() using Turndown
  extractor.ts   -> extractMainContent() using Readability + JSDOM
  validator.ts   -> validateUrl() with enum ValidationError

/cli/index.ts    -> CLI tool calling the API (npm run cli)

/app/api/health/route.ts  -> Health check endpoint
```

## Key File Locations

| File | Purpose |
|------|---------|
| `/app/api/convert/route.ts` | Main conversion endpoint |
| `/lib/converter.ts` | HTML to Markdown converter |
| `/lib/extractor.ts` | Main content extractor |
| `/lib/validator.ts` | URL validation |
| `/cli/index.ts` | CLI tool |
| `/next.config.ts` | Next.js config (serverExternalPackages) |
| `/vitest.config.ts` | Vitest test config |

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run cli          # Run CLI tool
```

## Current Phase: Phase 1 (~75% complete)

### Completed
- Basic API endpoint with URL fetching
- Content extraction with Readability
- HTML to Markdown conversion
- URL validation
- Health check endpoint
- CLI tool
- Vercel deployment

### Known Issues
1. **Security workaround**: `NODE_TLS_REJECT_UNAUTHORIZED="0"` is set to bypass SSL certificate issues (line 46-62 in route.ts). This should be replaced with proper certificate handling.
2. **Missing tests**: `/tests/lib/` exists but test files need to be written
3. **Lazy loading**: Dependencies are lazy-loaded in the API route due to jsdom compatibility issues - keep this pattern

## Important Patterns

- **Lazy imports**: Readability, JSDOM, Turndown must be imported inside the request handler (not at module level) due to jsdom/Next.js compatibility
- **Error handling**: All async operations wrapped in try-catch with detailed logging prefixed `[PageMD]`
- **Timeout**: Fetch has 30s timeout using AbortController
- **TypeScript**: Uses strict mode with `@/*` and `@/lib/*` path aliases

## Design Docs

See `/docs/plans/` for full design documentation:
- `2026-02-14-pagemd-design.md` - Original design spec
- `2026-02-14-pagemd-api-implementation.md` - Implementation details
