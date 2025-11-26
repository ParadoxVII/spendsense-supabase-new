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
  raw_text?: string
}

// A single parsed transaction entry coming from statement parsing
export interface ParsedEntry {
  date: string
  value: number
  is_expense: boolean
  description: string
}

// Grouped parsed entries for a single statement row
export interface ParsedStatementGroup {
  statement_id: string
  statement_name: string
  bank_id: string
  parsed: ParsedEntry[] | null
}
