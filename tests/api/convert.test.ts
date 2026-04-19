import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server components
vi.mock("next/server", () => ({
  NextRequest: class {
    public url: string;
    public method: string;
    private body: string;

    constructor(url: string, init: { method: string; body: string }) {
      this.url = url;
      this.method = init.method;
      this.body = init.body;
    }

    async json() {
      return JSON.parse(this.body);
    }
  },
  NextResponse: {
    json: vi.fn((body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

// Mock external dependencies before importing the route
vi.mock("@mozilla/readability", () => ({
  Readability: vi.fn().mockImplementation(function() {
    return {
      parse: vi.fn().mockReturnValue({
        title: "Test Article",
        content: "<h1>Test Article</h1><p>Test content</p>",
        excerpt: "Test excerpt",
        byline: "Test Author"
      })
    };
  })
}));

vi.mock("jsdom", () => ({
  JSDOM: vi.fn().mockImplementation(function() {
    return {
      window: {
        document: {
          documentElement: {}
        }
      }
    };
  })
}));

vi.mock("turndown", () => ({
  default: vi.fn().mockImplementation(function() {
    return {
      turndown: vi.fn().mockReturnValue("# Test Article\n\nTest content")
    };
  })
}));

describe("POST /api/convert - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process env
    process.env.ALLOW_UNSAFE_SSL = "false";
  });

  it("returns markdown for valid URL", async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "<html><body><h1>Test</h1></body></html>"
    }) as any;

    // Import the route after mocks are set up
    const { POST } = await import("@/app/api/convert/route");

    const MockRequest = (await import("next/server")).NextRequest as any;
    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/article" })
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.markdown).toBeTruthy();
    expect(data.meta).toBeTruthy();
    expect(data.meta.url).toBe("https://example.com/article");
    expect(data.meta.wordCount).toBeGreaterThan(0);
  });

  it("returns 400 for invalid URL", async () => {
    const { POST } = await import("@/app/api/convert/route");
    const MockRequest = (await import("next/server")).NextRequest as any;

    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-valid-url" })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 for missing URL field", async () => {
    const { POST } = await import("@/app/api/convert/route");
    const MockRequest = (await import("next/server")).NextRequest as any;

    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({})
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("url");
  });

  it("returns 408 when request times out", async () => {
    // Mock fetch that throws AbortError
    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error("Timeout");
      (error as any).name = "AbortError";
      throw error;
    }) as any;

    const { POST } = await import("@/app/api/convert/route");
    const MockRequest = (await import("next/server")).NextRequest as any;

    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/article" })
    });

    const response = await POST(request);

    expect(response.status).toBe(408);

    const data = await response.json();
    expect(data.error).toContain("timeout");
  });

  it("returns 404 when no extractable content found", async () => {
    // Mock Readability to return null content
    const { Readability } = await import("@mozilla/readability");
    (Readability as any).mockImplementation(function() {
      return {
        parse: vi.fn().mockReturnValue(null)
      };
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "<html><body></body></html>"
    }) as any;

    const { POST } = await import("@/app/api/convert/route");
    const MockRequest = (await import("next/server")).NextRequest as any;

    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/empty" })
    });

    const response = await POST(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain("No extractable content");
  });

  it("returns fetch status code when URL returns error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "<html><body>Not found</body></html>"
    }) as any;

    const { POST } = await import("@/app/api/convert/route");
    const MockRequest = (await import("next/server")).NextRequest as any;

    const request = new MockRequest("http://localhost:3000/api/convert", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/notfound" })
    });

    const response = await POST(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain("404");
  });
});
