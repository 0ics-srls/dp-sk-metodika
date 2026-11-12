DELETE FROM passages;
DELETE FROM documents;

INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('mfsr-spravodajca', 'files_archiv_35_Opatrenie', 'Ministerstvo financií SR', 'MF', 'text', 'pdf');

-- the same (fonte, source_id) is refused; another source_id or another fonte is accepted
DO $$
BEGIN
    INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('mfsr-spravodajca', 'files_archiv_35_Opatrenie', 'Ministerstvo financií SR', 'MF', 'iny text', 'pdf');
    RAISE EXCEPTION 'duplicate (fonte, source_id) was accepted';
EXCEPTION WHEN unique_violation THEN
    NULL;
END $$;

INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('mfsr-spravodajca', 'files_archiv_36_Opatrenie', 'Ministerstvo financií SR', 'MF', 'iny text', 'pdf');
INSERT INTO documents (fonte, source_id, ente, tipo, text_raw, text_source) VALUES ('nbs-metodicke', 'files_archiv_35_Opatrenie', 'Národná banka Slovenska', 'stanovisko', 'treti text', 'pdf');

-- the legacy collision case: equal titles, different source ids coexist
INSERT INTO documents (fonte, source_id, ente, tipo, oggetto, text_raw, text_source) VALUES ('mfsr-spravodajca', 'a', 'x', 'MF', 'Opatrenie', 't', 'pdf'), ('mfsr-spravodajca', 'b', 'x', 'MF', 'Opatrenie', 't', 'pdf');

SELECT count(*) = 5 AS ok FROM documents
