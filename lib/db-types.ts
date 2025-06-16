export interface Bank {
  id: string
  user_id: string
  name: string
  logo: string
  created_at: string
}

export interface Statement {
  id: string
  bank_id: string
  name: string
  file_path: string
  upload_date: string
  processed: boolean
}
