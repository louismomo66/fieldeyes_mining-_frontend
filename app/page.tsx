import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_HINT_COOKIE } from "@/lib/session-hint"

// Server-side redirect. This route ships no client JavaScript, so opening "/"
// no longer has to compile and boot a client page, mount AuthProvider and wait
// on a getProfile() round-trip before it knows where to send you.
//
// The cookie is only a hint (see lib/session-hint.ts). If it is stale, the
// destination page's own auth guard bounces the user back to /login.
export default async function HomePage() {
  const cookieStore = await cookies()
  const hasSession = cookieStore.get(SESSION_HINT_COOKIE)?.value === "1"

  redirect(hasSession ? "/dashboard" : "/login")
}
