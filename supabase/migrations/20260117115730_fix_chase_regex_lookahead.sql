-- v2.0
CREATE OR REPLACE FUNCTION parse_chase_statement()
RETURNS TRIGGER AS $$
DECLARE
  j jsonb;
BEGIN
  -- 1. Safety Check
  IF NEW.raw_text IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Extraction & Transformation
  SELECT jsonb_agg(
      jsonb_build_object(
          'date', to_date(m[1], 'DD Mon YYYY'),
          'description', trim(regexp_replace(m[2], '\s+', ' ', 'g')), 
          'value', ABS(replace(replace(m[3], '£', ''), ',', '')::numeric), 
          'is_expense', (left(m[3], 1) = '-')
      )
  ) INTO j
  FROM regexp_matches(
      NEW.raw_text, 
      -- REGEX BREAKDOWN:
      -- 1. Date: (\d{2}\s[A-Z][a-z]{2}\s\d{4})
      -- 2. Description with Lookahead: ((?:(?!\d{2}\s[A-Z][a-z]{2}\s\d{4})[\s\S])+?)
      --    This says: "Capture characters, BUT if you see a Date pattern coming up, ABORT this match."
      --    This prevents the capture from spanning across multiple dates.
      -- 3. Amount: ([+-]?£[\d,]+\.\d{2})
      -- 4. Balance check: £[\d,]+\.\d{2} (Ensures we only match lines ending with a balance)
      '(\d{2}\s[A-Z][a-z]{2}\s\d{4})((?:(?!\d{2}\s[A-Z][a-z]{2}\s\d{4})[\s\S])+?)([+-]?£[\d,]+\.\d{2})£[\d,]+\.\d{2}', 
      'g' 
  ) AS m;

  -- 3. Handle empty results
  IF j IS NULL THEN
    j := '[]'::jsonb;
  END IF;

  -- 4. Assign result
  NEW.parsed_text := j;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;