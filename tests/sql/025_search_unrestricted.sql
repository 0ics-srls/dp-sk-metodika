-- an unrestricted search (no query, no filter) lists rows: a Screen opens with it (P79-56); the Tool itself is exercised by the C# tests, here the table answers
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 't025', 'Narodna banka Slovenska', 'stanovisko', 'text', 'ocr');

SELECT (SELECT count(*) FROM (SELECT * FROM documents ORDER BY tipo, anno NULLS LAST, numero NULLS LAST, id LIMIT 10) x) = 1 AS ok
