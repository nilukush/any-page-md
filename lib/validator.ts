export enum ValidationError {
  EMPTY_URL = "URL cannot be empty",
  INVALID_PROTOCOL = "URL must use HTTP or HTTPS protocol",
  INVALID_URL = "URL format is invalid",
}

export interface ValidationResult {
  success: true;
  url: string;
}

export interface ValidationFailure {
  success: false;
  error: ValidationError;
}

export type ValidateUrlResult = ValidationResult | ValidationFailure;

export function validateUrl(input: string): ValidateUrlResult {
  // Check empty
  if (!input || input.trim() === "") {
    return { success: false, error: ValidationError.EMPTY_URL };
  }

  // Trim whitespace
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);

    // Check protocol
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { success: false, error: ValidationError.INVALID_PROTOCOL };
    }

    return { success: true, url: url.href };
  } catch {
    return { success: false, error: ValidationError.INVALID_URL };
  }
}
