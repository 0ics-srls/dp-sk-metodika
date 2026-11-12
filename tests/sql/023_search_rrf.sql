-- search, fusion: reciprocal rank fusion k = 60 keyed by document id; a row in both lists beats rows in one list; a tie goes to the lexical rank
DELETE FROM passages;
DELETE FROM documents;
WITH lex(id, rn) AS (VALUES ('a', 1), ('b', 2)),
     sem(id, rn) AS (VALUES ('b', 1), ('c', 2)),
     fused AS (
         SELECT COALESCE(l.id, s.id) AS id,
                COALESCE(1.0 / (60 + l.rn), 0) + COALESCE(1.0 / (60 + s.rn), 0) AS rrf,
                COALESCE(l.rn, 1000000000) AS lex_rn,
                COALESCE(s.rn, 1000000000) AS sem_rn
           FROM lex l FULL OUTER JOIN sem s ON s.id = l.id),
     ranked AS (SELECT id, row_number() OVER (ORDER BY rrf DESC, lex_rn, sem_rn, id) AS pos FROM fused)
SELECT (SELECT 1.0 / (60 + 1) + 1.0 / (60 + 2)) > (SELECT 1.0 / (60 + 1))
   AND (1.0 / (60 + 1)) > (1.0 / (60 + 2))
   AND (SELECT round((1.0 / (60 + 1) + 1.0 / (60 + 1))::numeric, 6)) = 0.032787
   -- b is in both lists and wins; a (lexical 1) and c (semantic 2) are single-list rows: a beats c
   AND (SELECT string_agg(id, ',' ORDER BY pos) FROM ranked) = 'b,a,c' AS ok
