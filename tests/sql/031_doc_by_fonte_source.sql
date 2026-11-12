-- doc by fonte + source_id: the natural key of the table is unique per fonte, the same source_id may exist under another fonte
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES
 ('financnasprava', 'same', 'Financna sprava SR', 'MP', 'fs', 'pdf'),
 ('nbs-metodicke', 'same', 'Narodna banka Slovenska', 'stanovisko', 'nbs', 'pdf');

SELECT (SELECT count(*) FROM documents WHERE fonte = 'financnasprava' AND source_id = 'same') = 1
   AND (SELECT text_raw FROM documents WHERE fonte = 'nbs-metodicke' AND source_id = 'same') = 'nbs'
   AND (SELECT count(*) FROM documents WHERE fonte = 'nbs-metodicke' AND source_id = 'other') = 0 AS ok
