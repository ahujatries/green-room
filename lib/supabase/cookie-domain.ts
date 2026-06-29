// Shared-session cookie scoping for the Arqo ecosystem.
//
// Green Room (greenroom.tryarqo.com) and Arqo (app.tryarqo.com) share ONE
// Supabase project AND the same parent domain. Arqo writes its Supabase auth
// cookie scoped to `.tryarqo.com`, and because both apps point at the same
// Supabase URL the default cookie NAME is identical. So if Green Room reads and
// writes that SAME `.tryarqo.com`-scoped cookie, a user already signed into
// Arqo is silently authenticated here — that is the entire "Log in with Arqo"
// mechanism. No token handoff, no extra OAuth provider.
//
// The catch: a browser only accepts a `Domain=.tryarqo.com` Set-Cookie when the
// request host is actually under `tryarqo.com`. On localhost, *.vercel.app, or
// any other dev/preview host it would be rejected — so there we return
// `undefined` and let the cookie stay host-only (the default).

const ROOT = ".tryarqo.com";

/**
 * Resolve the cookie `domain` to use for the Supabase auth cookies given the
 * request host.
 *
 * @param host - The request host (may include a port), e.g. from
 *   `request.headers.get("host")`, the `host` header in `next/headers`, or
 *   `window.location.hostname`.
 * @returns `.tryarqo.com` when the host is `tryarqo.com` or any subdomain of
 *   it (so the cookie is shared with Arqo), otherwise `undefined` (host-only).
 */
export function getCookieDomain(host?: string | null): string | undefined {
  if (!host) return undefined;
  const hostname = host.split(":")[0]?.toLowerCase().trim();
  if (!hostname) return undefined;
  if (hostname === "tryarqo.com" || hostname.endsWith(ROOT)) return ROOT;
  return undefined;
}
