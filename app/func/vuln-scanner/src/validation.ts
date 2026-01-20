import type { ValidationResult } from "./types.js";

// CVE-ID pattern: CVE-YYYY-NNNNN (4+ digits for sequence number)
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

// npm package name pattern (scoped and unscoped)
const PACKAGE_PATTERN =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export const validateInput = (input: string): ValidationResult => {
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: "invalid", value: null };
  }

  if (CVE_PATTERN.test(trimmed)) {
    return { type: "cve", value: trimmed.toUpperCase() };
  }

  if (PACKAGE_PATTERN.test(trimmed)) {
    return { type: "package", value: trimmed.toLowerCase() };
  }

  return { type: "invalid", value: null };
};
