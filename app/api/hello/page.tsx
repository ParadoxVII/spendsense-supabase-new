import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

export default async function HelloPage() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 ">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Check if user is already logged in
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: { name: 'Functions' },
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {error ? (
        <p>Error: {error.message}</p>
      ) : (
        <p>{data.message}</p>
      )}
    </div>
  )
}
