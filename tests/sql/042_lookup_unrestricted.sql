-- an unrestricted lookup (no parameter) lists the newest documents: the Screen opens with it (P79-56); the Tool itself is exercised by the C# tests
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, data, text_raw, text_source) VALUES ('financnasprava', 't042', 'Financna sprava SR', 'MP', DATE '2026-01-01', 'text', 'pdf');

SELECT (SELECT count(*) FROM (SELECT * FROM documents ORDER BY data DESC NULLS LAST, id LIMIT 20) x) = 1 AS ok
