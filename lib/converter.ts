import TurndownService from "turndown";

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
