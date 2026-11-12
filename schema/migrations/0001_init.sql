-- dp-sk-metodika 0001: the four tables. Additive and idempotent; applied by the Host as ds_sk_metodika_rw with search_path ds_sk_metodika, public.
-- No foreign keys: ingest replaces the passages of a document in one transaction. The pgvector extension is provided by the Host.

-- Slovak methodological guidance PDFs (Financna sprava, MF SR Financny spravodajca, NBS, UVO). Identity is (fonte, source_id): source_id is derived from the
-- unique URL path (P81b-05), legacy_doc_id keeps the legacy doc_id for parity. numero, anno and data are NULL when the source does not give them
-- (the legacy filled the source id and year 0). text_source says where text_raw came from: the PDF text layer (pdf) or local OCR of a scan (ocr).
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fonte text NOT NULL,
    source_id text NOT NULL,
    legacy_doc_id text,
    ente text NOT NULL,
    tipo text NOT NULL,
    section text,
    group_label text,
    numero text,
    number integer,
    dept text,
    anno integer,
    data date,
    oggetto text,
    text_raw text NOT NULL,
    text_source text NOT NULL,
    source_url text,
    pdf_bytes integer,
    pdf_pages integer,
    pdf_created date,
    ingested_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT documents_text_source_chk CHECK (text_source IN ('pdf', 'ocr')),
    CONSTRAINT documents_text_raw_not_blank_chk CHECK (length(btrim(text_raw)) > 0),
    CONSTRAINT documents_fonte_chk CHECK (fonte IN ('financnasprava', 'mfsr-spravodajca', 'nbs-metodicke', 'uvo-metodicke')),
    CONSTRAINT documents_fonte_source_id_uq UNIQUE (fonte, source_id)
);

-- Passages of a document (the best passage per document feeds the semantic search). embedding is filled by the embed step.
CREATE TABLE IF NOT EXISTS passages (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id uuid NOT NULL,
    seq integer NOT NULL,
    text text NOT NULL,
    text_contextual text NOT NULL,
    embedding vector(1024),
    CONSTRAINT passages_document_seq_uq UNIQUE (document_id, seq)
);

-- Items the pipeline saw but did not turn into a document (not a PDF, no text after OCR, too large, no PDF behind the listing row).
CREATE TABLE IF NOT EXISTS skipped (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fonte text NOT NULL,
    item_ref text NOT NULL,
    reason text NOT NULL,
    seen_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT skipped_fonte_item_ref_uq UNIQUE (fonte, item_ref)
);

-- Listed versus taken per Catalog item (a section, a year page, a site, a UVO leaf); note carries coverage markers such as zip_archives_only.
CREATE TABLE IF NOT EXISTS coverage (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fonte text NOT NULL,
    item_id text NOT NULL,
    listed integer NOT NULL DEFAULT 0,
    taken integer NOT NULL DEFAULT 0,
    skipped integer NOT NULL DEFAULT 0,
    note text,
    noted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT coverage_fonte_item_uq UNIQUE (fonte, item_id)
);
