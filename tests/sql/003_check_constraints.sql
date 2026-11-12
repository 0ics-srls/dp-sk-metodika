DELETE FROM passages;
DELETE FROM documents;

DO $$
BEGIN
    INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'c1', 'x', 'y', 'text', 'api');
    RAISE EXCEPTION 'text_source api was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'c2', 'x', 'y', '   ', 'pdf');
    RAISE EXCEPTION 'blank text was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('unknown-site', 'c3', 'x', 'y', 'text', 'pdf');
    RAISE EXCEPTION 'fonte unknown-site was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'c4', 'x', 'y', NULL, 'pdf');
    RAISE EXCEPTION 'null text was accepted';
EXCEPTION WHEN not_null_violation THEN
    NULL;
END $$;

-- the legal values are accepted
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('financnasprava', 'c5', 'x', 'MP', 'text', 'pdf');
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('mfsr-spravodajca', 'c6', 'x', 'MF', 'text', 'ocr');
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'c7', 'x', 'y', 'text', 'pdf');
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('uvo-metodicke', 'c8', 'x', 'y', 'text', 'pdf');

SELECT count(*) = 4 AS ok FROM documents
