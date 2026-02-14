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
