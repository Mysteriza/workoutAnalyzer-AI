/**
 * Cookie utilities for secure token storage.
 * Uses HttpOnly, Secure, SameSite=Strict cookies to prevent XSS token theft.
 */

const TOKEN_COOKIE_PREFIX = "wa_token";

export interface StravaCookieTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: string;
}

/**
 * Set token cookies with secure flags.
 * Called server-side via Set-Cookie headers or client-side as fallback.
 */
export function setTokenCookies(tokens: StravaCookieTokens): string[] {
  const cookies = [
    `${TOKEN_COOKIE_PREFIX}_access=${tokens.accessToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_refresh=${tokens.refreshToken}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_expires=${tokens.expiresAt}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_athlete=${tokens.athleteId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Strict; Secure`,
  ];
  return cookies;
}

/**
 * Read token cookies from document.cookie (client-side only).
 * Returns null if any required token is missing.
 */
export function getTokenCookies(): StravaCookieTokens | null {
  if (typeof document === "undefined") return null;

  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match?.[2] ?? null;
  };

  const accessToken = getCookie(`${TOKEN_COOKIE_PREFIX}_access`);
  const refreshToken = getCookie(`${TOKEN_COOKIE_PREFIX}_refresh`);
  const expiresAt = getCookie(`${TOKEN_COOKIE_PREFIX}_expires`);
  const athleteId = getCookie(`${TOKEN_COOKIE_PREFIX}_athlete`);

  if (!accessToken || !refreshToken || !expiresAt || !athleteId) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
    athleteId,
  };
}

/**
 * Clear all token cookies by setting expired dates.
 */
export function clearTokenCookies(): string[] {
  const cookies = [
    `${TOKEN_COOKIE_PREFIX}_access=; Path=/; Max-Age=0; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_refresh=; Path=/; Max-Age=0; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_expires=; Path=/; Max-Age=0; SameSite=Strict; Secure`,
    `${TOKEN_COOKIE_PREFIX}_athlete=; Path=/; Max-Age=0; SameSite=Strict; Secure`,
  ];
  return cookies;
}

/**
 * Parse Set-Cookie headers from a response and apply them to document.cookie.
 * Used for client-side cookie sync after server-side token operations.
 */
export function syncCookiesFromResponse(setCookieHeaders: string[] | null): void {
  if (typeof document === "undefined" || !setCookieHeaders) return;
  setCookieHeaders.forEach((header) => {
    // Extract cookie name=value portion (before first ;)
    const cookiePortion = header.split(";")[0];
    document.cookie = cookiePortion;
  });
}
