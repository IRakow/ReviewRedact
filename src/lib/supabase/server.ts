import { createClient } from "@supabase/supabase-js"

// Service role client — bypasses RLS, used for all server-side DB operations.
// We use custom PIN auth (not Supabase Auth), so all access control
// is enforced at the application layer via session cookies.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
