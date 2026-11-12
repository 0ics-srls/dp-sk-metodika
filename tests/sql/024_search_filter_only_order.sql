-- search without a query lists by tipo, anno, numero (the legacy order), a missing year or number last, id breaks ties; k limits the list
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (id, fonte, source_id, ente, tipo, numero, anno, text_raw, text_source) VALUES
 ('00000000-0000-0000-0000-0000000024a1', 'financnasprava', 't024a', 'e', 'a', '2', 2020, 'a', 'pdf'),
 ('00000000-0000-0000-0000-0000000024a2', 'financnasprava', 't024b', 'e', 'a', '1', 2020, 'b', 'pdf'),
 ('00000000-0000-0000-0000-0000000024a3', 'financnasprava', 't024c', 'e', 'a', '1', NULL, 'c', 'pdf'),
 ('00000000-0000-0000-0000-0000000024a4', 'financnasprava', 't024d', 'e', 'a', NULL, 2020, 'd', 'pdf'),
 ('00000000-0000-0000-0000-0000000024a5', 'financnasprava', 't024e', 'e', 'a', '1', 2019, 'e', 'pdf'),
 ('00000000-0000-0000-0000-0000000024a6', 'financnasprava', 't024f', 'e', 'b', '1', 2018, 'f', 'pdf');

SELECT (SELECT string_agg(source_id, ',' ORDER BY tipo, anno NULLS LAST, numero NULLS LAST, id) FROM documents) = 't024e,t024b,t024a,t024d,t024c,t024f'
   AND (SELECT string_agg(source_id, ',' ORDER BY tipo, anno NULLS LAST, numero NULLS LAST, id)
          FROM (SELECT * FROM documents ORDER BY tipo, anno NULLS LAST, numero NULLS LAST, id LIMIT 2) x) = 't024e,t024b' AS ok
