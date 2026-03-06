/**
 * Session cookie — persists firstName for 7 days so returning
 * users can be recognised by name without re-entering it.
 *
 * Phone number is NOT stored — users always verify their number
 * for security. Only the name is pre-filled from the cookie.
 * Full profile state lives in userProfileStore / localStorage.
 */

const COOKIE_NAME = 'acko_session';
const TTL_DAYS = 7;

export interface SessionCookie {
  firstName: string;
}

/** Read and parse the session cookie. Returns null if absent or malformed. */
export function readSessionCookie(): SessionCookie | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    const parsed = JSON.parse(raw) as SessionCookie;
    if (parsed.firstName) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Write (or refresh) the session cookie with a fresh 7-day TTL. */
export function writeSessionCookie(data: SessionCookie): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + TTL_DAYS);
  const value = encodeURIComponent(JSON.stringify({ firstName: data.firstName }));
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/** Clear the session cookie (on logout or "Not me" tap). */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}
