export interface Bank {
  id: string // Now UUID
  user_id: string
  bank_type: string // The bank identifier (chase, bofa, etc.)
  name: string
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
