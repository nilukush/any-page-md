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
    expect(result).toContain("*   Item 1");
    expect(result).toContain("*   Item 2");
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
