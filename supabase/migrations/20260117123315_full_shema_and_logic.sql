-- 1. Create the Banks table
CREATE TABLE IF NOT EXISTS public.banks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_type text NOT NULL, -- e.g., 'Chase'
  name text NOT NULL,
  logo text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT banks_pkey PRIMARY KEY (id),
  CONSTRAINT banks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 2. Create the Statements table with the reconciliation columns
CREATE TABLE IF NOT EXISTS public.statements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_id uuid NOT NULL,
  name text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  raw_text text,
  parsed_text jsonb,
  initial_balance numeric,
  final_balance numeric,
  passes_check boolean,
  CONSTRAINT statements_pkey PRIMARY KEY (id),
  CONSTRAINT statements_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES banks (id) ON DELETE CASCADE,
  CONSTRAINT statements_raw_text_check CHECK (length(raw_text) <= 1000000)
);

-- 3. Create the Bank Definition Registry (for the Router)
CREATE TABLE IF NOT EXISTS public.bank_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name text UNIQUE NOT NULL,
    parser_function_name text NOT NULL
);

-- 4. Insert the Chase V2 Parser Logic
CREATE OR REPLACE FUNCTION public.fn_parse_chase_v2(raw_text text)
RETURNS jsonb AS $$
DECLARE
  extracted_txns jsonb;
  initial_bal numeric;
  final_bal numeric;
  calc_delta numeric;
  is_valid boolean;
BEGIN
  IF raw_text IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- Extract Transactions
  SELECT jsonb_agg(
      jsonb_build_object(
          'date', to_date(m[1], 'DD Mon YYYY'),
          'description', trim(regexp_replace(m[2], '\s+', ' ', 'g')), 
          'value', ABS(replace(replace(m[3], '£', ''), ',', '')::numeric), 
          'is_expense', (left(m[3], 1) = '-')
      )
  ) INTO extracted_txns
  FROM regexp_matches(
      raw_text, 
      '(\d{2}\s[A-Z][a-z]{2}\s\d{4})((?:(?!\d{2}\s[A-Z][a-z]{2}\s\d{4})[\s\S])+?)([+-]?£[\d,]+\.\d{2})£[\d,]+\.\d{2}', 
      'g' 
  ) AS m;

  IF extracted_txns IS NULL THEN extracted_txns := '[]'::jsonb; END IF;

  -- Extract Balances
  initial_bal := replace((regexp_matches(raw_text, 'Opening balance\s*£([\d,]+\.\d{2})'))[1], ',', '')::numeric;
  final_bal := replace((regexp_matches(raw_text, 'Closing balance\s*£([\d,]+\.\d{2})'))[1], ',', '')::numeric;

  -- Reconciliation Math
  SELECT COALESCE(SUM(CASE WHEN (item->>'is_expense')::boolean = true THEN -(item->>'value')::numeric ELSE (item->>'value')::numeric END), 0)
  INTO calc_delta FROM jsonb_array_elements(extracted_txns) AS item;

  is_valid := ABS((COALESCE(initial_bal, 0) + calc_delta) - COALESCE(final_bal, 0)) < 0.01;

  RETURN jsonb_build_object(
      'transactions', extracted_txns,
      'meta', jsonb_build_object('initial_balance', initial_bal, 'final_balance', final_bal, 'passes_check', is_valid)
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Updated Router Function
CREATE OR REPLACE FUNCTION public.router_parse_statement()
RETURNS TRIGGER AS $$
DECLARE
    target_func text;
    rich_result jsonb;
BEGIN
    -- Look up parser using the bank_type from the linked bank
    SELECT d.parser_function_name INTO target_func
    FROM public.banks b
    JOIN public.bank_definitions d ON d.bank_name = b.bank_type
    WHERE b.id = NEW.bank_id;

    IF target_func IS NOT NULL THEN
        EXECUTE format('SELECT %I($1)', target_func) USING NEW.raw_text INTO rich_result;
        NEW.parsed_text := rich_result->'transactions';
        NEW.initial_balance := (rich_result->'meta'->>'initial_balance')::numeric;
        NEW.final_balance := (rich_result->'meta'->>'final_balance')::numeric;
        NEW.passes_check := (rich_result->'meta'->>'passes_check')::boolean;
        NEW.processed := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. The Trigger
CREATE TRIGGER trigger_statements_router
BEFORE INSERT OR UPDATE ON public.statements
FOR EACH ROW EXECUTE FUNCTION public.router_parse_statement();

-- 7. Seed Registry
INSERT INTO public.bank_definitions (bank_name, parser_function_name) 
VALUES ('Chase', 'fn_parse_chase_v2') ON CONFLICT DO NOTHING;