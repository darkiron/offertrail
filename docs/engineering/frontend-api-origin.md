# Frontend API origin policy

The deployed browser bundle must keep `VITE_API_URL` empty. Frontend requests
therefore target the current origin in production and preview environments.
`frontend/vercel.json` forwards the explicit API path allowlist to the canonical
OfferTrail API before applying the SPA fallback.

This prevents preview URLs from requiring dynamic CSP interpolation: the
browser only connects to its own origin and Supabase, while Vercel performs the
server-side API forwarding. Adding an API route requires updating both the Vite
development proxy and the Vercel allowlist, with the security policy tests kept
green. A staging backend must use a separate Vercel project/configuration; it
must not be injected as an arbitrary browser-visible origin.

The only inline script-like content is static JSON-LD. Its exact SHA-256 is in
the CSP and recomputed by `tests/security-policy.test.ts`. Any content change
therefore fails tests until the deliberate new hash is reviewed.
