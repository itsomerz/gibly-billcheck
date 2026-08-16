import { createHash } from "crypto";

// Shared beta password (BETA_PASSWORD) gates the whole app via src/proxy.js.
// The cookie stores a hash of the password rather than the password itself,
// so inspecting the cookie doesn't reveal the shared secret.
export const BETA_AUTH_COOKIE = "gibly_beta_auth";

export function betaAuthToken(password) {
  return createHash("sha256").update(password).digest("hex");
}

// Only allow redirecting back to a same-site path — never an absolute URL —
// so the "from" param can't be used as an open redirect.
export function safeRedirectPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
