# PageMD Project

Webpage to Markdown API. Converts any URL to clean, AI-friendly markdown.

**Production:** https://pagemd.vercel.app | **GitHub:** https://github.com/nilukush/any-page-md

## Tech Stack

Next.js 15 | TypeScript 5.7 | @mozilla/readability | jsdom 24 | Turndown | Vitest

## Architecture

```
/app/api/convert/route.ts  -> POST {url} -> {markdown, meta}
/lib/converter.ts          -> HTML to Markdown (Turndown)
/lib/extractor.ts          -> Content extraction (Readability)
/lib/validator.ts          -> URL validation
/cli/index.ts              -> CLI tool
/app/api/health/route.ts   -> Health check
/extension/                -> Chrome browser extension
```

## Key Files

| File | Purpose |
|------|---------|
| `app/api/convert/route.ts` | Main conversion endpoint |
| `lib/converter.ts` | HTML to Markdown converter |
| `lib/extractor.ts` | Main content extractor |
| `lib/validator.ts` | URL validation |
| `cli/index.ts` | CLI tool |
| `extension/manifest.json` | Extension manifest |
| `extension/popup/` | Extension popup UI |
| `extension/background/` | Service worker |
| `tests/api/convert.test.ts` | Integration tests (6) |
| `tests/e2e/convert.test.ts` | E2E tests (3) |

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run test         # Run all 21 tests
npm run test:ui      # Run tests with UI
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run cli -- <url> # CLI tool
```

## Status: Phase 2 COMPLETE

- **Phase 1:** API, CLI, tests, docs deployed (v0.1.0)
- **Phase 2:** Chrome browser extension complete
- 21/21 tests passing (100%)

## Critical Patterns

### Lazy Loading (Required for Vercel)
```typescript
// API routes must use dynamic imports for jsdom packages
const { Readability } = await import("@mozilla/readability");
const { JSDOM } = await import("jsdom");
const TurndownService = (await import("turndown")).default;
```

### Logging
```typescript
console.log("[PageMD] Description", data);
```

### SSL Flag
```typescript
const ALLOW_UNSAFE_SSL = process.env.ALLOW_UNSAFE_SSL === "true";
// Only set to "true" for development with certificate issues
```

### Path Aliases
Use `@/lib/*` for imports from the lib directory

### serverExternalPackages (next.config.ts)
- jsdom
- @mozilla/readability
- turndown

## Documentation

- Design Docs: `/docs/plans/2026-02-14-pagemd-*.md`
- Extension Docs: `/extension/README.md`
- Project Memory: MEMORY.md in project memory directory
