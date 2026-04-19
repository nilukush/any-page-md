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
