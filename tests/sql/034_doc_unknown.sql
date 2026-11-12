-- an unknown document answers zero rows, not an error
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, numero, anno, text_raw, text_source) VALUES ('financnasprava', 't034', 'Financna sprava SR', 'MP', '1', 2020, 'text', 'pdf');

SELECT (SELECT count(*) FROM documents WHERE id = CAST('00000000-0000-0000-0000-0000000034ff' AS uuid)) = 0
   AND (SELECT count(*) FROM documents WHERE fonte = 'nbs-metodicke' AND source_id = 'missing') = 0
   AND (SELECT count(*) FROM documents WHERE lower(tipo) = 'mp' AND numero = '9' AND anno = 1999) = 0 AS ok
