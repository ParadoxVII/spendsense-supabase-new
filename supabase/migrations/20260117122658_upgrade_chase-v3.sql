-- 1. Define the "Rich" Parser for Chase (Version 2)
-- This function now does extraction AND reconciliation in one go.
CREATE OR REPLACE FUNCTION public.fn_parse_chase_v2(raw_text text)
RETURNS jsonb AS $$
DECLARE
  extracted_txns jsonb;
  initial_bal numeric;
  final_bal numeric;
  calc_delta numeric;
  is_valid boolean;
  result_package jsonb;
BEGIN
  -- A. Safety Check
  IF raw_text IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- B. Extract Transactions (Using the FIXED Regex)
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

  -- C. Extract Balances (Regex for Opening/Closing)
  -- We use NULLIF to handle cases where regex fails gracefully
  initial_bal := (regexp_matches(raw_text, 'Opening balance\s*£([\d,]+\.\d{2})'))[1];
  initial_bal := replace(initial_bal::text, ',', '')::numeric;

  final_bal := (regexp_matches(raw_text, 'Closing balance\s*£([\d,]+\.\d{2})'))[1];
  final_bal := replace(final_bal::text, ',', '')::numeric;

  -- D. Calculate the Math (Reconciliation)
  -- Sum up the extracted transactions
  SELECT COALESCE(SUM(
      CASE 
          WHEN (item->>'is_expense')::boolean = true THEN -(item->>'value')::numeric
          ELSE (item->>'value')::numeric
      END
  ), 0)
  INTO calc_delta
  FROM jsonb_array_elements(extracted_txns) AS item;

  -- E. Determine Validity
  -- Check if (Start + Delta) equals (End)
  -- We use ABS < 0.01 to handle tiny floating point mismatches
  is_valid := ABS((COALESCE(initial_bal, 0) + calc_delta) - COALESCE(final_bal, 0)) < 0.01;

  -- F. Package Everything into one JSON object
  result_package := jsonb_build_object(
      'transactions', extracted_txns,
      'meta', jsonb_build_object(
          'initial_balance', initial_bal,
          'final_balance', final_bal,
          'passes_check', is_valid
      )
  );

  RETURN result_package;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the Router to Handle the Rich Result
-- The router now unpacks the JSON and assigns it to the table columns.
CREATE OR REPLACE FUNCTION public.router_parse_statement()
RETURNS TRIGGER AS $$
DECLARE
    target_function text;
    rich_result jsonb;
BEGIN
    -- Look up the function name
    SELECT parser_function_name INTO target_function
    FROM public.bank_definitions
    WHERE id = NEW.bank_id;

    IF target_function IS NOT NULL THEN
        -- Execute the specific parser
        EXECUTE format('SELECT %I($1)', target_function) 
        USING NEW.raw_text 
        INTO rich_result;

        -- Unpack the results into the NEW row columns
        -- 1. The parsed transactions array
        NEW.parsed_text := rich_result->'transactions';
        
        -- 2. The Reconciliation Metadata
        -- We cast to text first to safely strip quotes, then to numeric/boolean
        NEW.initial_balance := (rich_result->'meta'->>'initial_balance')::numeric;
        NEW.final_balance   := (rich_result->'meta'->>'final_balance')::numeric;
        NEW.passes_check    := (rich_result->'meta'->>'passes_check')::boolean;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the Registry to use V2
INSERT INTO public.bank_definitions (bank_name, parser_function_name)
VALUES ('Chase', 'fn_parse_chase_v2')
ON CONFLICT (bank_name) DO UPDATE 
SET parser_function_name = 'fn_parse_chase_v2';

