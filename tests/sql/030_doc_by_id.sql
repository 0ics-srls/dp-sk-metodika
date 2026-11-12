-- doc by id: one row with every documented column; the text slice is substr(text_raw, offset + 1, length)
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (id, fonte, source_id, legacy_doc_id, ente, tipo, section, group_label, numero, anno, data, oggetto, text_raw, text_source, source_url, pdf_bytes, pdf_pages) VALUES
 ('00000000-0000-0000-0000-0000000030a1', 'financnasprava', 't030', 'mp-30', 'Financna sprava SR', 'MP', 'metodicke-pokyny', '2026', '10/DZPaU/2026/MP', 2026, DATE '2026-03-01',
  'Metodický pokyn', 'Úplný text pokynu.', 'pdf', 'https://example.test/t030.pdf', 376041, 10);

SELECT (SELECT count(*) FROM documents WHERE id = CAST('00000000-0000-0000-0000-0000000030a1' AS uuid)) = 1
   AND (SELECT substr(text_raw, 0 + 1, 20000) FROM documents) = 'Úplný text pokynu.'
   AND (SELECT length(text_raw) FROM documents) = 18
   AND (SELECT (0 + 20000 < length(text_raw)) FROM documents) = false
   AND (SELECT pdf_pages FROM documents) = 10 AND (SELECT legacy_doc_id FROM documents) = 'mp-30' AND (SELECT group_label FROM documents) = '2026' AS ok
