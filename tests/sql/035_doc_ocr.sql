-- a scanned PDF is stored with text_source ocr (local OCR); the CHECK accepts only pdf and ocr
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 't035', 'Narodna banka Slovenska', 'stanovisko', 'text z OCR', 'ocr');

SELECT (SELECT text_source FROM documents WHERE source_id = 't035') = 'ocr'
   AND (SELECT numero IS NULL AND anno IS NULL AND data IS NULL FROM documents WHERE source_id = 't035')
   AND (SELECT count(*) FROM documents WHERE text_source IN ('pdf', 'ocr')) = 1 AS ok
