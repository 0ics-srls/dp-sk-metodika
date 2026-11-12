-- search, filters on the document: fonte and section exact, tipo case-insensitive, ente substring, year range with both bounds and one bound, date range,
-- % and _ in tipo are literal (the ILIKE escaping the Tool uses)
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, section, anno, data, text_raw, text_source) VALUES
 ('financnasprava', 't021a', 'Financna sprava SR', 'MP', 'metodicke-pokyny', 2020, DATE '2020-01-10', 'text a', 'pdf'),
 ('financnasprava', 't021b', 'Financna sprava SR', 'MU', 'metodicke-usmernenia', 2021, DATE '2021-06-15', 'text b', 'pdf'),
 ('mfsr-spravodajca', 't021c', 'Ministerstvo financii SR', 'oznamenie', 'mfsr-spravodajca', 2022, DATE '2022-03-20', 'text c', 'pdf'),
 ('nbs-metodicke', 't021d', 'Narodna banka Slovenska', '100%_x', 'nbs-metodicke', NULL, NULL, 'text d', 'ocr');

SELECT (SELECT count(*) FROM documents WHERE fonte = 'financnasprava') = 2
   AND (SELECT count(*) FROM documents WHERE section = 'nbs-metodicke') = 1
   AND (SELECT count(*) FROM documents WHERE tipo ILIKE replace(replace(replace('mp', '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE ente ILIKE '%' || replace(replace(replace('banka', '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE anno >= 2020 AND anno <= 2021) = 2
   AND (SELECT count(*) FROM documents WHERE anno >= 2021) = 2
   AND (SELECT count(*) FROM documents WHERE anno <= 2020) = 1
   AND (SELECT count(*) FROM documents WHERE data >= DATE '2021-01-01' AND data <= DATE '2021-12-31') = 1
   AND (SELECT count(*) FROM documents WHERE data >= DATE '2022-01-01') = 1
   -- a NULL year or date never satisfies a range
   AND (SELECT count(*) FROM documents WHERE anno IS NULL) = 1
   -- % and _ are literal: the tipo 100%_x matches itself only
   AND (SELECT count(*) FROM documents WHERE tipo ILIKE replace(replace(replace('100%_x', '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\') = 1
   AND (SELECT count(*) FROM documents WHERE tipo ILIKE replace(replace(replace('%', '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\') = 0
   AND (SELECT count(*) FROM documents WHERE tipo ILIKE replace(replace(replace('m_', '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\') = 0 AS ok
