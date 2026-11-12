-- duplicate identity groups (informative): the same (fonte, ente, tipo, numero, anno) with a non-null numero; a NULL numero never forms a group
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, numero, anno, text_raw, text_source) VALUES
 ('mfsr-spravodajca', 't063a', 'MF SR', 'Opatrenie', '1', 2015, 'a', 'pdf'),
 ('mfsr-spravodajca', 't063b', 'MF SR', 'Opatrenie', '1', 2015, 'b', 'pdf'),
 ('mfsr-spravodajca', 't063c', 'MF SR', 'Opatrenie', '2', 2015, 'c', 'pdf'),
 ('nbs-metodicke', 't063d', 'NBS', 'stanovisko', NULL, 2020, 'd', 'pdf'),
 ('nbs-metodicke', 't063e', 'NBS', 'stanovisko', NULL, 2020, 'e', 'pdf');

SELECT (SELECT count(*) FROM (SELECT 1 FROM documents WHERE numero IS NOT NULL GROUP BY fonte, ente, tipo, numero, anno HAVING count(*) > 1) g) = 1 AS ok
