"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Bank, Statement } from "./db-types"
import { createClient } from "./supabase/server"

// Add a new bank account for the current user
export async function addBank(prevState: any, formData: FormData) {
  const bankType = formData.get("bank_type") as string
  const accountName = formData.get("account_name") as string
  const bankLogo = formData.get("logo") as string

  if (!bankType || !accountName) {
    return { error: "Bank type and account name are required" }
  }

  // Validate account name length
  if (accountName.length > 25) {
    return { error: "Account name must be 25 characters or less" }
  }

  const cookieStore = cookies()
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Insert the bank account (UUID will be auto-generated)
  const { error } = await supabase.from("banks").insert({
    user_id: user.id,
    bank_type: bankType,
    account_name: accountName,
    logo: bankLogo || "default",
  })

  if (error) {
    console.error("Error adding bank account:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Update bank account name
export async function updateBankAccountName(prevState: any, formData: FormData) {
  const bankId = formData.get("bank_id") as string
  const accountName = formData.get("account_name") as string

  if (!bankId || !accountName) {
    return { error: "Bank ID and account name are required" }
  }

  // Validate account name length
  if (accountName.length > 25) {
    return { error: "Account name must be 25 characters or less" }
  }

  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Update the bank account name
  const { error } = await supabase
    .from("banks")
    .update({ account_name: accountName })
    .eq("id", bankId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating account name:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Get all bank accounts for the current user
export async function getBanks() {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all bank accounts for this user
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bank accounts:", error)
    return []
  }

  return data as Bank[]
}

// Delete a bank account and all its statements
export async function deleteBank(bankId: string) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Verify the bank account belongs to the user
  const { data: bank } = await supabase.from("banks").select("id").eq("id", bankId).eq("user_id", user.id).single()

  if (!bank) {
    return { error: "Bank account not found or access denied" }
  }

  // Delete the bank account (statements will be deleted automatically due to CASCADE)
  const { error } = await supabase.from("banks").delete().eq("id", bankId)

  if (error) {
    console.error("Error deleting bank account:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Delete multiple bank accounts
export async function deleteBanks(bankIds: string[]) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Delete the bank accounts (statements will be deleted automatically due to CASCADE)
  const { error } = await supabase.from("banks").delete().in("id", bankIds).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting bank accounts:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Add a new statement for a bank account
export async function addStatement(prevState: any, formData: FormData) {
  const bankId = formData.get("bank_id") as string
  const statementName = formData.get("name") as string
  const filePath = formData.get("file_path") as string

  if (!bankId || !statementName || !filePath) {
    return { error: "Bank ID, statement name, and file path are required" }
  }

  const supabase = await createClient()

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

// Get all statements for a bank account
export async function getStatements(bankId: string) {
  const supabase = await createClient()

  // Get all statements for this bank account
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

// Delete a statement
export async function deleteStatement(statementId: string) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Verify the statement belongs to the user (through bank ownership)
  const { data: statement } = await supabase
    .from("statements")
    .select(`
      id,
      file_path,
      banks!inner (
        user_id
      )
    `)
    .eq("id", statementId)
    .eq("banks.user_id", user.id)
    .single()

  if (!statement) {
    return { error: "Statement not found or access denied" }
  }

  // Delete the file from storage
  if (statement.file_path) {
    await supabase.storage.from("statements").remove([statement.file_path])
  }

  // Delete the statement record
  const { error } = await supabase.from("statements").delete().eq("id", statementId)

  if (error) {
    console.error("Error deleting statement:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Delete multiple statements
export async function deleteStatements(statementIds: string[]) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Get statements with file paths for cleanup
  const { data: statements } = await supabase
    .from("statements")
    .select(`
      id,
      file_path,
      banks!inner (
        user_id
      )
    `)
    .in("id", statementIds)
    .eq("banks.user_id", user.id)

  if (!statements || statements.length === 0) {
    return { error: "No statements found or access denied" }
  }

  // Delete files from storage
  const filePaths = statements.map((s) => s.file_path).filter(Boolean)
  if (filePaths.length > 0) {
    await supabase.storage.from("statements").remove(filePaths)
  }

  // Delete the statement records
  const { error } = await supabase.from("statements").delete().in("id", statementIds)

  if (error) {
    console.error("Error deleting statements:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Upload a file to Supabase Storage
export async function uploadStatementFile(file: File, userId: string, bankId: string) {
  const supabase = await createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/${bankId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage.from("statements").upload(fileName, file)

  if (error) {
    console.error("Error uploading file:", error)
    return { error: error.message }
  }

  return { filePath: data.path }
}
