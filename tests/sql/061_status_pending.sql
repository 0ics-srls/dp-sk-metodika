-- passages without an embedding are counted as pending (the semantic search cannot reach them)
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (id, fonte, source_id, ente, tipo, text_raw, text_source) VALUES
 ('00000000-0000-0000-0000-0000000061a1', 'financnasprava', 't061', 'e', 'MP', 'a', 'pdf');
INSERT INTO passages (document_id, seq, text, text_contextual, embedding) VALUES
 ('00000000-0000-0000-0000-0000000061a1', 0, 'p0', 'p0', array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector),
 ('00000000-0000-0000-0000-0000000061a1', 1, 'p1', 'p1', NULL),
 ('00000000-0000-0000-0000-0000000061a1', 2, 'p2', 'p2', NULL);

SELECT (SELECT count(*) FROM passages) = 3
   AND (SELECT count(*) FROM passages WHERE embedding IS NULL) = 2 AS ok
