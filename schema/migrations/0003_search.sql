-- dp-sk-metodika 0003: search vector over oggetto and text_raw with the sk_unaccent configuration (0002), vector index, lookup indexes. Idempotent.
-- The Tools and the ODCS ftsConfig use the same plain identifier sk_unaccent (P81b-23). No stemming: inflected forms do not match, the semantic channel compensates.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('sk_unaccent'::regconfig, coalesce(oggetto, '') || ' ' || text_raw)) STORED;

CREATE INDEX IF NOT EXISTS documents_search_vector_idx ON documents USING gin (search_vector);
CREATE INDEX IF NOT EXISTS documents_fonte_idx ON documents (fonte);
CREATE INDEX IF NOT EXISTS documents_tipo_idx ON documents (tipo);
CREATE INDEX IF NOT EXISTS documents_anno_idx ON documents (anno);
CREATE INDEX IF NOT EXISTS documents_data_idx ON documents (data);
CREATE INDEX IF NOT EXISTS documents_numero_idx ON documents (numero);
CREATE INDEX IF NOT EXISTS documents_section_idx ON documents (section);

CREATE INDEX IF NOT EXISTS passages_embedding_hnsw_idx ON passages USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS passages_document_id_idx ON passages (document_id);
