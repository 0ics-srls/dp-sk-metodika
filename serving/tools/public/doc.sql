-- doc: one document by id, by fonte + source_id or by its estremi tipo + numero + anno, the text in slices (the legacy get_prassi envelope as columns:
-- truncated, text_length, next_offset). The parameter schema requires one of the three key forms (anyOf); id wins over fonte + source_id, which wins over the estremi.
-- The estremi can match several rows (a repeated identity; NBS stanoviska without numero are not addressable that way): up to 5 rows, newest date first
-- (a missing date last), source_id and id break ties. tipo is compared case-insensitively.
WITH prm AS (SELECT CAST(@offset AS int) AS o, CAST(@length AS int) AS l)
SELECT d.id,
       d.fonte,
       d.source_id,
       d.legacy_doc_id,
       d.ente,
       d.tipo,
       d.section,
       d.group_label,
       d.numero,
       d.anno,
       d.data,
       d.oggetto,
       substr(d.text_raw, prm.o + 1, prm.l) AS text,
       length(d.text_raw) AS text_length,
       (prm.o + prm.l < length(d.text_raw)) AS truncated,
       CASE WHEN prm.o + prm.l < length(d.text_raw) THEN prm.o + prm.l END AS next_offset,
       d.text_source,
       d.source_url,
       d.pdf_bytes,
       d.pdf_pages
  FROM documents d
 CROSS JOIN prm
 WHERE (@id IS NOT NULL AND d.id = CAST(@id AS uuid))
    OR (@id IS NULL AND @source_id IS NOT NULL AND d.fonte = @fonte AND d.source_id = @source_id)
    OR (@id IS NULL AND @source_id IS NULL AND lower(d.tipo) = lower(@tipo) AND d.numero = @numero AND d.anno = @anno)
 ORDER BY d.data DESC NULLS LAST, d.source_id, d.id
 LIMIT 5
