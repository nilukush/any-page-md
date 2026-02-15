import { NextRequest, NextResponse } from "next/server";
import { validateUrl, ValidationError } from "@/lib/validator";
import { extractMainContent } from "@/lib/extractor";
import { htmlToMarkdown } from "@/lib/converter";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Validate URL
    const validationResult = validateUrl(body.url);
    if (!validationResult.success) {
      console.log("[PageMD] URL validation failed:", validationResult.error);
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const url = validationResult.url;
    console.log("[PageMD] Fetching URL:", url);

    // Fetch webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let fetchResponse: Response;
    try {
      // Temporarily disable SSL verification for this fetch
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

      // Allow self-signed certificates
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

      try {
        fetchResponse = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "PageMD/1.0",
          },
          signal: controller.signal,
        });
        console.log("[PageMD] Fetch response status:", fetchResponse.status, fetchResponse.statusText);
      } finally {
        // Restore original values
        if (originalRejectUnauthorized !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }
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

    // Extract main content
    console.log("[PageMD] Extracting main content...");
    const mainContent = extractMainContent(html);
    console.log("[PageMD] Extracted content length:", mainContent.length);

    if (!mainContent) {
      console.log("[PageMD] No extractable content found");
      return NextResponse.json(
        { error: "No extractable content found on page" },
        { status: 404 }
      );
    }

    // Convert to markdown
    console.log("[PageMD] Converting to markdown...");
    const markdown = htmlToMarkdown(mainContent);
    console.log("[PageMD] Markdown length:", markdown.length);

    // Calculate word count
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;

    // Return response
    const response = {
      markdown,
      meta: {
        title: new URL(url).pathname,
        url,
        wordCount,
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
