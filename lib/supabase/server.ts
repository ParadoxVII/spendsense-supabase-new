import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Define a simplified type for the Supabase client, focusing on auth
// This helps in creating a dummy client if Supabase is not configured.
type SimplifiedSupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null } | { data: { user: any }; error: any }>
    getSession: () => Promise<{ data: { session: null }; error: null } | { data: { session: any }; error: any }>
  }
  // Add other methods/properties if your dummy client or general usage needs them
  // For example, if you use .from() directly on the client:
  // from: (table: string) => any;
}

export const createClient = cache((): SimplifiedSupabaseClient => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client for server components.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      // from: (_table: string) => ({ // Example if you need .from()
      //   select: () => Promise.resolve({ data: [], error: null }),
      //   // ... other chainable methods
      // })
    } as SimplifiedSupabaseClient // Cast to ensure type compatibility
  }

  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          // console.warn(`(Server Component) Failed to set cookie '${name}':`, error); // Optional: for debugging
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // As per Supabase SSR docs for server-side client:
          // Use `set` with an empty value and appropriate options to remove a cookie.
          cookieStore.set(name, "", options)
        } catch (error) {
          // The `remove` (via set) method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          // console.warn(`(Server Component) Failed to remove cookie '${name}':`, error); // Optional: for debugging
        }
      },
    },
  }) as unknown as SimplifiedSupabaseClient // Cast because createServerClient returns a full SupabaseClient
})

// Type guard to check if the client is a full SupabaseClient
import type { SupabaseClient } from "@supabase/supabase-js"
export function isFullSupabaseClient(client: SimplifiedSupabaseClient | SupabaseClient): client is SupabaseClient {
  return typeof (client as SupabaseClient).from === "function"
}
