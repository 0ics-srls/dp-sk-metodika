-- lookup sort and paging: ties break by id, total is a window count constant over pages, a missing date is last
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (id, fonte, source_id, ente, tipo, data, text_raw, text_source)
SELECT ('00000000-0000-0000-0000-0000000041' || lpad(g::text, 2, '0'))::uuid, 'financnasprava', 't041' || g, 'e', 'MP', CASE WHEN g = 10 THEN NULL ELSE DATE '2020-01-01' + (g % 3) END, 'x', 'pdf'
  FROM generate_series(1, 10) g;

WITH p AS (SELECT id, data, count(*) OVER () AS total FROM documents ORDER BY data DESC NULLS LAST, id LIMIT 4 OFFSET 4),
     q AS (SELECT id, data FROM documents ORDER BY data ASC NULLS LAST, id)
SELECT (SELECT count(*) FROM p) = 4 AND (SELECT min(total) FROM p) = 10 AND (SELECT max(total) FROM p) = 10
   AND (SELECT data FROM documents ORDER BY data DESC NULLS LAST, id LIMIT 1) = DATE '2020-01-03'
   AND (SELECT data IS NULL FROM (SELECT data FROM documents ORDER BY data DESC NULLS LAST, id OFFSET 9 LIMIT 1) l)
   AND (SELECT data IS NULL FROM (SELECT data FROM documents ORDER BY data ASC NULLS LAST, id OFFSET 9 LIMIT 1) l) AS ok
