import { createClient } from "@supabase/supabase-js"

// Browser client — uses anon key, for any client-side reads if needed.
// Most operations go through server actions using the service role client.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, key)
}
