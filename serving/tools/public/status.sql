-- status: live coverage per source (fonte) and the honest limits, all from the data. A fonte appears when it has documents, skipped items or coverage rows
-- (a source that listed items but took none is reported with zero documents). An empty corpus answers ONE row of zeros (fonte NULL), never an error.
-- jsonb columns: sections and text_sources are objects of counts, skipped an object reason -> count, coverage the last 20 coverage rows [{item, listed, taken, skipped, note}].
-- duplicate_identity_groups is informative: the same (fonte, ente, tipo, numero, anno) with a non-null numero.
WITH fonti AS (
    SELECT fonte FROM documents UNION SELECT fonte FROM skipped UNION SELECT fonte FROM coverage
),
docs AS (
    SELECT d.id, d.fonte, d.section, d.anno, d.text_source, d.ingested_at,
           (SELECT count(*) FROM passages p WHERE p.document_id = d.id) AS n_pass,
           (SELECT count(*) FROM passages p WHERE p.document_id = d.id AND p.embedding IS NULL) AS n_pending
      FROM documents d
),
per AS (
    SELECT fonte,
           count(*) AS documents,
           min(anno) AS first_year,
           max(anno) AS last_year,
           count(*) FILTER (WHERE text_source = 'ocr') AS ocr_documents,
           sum(n_pass)::bigint AS passages_total,
           sum(n_pending)::bigint AS passages_pending,
           max(ingested_at) AS last_ingested_at
      FROM docs
     GROUP BY fonte
),
sec AS (
    SELECT fonte, jsonb_object_agg(section, n) AS by_section
      FROM (SELECT fonte, COALESCE(section, '(none)') AS section, count(*) AS n FROM docs GROUP BY fonte, COALESCE(section, '(none)')) s
     GROUP BY fonte
),
src AS (
    SELECT fonte, jsonb_object_agg(text_source, n) AS by_source
      FROM (SELECT fonte, text_source, count(*) AS n FROM docs GROUP BY fonte, text_source) s
     GROUP BY fonte
),
skp AS (
    SELECT fonte, jsonb_object_agg(reason, n) AS by_reason
      FROM (SELECT fonte, reason, count(*) AS n FROM skipped GROUP BY fonte, reason) s
     GROUP BY fonte
),
cov AS (
    SELECT fonte,
           jsonb_agg(jsonb_build_object('item', item_id, 'listed', listed, 'taken', taken, 'skipped', skipped, 'note', note) ORDER BY noted_at DESC, item_id) AS items
      FROM (SELECT c.*, row_number() OVER (PARTITION BY c.fonte ORDER BY c.noted_at DESC, c.item_id) AS rn FROM coverage c) c
     WHERE rn <= 20
     GROUP BY fonte
),
dup AS (
    SELECT fonte, count(*) AS groups
      FROM (SELECT fonte FROM documents WHERE numero IS NOT NULL GROUP BY fonte, ente, tipo, numero, anno HAVING count(*) > 1) g
     GROUP BY fonte
),
note AS (
    SELECT 'Ide o metodicke dokumenty vo forme PDF, nie o prameň práva: záväzný je text PDF na source_url. '
           || 'Fulltext sk_unaccent skladá veľkosť písmen a diakritiku, ale nemá stemming. Skeny sú čítané OCR (text_source ocr). '
           || 'Finančný spravodajca MF SR je zbieraný od roku 2010 (roky 1999-2009 sú len archívy zip). Zber ÚVO je predvolene vypnutý (robots.txt) a nezbiera detailné záznamy. '
           || 'Passages bez embeddingu (passages_pending) nie sú dosiahnuteľné sémantickým hľadaním. Licencie FS, MF SR a ÚVO nie sú zverejnené, NBS vyžaduje uvedenie zdroja a nezmenené súbory.' AS text
)
SELECT f.fonte,
       COALESCE(per.documents, 0)::bigint AS documents,
       per.first_year,
       per.last_year,
       COALESCE(sec.by_section, '{}'::jsonb) AS sections,
       COALESCE(src.by_source, '{}'::jsonb) AS text_sources,
       COALESCE(per.ocr_documents, 0)::bigint AS ocr_documents,
       COALESCE(per.passages_total, 0)::bigint AS passages_total,
       COALESCE(per.passages_pending, 0)::bigint AS passages_pending,
       COALESCE(skp.by_reason, '{}'::jsonb) AS skipped,
       COALESCE(cov.items, '[]'::jsonb) AS coverage,
       COALESCE(dup.groups, 0)::bigint AS duplicate_identity_groups,
       per.last_ingested_at,
       (SELECT text FROM note) AS honest_limits
  FROM fonti f
  LEFT JOIN per ON per.fonte = f.fonte
  LEFT JOIN sec ON sec.fonte = f.fonte
  LEFT JOIN src ON src.fonte = f.fonte
  LEFT JOIN skp ON skp.fonte = f.fonte
  LEFT JOIN cov ON cov.fonte = f.fonte
  LEFT JOIN dup ON dup.fonte = f.fonte
UNION ALL
SELECT NULL, 0::bigint, NULL::int, NULL::int, '{}'::jsonb, '{}'::jsonb, 0::bigint, 0::bigint, 0::bigint, '{}'::jsonb, '[]'::jsonb, 0::bigint, NULL::timestamptz, (SELECT text FROM note)
 WHERE NOT EXISTS (SELECT 1 FROM fonti)
 ORDER BY 1
