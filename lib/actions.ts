"use server"

import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

// Update the signIn function to handle redirects properly
export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Return success instead of redirecting directly
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update the signUp function to handle potential null formData
export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Development bypass for authentication
export async function devBypass() {
  // Allow in development, staging, and production environments
  const allowedEnvs = ["development", "staging", "production"]
  const currentEnv = process.env.NODE_ENV || "development"

  if (!allowedEnvs.includes(currentEnv)) {
    console.error("Dev bypass not allowed in this environment")
    redirect("/auth/login")
  }

  const supabase = await createClient()

  try {
    // Create a custom session token for development
    const { data, error } = await supabase.auth.signInWithPassword({
      // Use a predefined dev account or create a session directly
      email: "dev@example.com",
      password: "devpassword123",
    })

    if (error) {
      // If the dev account doesn't exist, create it
      const { error: signUpError } = await supabase.auth.signUp({
        email: "dev@example.com",
        password: "devpassword123",
        options: {
          data: {
            name: "Development User",
            role: "developer",
          },
        },
      })

      if (signUpError) {
        console.error("Dev bypass error:", signUpError)
        redirect("/auth/login")
      }

      // Try signing in again after creating the account
      await supabase.auth.signInWithPassword({
        email: "dev@example.com",
        password: "devpassword123",
      })
    }

    // Redirect to dashboard
    redirect("/dashboard")
  } catch (error) {
    console.error("Dev bypass error:", error)
    redirect("/auth/login")
  }
}
