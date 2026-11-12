-- status counts per fonte: 6 documents, 2 fonte, 1 ocr; the aggregates the Tool uses give exact numbers
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, section, anno, text_raw, text_source) VALUES
 ('financnasprava', 't060a', 'e', 'MP', 'metodicke-pokyny', 2020, 'a', 'pdf'),
 ('financnasprava', 't060b', 'e', 'MP', 'metodicke-pokyny', 2026, 'b', 'pdf'),
 ('financnasprava', 't060c', 'e', 'MU', 'metodicke-usmernenia', 2014, 'c', 'pdf'),
 ('financnasprava', 't060d', 'e', 'zapis', 'zavery-komisii', NULL, 'd', 'pdf'),
 ('nbs-metodicke', 't060e', 'e', 'stanovisko', 'nbs-metodicke', 2023, 'e', 'ocr'),
 ('nbs-metodicke', 't060f', 'e', 'stanovisko', 'nbs-metodicke', NULL, 'f', 'pdf');

WITH per AS (
    SELECT fonte, count(*) AS documents, min(anno) AS first_year, max(anno) AS last_year, count(*) FILTER (WHERE text_source = 'ocr') AS ocr
      FROM documents GROUP BY fonte)
SELECT (SELECT count(*) FROM per) = 2
   AND (SELECT documents FROM per WHERE fonte = 'financnasprava') = 4
   AND (SELECT first_year FROM per WHERE fonte = 'financnasprava') = 2014
   AND (SELECT last_year FROM per WHERE fonte = 'financnasprava') = 2026
   AND (SELECT documents FROM per WHERE fonte = 'nbs-metodicke') = 2
   AND (SELECT ocr FROM per WHERE fonte = 'nbs-metodicke') = 1
   AND (SELECT sum(ocr) FROM per) = 1
   AND (SELECT jsonb_object_agg(section, n) FROM (SELECT section, count(*) AS n FROM documents WHERE fonte = 'financnasprava' GROUP BY section ORDER BY section) s)
       = '{"metodicke-pokyny": 2, "metodicke-usmernenia": 1, "zavery-komisii": 1}'::jsonb AS ok
