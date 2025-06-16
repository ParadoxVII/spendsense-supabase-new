"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Bank, Statement } from "./db-types"

// Add a new bank for the current user
export async function addBank(prevState: any, formData: FormData) {
  const bankType = formData.get("bank_type") as string // Changed from "id" to "bank_type"
  const bankName = formData.get("name") as string
  const bankLogo = formData.get("logo") as string

  if (!bankType || !bankName) {
    return { error: "Bank type and name are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Check if user already has this bank type
  const { data: existingBank } = await supabase
    .from("banks")
    .select("id")
    .eq("user_id", user.id)
    .eq("bank_type", bankType)
    .single()

  if (existingBank) {
    return { error: "You have already added this bank" }
  }

  // Insert the bank (UUID will be auto-generated)
  const { error } = await supabase.from("banks").insert({
    user_id: user.id,
    bank_type: bankType,
    name: bankName,
    logo: bankLogo || "default",
  })

  if (error) {
    console.error("Error adding bank:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Get all banks for the current user
export async function getBanks() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all banks for this user
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching banks:", error)
    return []
  }

  return data as Bank[]
}

// Add a new statement for a bank
export async function addStatement(prevState: any, formData: FormData) {
  const bankId = formData.get("bank_id") as string
  const statementName = formData.get("name") as string
  const filePath = formData.get("file_path") as string

  if (!bankId || !statementName || !filePath) {
    return { error: "Bank ID, statement name, and file path are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Insert the statement
  const { error } = await supabase.from("statements").insert({
    bank_id: bankId,
    name: statementName,
    file_path: filePath,
    processed: false,
  })

  if (error) {
    console.error("Error adding statement:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Get all statements for a bank
export async function getStatements(bankId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Get all statements for this bank
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("bank_id", bankId)
    .order("upload_date", { ascending: false })

  if (error) {
    console.error("Error fetching statements:", error)
    return []
  }

  return data as Statement[]
}

// Upload a file to Supabase Storage
export async function uploadStatementFile(file: File, userId: string, bankId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/${bankId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage.from("statements").upload(fileName, file)

  if (error) {
    console.error("Error uploading file:", error)
    return { error: error.message }
  }

  return { filePath: data.path }
}
