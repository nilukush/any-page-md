import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("[PageMD] ===== REQUEST START =====");
  console.log("[PageMD] Method:", request.method);
  console.log("[PageMD] URL:", request.url);
  try {
    console.log("[PageMD] Request received");

    // Parse request body
    const body = await request.json().catch(() => null) as { url?: string } | null;
    if (!body || !body.url) {
      console.log("[PageMD] Missing URL in request body");
      return NextResponse.json(
        { error: "Request body must contain 'url' field" },
        { status: 400 }
      );
    }

    console.log("[PageMD] URL received:", body.url);

    // Simple URL validation
    let url: URL;
    try {
      url = new URL(body.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      console.log("[PageMD] URL validation failed");
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    console.log("[PageMD] Fetching URL:", url.href);

    // SSL flag - disabled by default, only enabled in development with explicit flag
    const ALLOW_UNSAFE_SSL = process.env.ALLOW_UNSAFE_SSL === "true";

    // Fetch webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let fetchResponse: Response;
    try {
      if (ALLOW_UNSAFE_SSL) {
        // Development mode: Allow self-signed certificates
        console.warn("[PageMD] WARNING: SSL verification disabled - development only");
        const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        try {
          fetchResponse = await fetch(url.href, {
            method: "GET",
            headers: {
              "User-Agent": "PageMD/1.0",
            },
            signal: controller.signal,
          });
        } finally {
          // Restore original setting
          if (originalRejectUnauthorized !== undefined) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
          } else {
            delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          }
        }
      } else {
        // Production mode: Normal secure fetch
        fetchResponse = await fetch(url.href, {
          method: "GET",
          headers: {
            "User-Agent": "PageMD/1.0",
          },
          signal: controller.signal,
        });
      }
      console.log("[PageMD] Fetch response status:", fetchResponse.status, fetchResponse.statusText);
    } catch (fetchError) {
      console.log("[PageMD] Fetch error:", fetchError);
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!fetchResponse.ok) {
      console.log("[PageMD] Fetch failed:", fetchResponse.status, fetchResponse.statusText);
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` },
        { status: fetchResponse.status }
      );
    }

    // Get HTML content
    const html = await fetchResponse.text();
    console.log("[PageMD] HTML received, length:", html.length);

    // Lazy load dependencies (inside the function to avoid module-level import issues)
    console.log("[PageMD] Loading dependencies...");
    const { Readability } = await import("@mozilla/readability");
    const { JSDOM } = await import("jsdom");
    const TurndownService = (await import("turndown")).default;

    // Extract main content using Mozilla Readability
    console.log("[PageMD] Extracting main content...");
    const dom = new JSDOM(html, { url: url.href });
    const doc = dom.window.document;
    const article = new Readability(doc);
    const result = article.parse();
    const mainContent = result?.content || "";
    console.log("[PageMD] Extracted content length:", mainContent.length);

    if (!mainContent) {
      console.log("[PageMD] No extractable content found");
      return NextResponse.json(
        { error: "No extractable content found on page" },
        { status: 404 }
      );
    }

    // Convert to markdown using Turndown
    console.log("[PageMD] Converting to markdown...");
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(mainContent);
    console.log("[PageMD] Markdown length:", markdown.length);

    // Calculate word count
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;

    // Return response
    const response = {
      markdown,
      meta: {
        title: result?.title || new URL(url.href).pathname,
        url: url.href,
        wordCount,
        excerpt: result?.excerpt || "",
        byline: result?.byline || "",
        extractionTime: new Date().toISOString(),
      },
    };
    console.log("[PageMD] Sending successful response");
    return NextResponse.json(response);

  } catch (error) {
    // Handle errors
    console.error("[PageMD] ERROR:", error);

    if (error instanceof Error) {
      console.error("[PageMD] Error name:", error.name);
      console.error("[PageMD] Error message:", error.message);
      console.error("[PageMD] Error stack:", error.stack);
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - URL took too long to respond" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
