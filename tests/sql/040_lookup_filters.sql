-- lookup filters (port of the branch-53 query_prassi: Ente, Tipo, Numero, Anno, Data), each alone and combined; numero is an escaped prefix
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, section, numero, anno, data, text_raw, text_source) VALUES
 ('financnasprava', 't040a', 'Financna sprava SR', 'MP', 'metodicke-pokyny', '10/DZPaU/2024/MP', 2024, DATE '2024-05-01', 'a', 'pdf'),
 ('financnasprava', 't040b', 'Financna sprava SR', 'MU', 'metodicke-usmernenia', '11/2025', 2025, DATE '2025-02-01', 'b', 'pdf'),
 ('mfsr-spravodajca', 't040c', 'Ministerstvo financii SR', 'oznamenie', 'mfsr-spravodajca', 'MF/013819/2025-74', 2025, DATE '2025-07-15', 'c', 'pdf'),
 ('nbs-metodicke', 't040d', 'Narodna banka Slovenska', 'stanovisko', 'nbs-metodicke', NULL, NULL, NULL, 'd', 'ocr'),
 ('financnasprava', 't040e', 'Financna sprava SR', 'x', 'metodicke-pokyny', '100%_x/1', 2010, DATE '2010-01-01', 'e', 'pdf');

SELECT (SELECT count(*) FROM documents WHERE fonte = 'nbs-metodicke') = 1
   AND (SELECT count(*) FROM documents WHERE section = 'metodicke-pokyny') = 2
   AND (SELECT count(*) FROM documents WHERE tipo ILIKE replace(replace(replace('mp', '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE numero ILIKE replace(replace(replace('10/', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE numero ILIKE replace(replace(replace('mf/', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE numero ILIKE replace(replace(replace('%', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 0
   AND (SELECT count(*) FROM documents WHERE numero ILIKE replace(replace(replace('100%_x', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE anno = 2025) = 2
   AND (SELECT count(*) FROM documents WHERE ente ILIKE '%' || replace(replace(replace('banka', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE data >= DATE '2025-01-01' AND data <= DATE '2025-12-31') = 2
   AND (SELECT count(*) FROM documents WHERE fonte = 'financnasprava' AND anno = 2025 AND tipo ILIKE 'mu') = 1 AS ok
