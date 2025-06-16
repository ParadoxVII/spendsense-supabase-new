-- Drop the existing banks table and recreate with proper schema
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS banks CASCADE;

-- Create banks table with UUID primary key
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_type TEXT NOT NULL, -- This stores the bank identifier (chase, bofa, etc.)
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add a unique constraint on user_id + bank_type to prevent duplicate banks per user
  UNIQUE(user_id, bank_type)
);

-- Add RLS policies for banks table
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own banks" 
  ON banks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banks" 
  ON banks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks" 
  ON banks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks" 
  ON banks FOR DELETE 
  USING (auth.uid() = user_id);

-- Create statements table
CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Add RLS policies for statements table
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own statements" 
  ON statements FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM banks 
      WHERE banks.id = statements.bank_id 
      AND banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own statements" 
  ON statements FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM banks 
      WHERE banks.id = statements.bank_id 
      AND banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own statements" 
  ON statements FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM banks 
      WHERE banks.id = statements.bank_id 
      AND banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own statements" 
  ON statements FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM banks 
      WHERE banks.id = statements.bank_id 
      AND banks.user_id = auth.uid()
    )
  );

-- Create storage bucket for statements (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', false)
ON CONFLICT DO NOTHING;

-- Set up RLS for storage
DROP POLICY IF EXISTS "Users can upload their own statements" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own statements" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own statements" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own statements" ON storage.objects;

CREATE POLICY "Users can upload their own statements" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own statements" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own statements" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own statements" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);
