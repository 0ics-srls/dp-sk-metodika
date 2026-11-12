-- the lookup row never carries the text: the columns it selects (estremi, oggetto, source_url, text_source) exist and none of them is a large value column
SELECT (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'documents'
           AND column_name IN ('id', 'fonte', 'source_id', 'ente', 'tipo', 'section', 'numero', 'anno', 'data', 'oggetto', 'source_url', 'text_source')) = 12
   AND (SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'documents' AND column_name = 'text_raw') = 'text' AS ok
