/**
 * Lightweight "is someone probably logged in?" hint stored in a cookie.
 *
 * The real credential stays in localStorage ("auth_token") and is still the only
 * thing the API trusts — this cookie carries no secret. Its sole job is to let the
 * server component at `/` redirect straight to /dashboard or /login without first
 * booting React, mounting AuthProvider and waiting on a getProfile() round-trip.
 *
 * A stale hint is harmless: every protected page still guards on the real auth
 * state and bounces to /login if the token turns out to be invalid.
 */
export const SESSION_HINT_COOKIE = "has_session"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export function setSessionHint() {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`
}

export function clearSessionHint() {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; samesite=lax`
}
