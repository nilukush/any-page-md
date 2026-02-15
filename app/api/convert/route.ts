import { NextRequest, NextResponse } from "next/server";
import { validateUrl, ValidationError } from "@/lib/validator";
import { extractMainContent } from "@/lib/extractor";
import { htmlToMarkdown } from "@/lib/converter";
import https from "https";
import http from "http";

export const runtime = "nodejs";

async function fetchWithCustomAgent(url: string, timeout: number = 30000): Promise<Response> {
  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === "https:";
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method: "GET",
      headers: {
        "User-Agent": "PageMD/1.0",
      },
      // @ts-ignore - Agent options
      rejectUnauthorized: false, // Ignore SSL certificate errors
      timeout,
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        const response = new Response(data, {
          status: res.statusCode,
          statusText: res.statusMessage || "",
        });
        resolve(response);
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

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

    // Fetch webpage with custom agent that ignores SSL errors
    const fetchResponse = await fetchWithCustomAgent(url, 30000);

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
    if (error instanceof Error && (error.message?.includes("timeout") || error.message?.includes("abort"))) {
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
