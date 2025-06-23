export interface Bank {
  id: string // UUID
  user_id: string
  bank_type: string // The bank identifier (chase, bofa, etc.)
  account_name: string // User-defined account name (max 25 chars)
  logo: string
  created_at: string
}

export interface Statement {
  id: string
  bank_id: string // References banks.id (UUID)
  name: string
  file_path: string
  upload_date: string
  processed: boolean
}
