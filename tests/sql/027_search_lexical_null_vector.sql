-- search mode lexical: the Host skips the query embedding (x-embed.skipWhen) and binds q_vec NULL; the lexical rows are exactly those of a call that had a vector
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES
 ('financnasprava', 't027a', 'Financna sprava SR', 'MP', 'metodicky pokyn k dani z prijmov', 'pdf'),
 ('financnasprava', 't027b', 'Financna sprava SR', 'MP', 'metodicky pokyn k dani z pridanej hodnoty', 'pdf'),
 ('financnasprava', 't027c', 'Financna sprava SR', 'MP', 'zaver z rokovania komisie', 'pdf');
INSERT INTO passages (document_id, seq, text, text_contextual, embedding)
SELECT id, 0, 'p', 'p', array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector FROM documents WHERE source_id IN ('t027a', 't027b');

WITH calls AS (
    SELECT 'with_vector' AS name, 'lexical' AS mode, CAST(array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector AS text) AS q_vec
    UNION ALL
    SELECT 'null_vector', 'lexical', CAST(NULL AS text)
),
result AS (
    SELECT c.name,
           (SELECT array_agg(f.source_id ORDER BY f.rn)
              FROM (SELECT d.source_id, row_number() OVER (ORDER BY ts_rank_cd(d.search_vector, websearch_to_tsquery('sk_unaccent'::regconfig, 'metodicky pokyn')) DESC, d.id) AS rn
                      FROM documents d
                     WHERE c.mode <> 'semantic' AND d.search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'metodicky pokyn')) f) AS lexical_rows,
           (SELECT count(*) FROM passages ps
             WHERE c.mode <> 'lexical' AND CAST(c.q_vec AS vector) IS NOT NULL AND ps.embedding IS NOT NULL) AS semantic_rows
      FROM calls c
)
SELECT (SELECT count(*) FROM result) = 2
   AND (SELECT count(DISTINCT lexical_rows) FROM result) = 1
   AND (SELECT lexical_rows FROM result WHERE name = 'null_vector') @> ARRAY['t027a', 't027b']
   AND (SELECT cardinality(lexical_rows) FROM result WHERE name = 'null_vector') = 2
   AND (SELECT max(semantic_rows) FROM result) = 0 AS ok
