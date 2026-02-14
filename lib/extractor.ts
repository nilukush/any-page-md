import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export function extractMainContent(html: string): string {
  // Handle empty input
  if (!html || html.trim() === "") {
    return "";
  }

  try {
    // Parse HTML to a document using jsdom
    const dom = new JSDOM(html, {
      url: "about:blank",
    });
    const doc = dom.window.document;

    // Create a Readability instance with the parsed document
    const article = new Readability(doc);
    const result = article.parse();

    // Return the article content HTML
    if (result && result.content) {
      return result.content;
    }
    return "";
  } catch (error) {
    // If parsing fails, return empty string
    console.error("Failed to parse HTML:", error);
    return "";
  }
}
