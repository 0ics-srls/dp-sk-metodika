-- the full-text configuration the Tools query with is the one that built search_vector: the generated column expression uses sk_unaccent, and a vector built
-- with that configuration is matched by a tsquery built with the same one (a different configuration would yield other lexemes). The C# test
-- DpSkMetodikaSearchToolTests checks that every Tool SQL file uses the same literal.
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, oggetto, text_raw, text_source) VALUES ('financnasprava', 't027', 'Financna sprava SR', 'MP', 'Žiadosť', 'Správca dane', 'pdf');

SELECT EXISTS (SELECT 1 FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
                WHERE d.adrelid = 'documents'::regclass AND a.attname = 'search_vector' AND pg_get_expr(d.adbin, d.adrelid) LIKE '%sk_unaccent%')
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'ziadost spravca')) = 1
   -- the stored lexemes are folded: a plain simple tsquery with the diacritics typed would NOT match them, which is why one configuration must be used everywhere
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('simple'::regconfig, 'žiadosť')) = 0 AS ok
