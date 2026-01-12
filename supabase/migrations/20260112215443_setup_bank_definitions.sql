CREATE TABLE bank_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name text UNIQUE NOT NULL,
    parser_function_name text NOT NULL -- e.g., 'fn_parse_chase_v1'
);

-- Seed it with Chase
INSERT INTO bank_definitions (bank_name, parser_function_name) 
VALUES ('Chase', 'fn_parse_chase_v1');