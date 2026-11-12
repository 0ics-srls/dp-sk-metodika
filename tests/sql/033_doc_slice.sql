-- text slices: 45,000 characters = slices 0-20000, 20000-40000, 40000-45000; the last slice is not truncated
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('financnasprava', 't033', 'Financna sprava SR', 'MP', repeat('x', 45000), 'pdf');
SELECT (SELECT length(substr(text_raw, 1, 20000)) FROM documents) = 20000
   AND (SELECT (0 + 20000 < length(text_raw)) FROM documents)
   AND (SELECT length(substr(text_raw, 40000 + 1, 20000)) FROM documents) = 5000
   AND NOT (SELECT (40000 + 20000 < length(text_raw)) FROM documents)
   AND (SELECT length(text_raw) FROM documents) = 45000 AS ok
