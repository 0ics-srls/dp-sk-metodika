-- degraded mode: without a query vector the lexical list still answers (CAST of NULL to vector is NULL, the semantic list is empty)
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('financnasprava', 't026', 'Financna sprava SR', 'MP', 'metodicky pokyn k dani', 'pdf');
INSERT INTO passages (document_id, seq, text, text_contextual, embedding)
SELECT id, 0, 'pokyn', 'pokyn', array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector FROM documents;

SELECT CAST(NULL AS vector) IS NULL
   AND (SELECT count(*) FROM passages ps WHERE ps.embedding <=> CAST(NULL AS vector) IS NOT NULL) = 0
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'pokyn')) = 1 AS ok
