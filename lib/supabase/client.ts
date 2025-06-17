import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export const isSupabaseConfiguredClient =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Define a simplified type for the Supabase client for the dummy client
type SimplifiedBrowserClient = {
  auth: {
    onAuthStateChange: (callback: (event: string, session: any | null) => void) => {
      data: { subscription: { unsubscribe: () => void } }
    }
    // Add other auth methods if your dummy client needs them
  }
  // from: (table: string) => any; // Example
}

let supabaseInstance: SimplifiedBrowserClient | null = null

export function getSupabaseBrowserClient(): SimplifiedBrowserClient {
  if (!isSupabaseConfiguredClient) {
    if (!supabaseInstance) {
      console.warn("Supabase environment variables are not set on the client. Using dummy client.")
      supabaseInstance = {
        auth: {
          onAuthStateChange: (_callback: (event: string, session: any | null) => void) => {
            return { data: { subscription: { unsubscribe: () => {} } } }
          },
        },
        // from: (_table: string) => ({ // Example
        //   select: () => Promise.resolve({ data: [], error: null }),
        // })
      }
    }
    return supabaseInstance
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseInstance
}

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient()
