# PageMD Agent Instructions

## Code Quality Standards

- **TypeScript strict mode**: All code must pass `npm run typecheck` with no errors
- **ESLint**: Run `npm run lint` before committing changes
- **Path aliases**: Use `@/lib/*` for imports from the lib directory

## Critical Architecture Rules

### 1. Lazy Loading for jsdom Dependencies

**NEVER import these at module level:**
```ts
// DON'T DO THIS at top of file
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
```

**ALWAYS import inside the request handler:**
```ts
// DO THIS inside the function
const { Readability } = await import("@mozilla/readability");
const { JSDOM } = await import("jsdom");
const TurndownService = (await import("turndown")).default;
```

This is required for Next.js/Vercel compatibility with jsdom.

### 2. Keep `serverExternalPackages` in next.config.ts

The following packages must remain in `serverExternalPackages`:
- jsdom
- @mozilla/readability
- turndown

## Testing Approach (TDD)

### Current Status
Test framework (Vitest) is configured but tests need to be written.

### Test Location
- Unit tests go in: `/tests/lib/`
- Name convention: `*.test.ts`
- Run with: `npm run test` or `npm run test:ui`

### What Needs Tests

Priority order:
1. `/lib/validator.ts` - URL validation logic (pure functions, easy to test)
2. `/lib/extractor.ts` - Content extraction (mock JSDOM)
3. `/lib/converter.ts` - HTML to markdown conversion (mock Turndown)
4. `/app/api/convert/route.ts` - API endpoint integration tests

### Test Pattern Example

```ts
import { describe, it, expect } from "vitest";
import { validateUrl, ValidationError } from "@/lib/validator";

describe("validateUrl", () => {
  it("should accept valid HTTPS URLs", () => {
    const result = validateUrl("https://example.com");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toBe("https://example.com");
    }
  });

  it("should reject empty URLs", () => {
    const result = validateUrl("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.EMPTY_URL);
    }
  });
});
```

## Error Handling Pattern

All API errors should:
1. Log with `[PageMD]` prefix for filtering
2. Include context (URL, status codes, content lengths)
3. Return appropriate HTTP status codes
4. Provide user-friendly error messages in response

```ts
console.log("[PageMD] Descriptive message");
console.error("[PageMD] ERROR:", error);
```

## Known Technical Debt

1. **SSL Certificate bypass**: The `NODE_TLS_REJECT_UNAUTHORIZED="0"` workaround in `/app/api/convert/route.ts` (lines 46-62) must be replaced with proper certificate handling before production use.

2. **No test coverage**: Write tests starting with `/lib/validator.ts` since it has pure functions.

3. **No rate limiting**: API has no rate limiting - consider adding before public release.

## When Working on This Project

1. Always run `npm run typecheck` before committing
2. Keep imports lazy for jsdom-related packages
3. Add tests for new pure functions
4. Use `[PageMD]` prefix for all console logs
5. Don't break the CLI tool - it depends on the API
