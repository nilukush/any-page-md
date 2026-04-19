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
    expect(data.meta.url).toBe("https://example.com/");
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
