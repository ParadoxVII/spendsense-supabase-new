import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Define a simplified type for the Supabase client, focusing on auth
type SimplifiedSupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null } | { data: { user: any }; error: any }>
    getSession: () => Promise<{ data: { session: null }; error: null } | { data: { session: any }; error: any }>
  }
}

export async function createClient(): Promise<SimplifiedSupabaseClient> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client for server components.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    }
  }

  const cookieStore = await cookies()

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
        }
      },
    },
  }) as unknown as SimplifiedSupabaseClient
}

// Type guard to check if the client is a full SupabaseClient
import type { SupabaseClient } from "@supabase/supabase-js"
export function isFullSupabaseClient(client: SimplifiedSupabaseClient | SupabaseClient): client is SupabaseClient {
  return typeof (client as SupabaseClient).from === "function"
}
