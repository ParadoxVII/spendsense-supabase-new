import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Define a type for the dummy client to match SupabaseClient structure for auth methods
// This helps ensure type safety if Supabase is not configured.
type DummySupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>
    getSession: () => Promise<{ data: { session: null }; error: null }>
  }
  // Add other methods here if your dummy client needs to mock them,
  // or ensure this type is compatible with SupabaseClient where used.
}

// Create a cached version of the Supabase client for Server Components
export const createClient = cache((): SupabaseClient | DummySupabaseClient => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client for server components.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    }
  }

  // Pass the `cookies` function directly from `next/headers`.
  // `createServerComponentClient` is designed to work with this.
  return createServerComponentClient({ cookies })
})
