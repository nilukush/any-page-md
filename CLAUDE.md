# PageMD Project

Convert any webpage URL to clean, AI-friendly markdown.

## What It Does

PageMD is a Next.js API service that fetches webpages, extracts the main content using Mozilla Readability, and converts it to clean markdown.

**Production:** https://pagemd.vercel.app
**GitHub:** https://github.com/nilukush/any-page-md

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript 5.7** (strict mode)
- **@mozilla/readability** - Content extraction
- **jsdom 24** - DOM parsing
- **Turndown** - HTML to markdown
- **Vitest** - Testing

## Architecture

```
/app/api/convert/route.ts  -> POST {url} -> {markdown, meta}
/lib/converter.ts          -> HTML to Markdown (Turndown)
/lib/extractor.ts          -> Content extraction (Readability)
/lib/validator.ts          -> URL validation
/cli/index.ts              -> CLI tool
/app/api/health/route.ts   -> Health check
```

## Key File Locations

| File | Purpose |
|------|---------|
| `/app/api/convert/route.ts` | Main conversion endpoint |
| `/lib/converter.ts` | HTML to Markdown converter |
| `/lib/extractor.ts` | Main content extractor |
| `/lib/validator.ts` | URL validation |
| `/cli/index.ts` | CLI tool |
| `/tests/api/convert.test.ts` | Integration tests (6) |
| `/tests/e2e/convert.test.ts` | E2E tests (3) |

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run test         # Run all 21 tests
npm run test:ui      # Run tests with UI
npm run typecheck    # TypeScript check
npm run cli -- <url> # CLI tool
```

## Project Status: Phase 1 COMPLETE

- All 10 tasks completed
- 21/21 tests passing (100%)
- Production deployed
- v0.1.0 released

### Completed
- API endpoint with URL fetching
- Content extraction with Readability
- HTML to Markdown conversion
- CLI tool
- Integration & E2E tests
- README documentation
- .gitignore configured
- SSL environment flag (ALLOW_UNSAFE_SSL)

## Important Patterns

### Lazy Loading (Required for Vercel)
```typescript
// Must use dynamic imports in API routes
const { Readability } = await import("@mozilla/readability");
const { JSDOM } = await import("jsdom");
const TurndownService = (await import("turndown")).default;
```

### Logging Convention
```typescript
console.log("[PageMD] Description", data);
```

### SSL Flag
```typescript
const ALLOW_UNSAFE_SSL = process.env.ALLOW_UNSAFE_SSL === "true";
// Only set to "true" for development with certificate issues
```

## Documentation

- **Design Docs:** `/docs/plans/2026-02-14-pagemd-*.md`
- **Project Memory:** See MEMORY.md in project memory directory
