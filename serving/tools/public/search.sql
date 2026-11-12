-- HYBRID SEARCH PATTERN (sk-metodika): lexical (sk_unaccent FTS over oggetto + text_raw) fused by RRF with the semantic side (best passage per document).
--   f      : the filtered documents. fonte and section are exact, tipo is a case-insensitive equality and ente a substring (ILIKE; %, _ and \ in the argument are
--            literal), anno_from/anno_to bound the year, data_from/data_to the publication date.
--   lex    : ts_rank_cd on search_vector (id breaks ties), 2*k rows. The configuration is the plain identifier sk_unaccent (P81b-23), the one that built search_vector.
--   chunks/best/sem : nearest passage per document (candidate pool max(200, 20*take)), parents filtered through the join, 2*k rows.
--   fused  : FULL OUTER JOIN on id, RRF k = 60, ties lexical first. Filter-only (and the unrestricted call): tipo, anno NULLS LAST, numero NULLS LAST, id.
--   snippet: best passage cut at 700 characters, else the first 200 characters of text_raw. headline: only for a lexical match, via ts_headline on the final rows.
--   guard  : anno_from > anno_to and data_from > data_to raise 22P02 (a Host 400); they sit in the outer WHERE as a one-time filter so they fire even when no row is read.
WITH prm AS (
    SELECT NULLIF(btrim(@query), '') AS query,
           LEAST(GREATEST(COALESCE(@k, 10), 1), 50)::int AS k,
           COALESCE(NULLIF(btrim(@mode), ''), 'hybrid') AS mode,
           CAST(@q_vec AS vector) AS qv
),
f AS (
    SELECT d.id, d.search_vector, d.tipo, d.anno, d.numero
      FROM documents d
     WHERE (@fonte IS NULL OR d.fonte = @fonte)
       AND (@section IS NULL OR d.section = @section)
       AND (@tipo IS NULL OR d.tipo ILIKE replace(replace(replace(@tipo, '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\')
       AND (@ente IS NULL OR d.ente ILIKE '%' || replace(replace(replace(@ente, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
       AND (@anno_from IS NULL OR d.anno >= @anno_from)
       AND (@anno_to IS NULL OR d.anno <= @anno_to)
       AND (@data_from IS NULL OR d.data >= CAST(@data_from AS date))
       AND (@data_to IS NULL OR d.data <= CAST(@data_to AS date))
),
tsq AS (
    SELECT CASE WHEN prm.query IS NOT NULL THEN websearch_to_tsquery('sk_unaccent'::regconfig, prm.query) END AS q FROM prm
),
lex AS (
    SELECT r.id, r.rn
      FROM (
            SELECT f.id, row_number() OVER (ORDER BY ts_rank_cd(f.search_vector, tsq.q) DESC, f.id) AS rn
              FROM f, tsq, prm
             WHERE prm.query IS NOT NULL AND prm.mode <> 'semantic' AND f.search_vector @@ tsq.q
           ) r
     ORDER BY r.rn
     LIMIT (SELECT 2 * k FROM prm)
),
chunks AS (
    SELECT ps.document_id, ps.text, ps.embedding <=> prm.qv AS dist
      FROM passages ps
      JOIN f ON f.id = ps.document_id
     CROSS JOIN prm
     WHERE prm.query IS NOT NULL AND prm.mode <> 'lexical' AND prm.qv IS NOT NULL AND ps.embedding IS NOT NULL
     ORDER BY dist
     LIMIT (SELECT GREATEST(200, 20 * 2 * k) FROM prm)
),
best AS (
    SELECT DISTINCT ON (c.document_id) c.document_id, c.text, c.dist FROM chunks c ORDER BY c.document_id, c.dist
),
sem AS (
    SELECT r.id, r.chunk, r.rn
      FROM (SELECT b.document_id AS id, b.text AS chunk, row_number() OVER (ORDER BY b.dist, b.document_id) AS rn FROM best b) r
     ORDER BY r.rn
     LIMIT (SELECT 2 * k FROM prm)
),
fused AS (
    SELECT COALESCE(l.id, s.id) AS id, s.chunk,
           COALESCE(1.0 / (60 + l.rn), 0) + COALESCE(1.0 / (60 + s.rn), 0) AS rrf,
           COALESCE(l.rn, 1000000000) AS lex_rn,
           COALESCE(s.rn, 1000000000) AS sem_rn
      FROM lex l
      FULL OUTER JOIN sem s ON s.id = l.id
),
picked AS (
    (SELECT x.id, x.chunk, x.lex_rn, row_number() OVER (ORDER BY x.rrf DESC, x.lex_rn, x.sem_rn, x.id) AS pos
       FROM fused x
      ORDER BY pos
      LIMIT (SELECT k FROM prm))
    UNION ALL
    (SELECT f.id, NULL::text, 1000000000::bigint,
            row_number() OVER (ORDER BY f.tipo, f.anno NULLS LAST, f.numero NULLS LAST, f.id)
       FROM f, prm
      WHERE prm.query IS NULL
      ORDER BY f.tipo, f.anno NULLS LAST, f.numero NULLS LAST, f.id
      LIMIT (SELECT k FROM prm))
)
SELECT d.id,
       d.fonte,
       d.source_id,
       d.ente,
       d.tipo,
       d.section,
       d.numero,
       d.anno,
       d.data,
       d.oggetto,
       h.headline,
       COALESCE(left(k.chunk, 700), left(d.text_raw, 200)) AS snippet,
       d.text_source,
       d.source_url,
       k.pos AS "position"
  FROM picked k
  JOIN documents d ON d.id = k.id
 CROSS JOIN tsq
 CROSS JOIN LATERAL (
       SELECT CASE WHEN k.lex_rn < 1000000000
                   THEN left(ts_headline('sk_unaccent'::regconfig, d.text_raw, tsq.q, 'StartSel=«,StopSel=»,MaxFragments=2,MaxWords=28,MinWords=8'), 1500)
              END AS headline
 ) h
 WHERE (CASE WHEN @anno_from > @anno_to THEN CAST('anno_from must not exceed anno_to: ' || @anno_from || ' > ' || @anno_to AS integer) END) IS NULL
   AND (CASE WHEN @data_from > @data_to THEN CAST('data_from must not exceed data_to: ' || @data_from || ' > ' || @data_to AS integer) END) IS NULL
 ORDER BY k.pos
