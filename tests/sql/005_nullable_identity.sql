DELETE FROM passages;
DELETE FROM documents;

-- a document without numero, number, dept, anno, data and oggetto is legal (legacy filled the source id and year 0; the package stores NULL)
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'dokument_1', 'Národná banka Slovenska', 'dokument', 'text', 'pdf');

SELECT (SELECT numero IS NULL AND number IS NULL AND dept IS NULL AND anno IS NULL AND data IS NULL AND oggetto IS NULL AND legacy_doc_id IS NULL FROM documents WHERE source_id = 'dokument_1')
   AND (SELECT is_nullable = 'YES' FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'documents' AND column_name = 'anno')
   AND (SELECT data_type = 'text' FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'documents' AND column_name = 'numero') AS ok
