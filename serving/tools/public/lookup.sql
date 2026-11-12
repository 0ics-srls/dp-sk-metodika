-- lookup (port of the branch-53 query_prassi, a DevExtreme loadOptions lookup over prassi.documenti): the estremi of the documents that match the filters, never the text.
-- Fields of the legacy PrassiRow (PrassiQueryService, branch 53-ingest-normativa-da-capo): Id, Ente, Tipo, Numero, Anno, Data, Oggetto, SourceUrl.
-- Legacy filterable fields: Ente, Tipo, Numero, Anno, Data (operators = <> < <= > >=); sortable: Tipo, Anno, Numero, Data; take max 50, default 20.
-- Differences here: explicit parameters instead of loadOptions; tipo is a case-insensitive equality, numero an escaped case-insensitive prefix, ente an escaped
-- substring (% _ and \ are literal); data is a range (data_from, data_to); fonte and section are added (four sources); source_id and text_source are added;
-- oggetto is cut at 300 characters. The sort is a CASE on the enum (no dynamic SQL); a missing value is last in both directions and the id breaks ties.
-- total is a window count: the size of the filtered set, constant across pages.
WITH prm AS (
    SELECT COALESCE(NULLIF(btrim(@sort), ''), 'data_desc') AS sort,
           LEAST(GREATEST(COALESCE(@limit, 20), 1), 50)::int AS lim,
           GREATEST(COALESCE(@offset, 0), 0)::int AS off
),
f AS (
    SELECT d.id, d.fonte, d.source_id, d.ente, d.tipo, d.section, d.numero, d.number, d.anno, d.data, d.oggetto, d.source_url, d.text_source
      FROM documents d
     WHERE (@fonte IS NULL OR d.fonte = @fonte)
       AND (@section IS NULL OR d.section = @section)
       AND (@tipo IS NULL OR d.tipo ILIKE replace(replace(replace(@tipo, '\', '\\'), '%', '\%'), '_', '\_') ESCAPE '\')
       AND (@numero IS NULL OR d.numero ILIKE replace(replace(replace(@numero, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
       AND (@anno IS NULL OR d.anno = @anno)
       AND (@data_from IS NULL OR d.data >= CAST(@data_from AS date))
       AND (@data_to IS NULL OR d.data <= CAST(@data_to AS date))
       AND (@ente IS NULL OR d.ente ILIKE '%' || replace(replace(replace(@ente, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
)
SELECT f.id,
       f.fonte,
       f.source_id,
       f.ente,
       f.tipo,
       f.section,
       f.numero,
       f.anno,
       f.data,
       left(f.oggetto, 300) AS oggetto,
       f.source_url,
       f.text_source,
       count(*) OVER () AS total
  FROM f
 CROSS JOIN prm
 ORDER BY CASE WHEN prm.sort = 'data_asc' THEN f.data END ASC NULLS LAST,
          CASE WHEN prm.sort = 'data_desc' THEN f.data END DESC NULLS LAST,
          CASE WHEN prm.sort = 'tipo' THEN f.tipo END ASC NULLS LAST,
          CASE WHEN prm.sort = 'tipo' THEN f.anno END ASC NULLS LAST,
          CASE WHEN prm.sort = 'tipo' THEN f.numero END ASC NULLS LAST,
          CASE WHEN prm.sort = 'anno_numero' THEN f.anno END ASC NULLS LAST,
          CASE WHEN prm.sort = 'anno_numero' THEN f.number END ASC NULLS LAST,
          CASE WHEN prm.sort = 'anno_numero' THEN f.numero END ASC NULLS LAST,
          f.id
 LIMIT (SELECT lim FROM prm) OFFSET (SELECT off FROM prm)
