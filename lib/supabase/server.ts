import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs"
import { cookies, type ReadonlyRequestCookies } from "next/headers" // Import ReadonlyRequestCookies
import { cache } from "react"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Define a type for the dummy client to be compatible with SupabaseClient for auth methods
// This is a simplified version focusing on what's used.
type DummyAuth = {
  getUser: () => Promise<{ data: { user: null }; error: null }>
  getSession: () => Promise<{ data: { session: null }; error: null }>
}

// Create a cached version of the Supabase client for Server Components
export const createClient = cache((): SupabaseClient | { auth: DummyAuth } => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client for server components.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    }
  }

  // Call cookies() inside the cache callback
  const cookieStore: ReadonlyRequestCookies = cookies()

  // Pass a function that returns the captured cookieStore
  return createServerComponentClient({
    cookies: () => cookieStore,
  })
})
