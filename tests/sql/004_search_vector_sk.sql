-- The stored vector uses sk_unaccent (D142/D149: simple + unaccent, created by migration 0002; the Host provides the unaccent extension).
-- Behaviour: case folded, diacritics folded (both directions), no stemming; oggetto and text_raw are both indexed.
DELETE FROM passages;
DELETE FROM documents;

INSERT INTO documents (fonte, source_id, ente, tipo, oggetto, text_raw, text_source)
VALUES ('financnasprava', 's1', 'Finančná správa SR', 'MP', 'Metodický pokyn k dani z príjmov', 'Poplatník je povinný podať daňové priznanie', 'pdf'),
       ('financnasprava', 's2', 'Finančná správa SR', 'MP', NULL, 'Zrážková daň sa vyberá zrážkou', 'pdf');

SELECT (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'metodický pokyn')) = 1     -- diacritics typed, word in oggetto
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'metodicky pokyn')) = 1     -- typed without diacritics
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'POPLATNÍK')) = 1          -- case folded, word in text_raw
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'zrazkova dan')) = 1       -- AND of two folded words
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'dane')) = 0               -- honest limit: dane vs dani, an inflected form is NOT found
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'inexistent')) = 0
   AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'documents' AND indexdef ILIKE '%USING gin%(search_vector)%') AS ok
