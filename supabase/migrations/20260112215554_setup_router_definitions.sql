CREATE OR REPLACE FUNCTION router_parse_statement()
RETURNS TRIGGER AS $$
DECLARE
    target_function text;
BEGIN
    -- 1. Find the correct function for this bank
    -- (Assuming your uploaded row has a 'bank_id' or you identify it by filename)
    SELECT parser_function_name INTO target_function
    FROM bank_definitions
    WHERE id = NEW.bank_id;

    -- 2. Execute that function dynamically
    IF target_function IS NOT NULL THEN
        -- This runs: SELECT fn_parse_chase_v1(NEW.raw_text)
        EXECUTE format('SELECT %I($1)', target_function) 
        USING NEW.raw_text 
        INTO NEW.parsed_text;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;