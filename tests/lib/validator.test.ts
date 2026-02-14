import { describe, it, expect } from "vitest";
import { validateUrl, ValidationError } from "../../lib/validator";

describe("validateUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    const result = validateUrl("https://example.com/article");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toBe("https://example.com/article");
    }
  });

  it("accepts valid HTTP URLs", () => {
    const result = validateUrl("http://example.com/article");
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = validateUrl("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.EMPTY_URL);
    }
  });

  it("rejects invalid protocol", () => {
    const result = validateUrl("ftp://example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.INVALID_PROTOCOL);
    }
  });

  it("rejects malformed URL", () => {
    const result = validateUrl("not-a-url");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ValidationError.INVALID_URL);
    }
  });
});
