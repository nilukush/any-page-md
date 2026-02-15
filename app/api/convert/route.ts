import { NextRequest, NextResponse } from "next/server";
import { validateUrl, ValidationError } from "@/lib/validator";
import { extractMainContent } from "@/lib/extractor";
import { htmlToMarkdown } from "@/lib/converter";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json().catch(() => null) as { url?: string } | null;
    if (!body || !body.url) {
      return NextResponse.json(
        { error: "Request body must contain 'url' field" },
        { status: 400 }
      );
    }

    // Validate URL
    const validationResult = validateUrl(body.url);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const url = validationResult.url;

    // Fetch webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let fetchResponse: Response;
    try {
      // Temporarily disable SSL verification for this fetch
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      const originalNoCheck = process.env.NODE_EXTRA_CA_CERTS;

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
      } finally {
        // Restore original values
        if (originalRejectUnauthorized !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }

        if (originalNoCheck !== undefined) {
          process.env.NODE_EXTRA_CA_CERTS = originalNoCheck;
        } else {
          delete process.env.NODE_EXTRA_CA_CERTS;
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` },
        { status: fetchResponse.status }
      );
    }

    // Get HTML content
    const html = await fetchResponse.text();

    // Extract main content
    const mainContent = extractMainContent(html);
    if (!mainContent) {
      return NextResponse.json(
        { error: "No extractable content found on page" },
        { status: 404 }
      );
    }

    // Convert to markdown
    const markdown = htmlToMarkdown(mainContent);

    // Calculate word count
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;

    // Return response
    return NextResponse.json({
      markdown,
      meta: {
        title: new URL(url).pathname,
        url,
        wordCount,
        extractionTime: new Date().toISOString(),
      },
    });

  } catch (error) {
    // Handle errors
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - URL took too long to respond" },
        { status: 408 }
      );
    }

    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
