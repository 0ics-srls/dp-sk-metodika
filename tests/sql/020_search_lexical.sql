-- search, lexical side: websearch syntax on the sk_unaccent vector of oggetto + text_raw, headline with the legacy markers.
-- A query typed without diacritics finds the text with diacritics; an inflected form is NOT found (no stemming): the honest behaviour.
DELETE FROM passages;
DELETE FROM documents;
INSERT INTO documents (fonte, source_id, ente, tipo, oggetto, text_raw, text_source) VALUES
 ('financnasprava', 't020a', 'Financna sprava SR', 'MP', 'Metodický pokyn k dani z príjmov', 'Metodický pokyn upravuje postup správcu dane pri vyrubení dane z príjmov.', 'pdf'),
 ('financnasprava', 't020b', 'Financna sprava SR', 'MU', NULL, 'Metodické usmernenie k registračným pokladniciam a ich prevádzke.', 'pdf'),
 ('mfsr-spravodajca', 't020c', 'Ministerstvo financii SR', 'oznamenie', NULL, 'Oznámenie o vydaní poučenia k metodickému pokynu.', 'pdf'),
 ('nbs-metodicke', 't020d', 'Narodna banka Slovenska', 'stanovisko', NULL, 'Stanovisko NBS: platobných služieb sa týka metodicky pokyn pre dohľad.', 'ocr');

SELECT (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, '"dani z príjmov"')) = 1                  -- phrase
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'registračným OR platobných')) = 2          -- OR
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'pokyn -platobných')) = 1                   -- minus
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'pokyn pokladniciam')) = 0                  -- implicit AND
   -- diacritics folded: the query typed without them finds the text with them (both documents that print "Metodický pokyn" / "metodicky pokyn")
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'metodicky pokyn')) = 2
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'METODICKÝ POKYN')) = 2
   -- the honest no-stemming behaviour: pokyn finds pokyn, not pokynu; pokynu finds only the inflected one
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'pokynu')) = 1
   AND (SELECT count(*) FROM documents WHERE search_vector @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'pokynom')) = 0
   AND (SELECT ts_headline('sk_unaccent'::regconfig, text_raw, websearch_to_tsquery('sk_unaccent'::regconfig, 'registracnym'), 'StartSel=«,StopSel=»,MaxFragments=2,MaxWords=28,MinWords=8')
          FROM documents WHERE source_id = 't020b') LIKE '%«registračným»%' AS ok
