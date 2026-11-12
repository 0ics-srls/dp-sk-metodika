-- doc by tipo + numero + anno: the key can match several documents (a repeated identity); newest date first, a missing date last, source_id and id break ties
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, numero, anno, data, text_raw, text_source) VALUES
 ('mfsr-spravodajca', 'o1', 'MF SR', 'Opatrenie', '1', 2015, DATE '2015-01-01', 'stary', 'pdf'),
 ('mfsr-spravodajca', 'o2', 'MF SR', 'Opatrenie', '1', 2015, DATE '2015-09-01', 'novy', 'pdf'),
 ('mfsr-spravodajca', 'o3', 'MF SR', 'Opatrenie', '1', 2015, NULL, 'bez datumu', 'pdf'),
 ('mfsr-spravodajca', 'o4', 'MF SR', 'Opatrenie', '2', 2015, DATE '2015-10-01', 'iny', 'pdf');

SELECT (SELECT string_agg(text_raw, ',' ORDER BY data DESC NULLS LAST, source_id)
          FROM documents WHERE lower(tipo) = lower('Opatrenie') AND numero = '1' AND anno = 2015) = 'novy,stary,bez datumu' AS ok
