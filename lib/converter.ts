// @ts-ignore - turndown doesn't have proper types
const turndownModule = require("turndown") as any;
// Next.js wraps CommonJS modules with a default property
const TurndownService = turndownModule.default || turndownModule;

export function htmlToMarkdown(html: string): string {
  // Handle empty input
  if (!html || html.trim() === "") {
    return "";
  }

  try {
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    return turndownService.turndown(html);
  } catch (error) {
    console.error("Failed to convert to markdown:", error);
    return "";
  }
}
