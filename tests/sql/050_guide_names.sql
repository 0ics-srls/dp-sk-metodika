-- guide: the text is a constant SELECT, the C# test reads it through the Tool (every Tool name with the hyphen, PDF, unaccent / diakritik, NBS, robots).
-- Here: the schema the guide documents exists (tables, the generated vector, and the FTS configuration sk_unaccent the guide names).
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'documents')
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'passages')
   AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = 'documents'::regclass AND a.attname = 'search_vector')
   AND EXISTS (SELECT 1 FROM pg_ts_config c JOIN pg_namespace n ON n.oid = c.cfgnamespace WHERE c.cfgname = 'sk_unaccent' AND n.nspname = current_schema())
   -- the guide is built as: SELECT $guide$...$guide$ AS text, so a constant SELECT without FROM answers one row on any data
   AND (SELECT count(*) FROM (SELECT 'x'::text AS text) g) = 1 AS ok
