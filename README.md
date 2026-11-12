# dp-sk-metodika

Data Package `sk-metodika` (open-lex-it, phase 81b): Slovak methodological guidance published as PDF by Financna sprava SR, the Ministry of Finance (Financny
spravodajca), Narodna banka Slovenska and, when explicitly enabled, Urad pre verejne obstaravanie. Each PDF becomes one document with its text (text layer, local OCR
as the fallback), a full-text vector and embeddable passages. Dataset schema `ds_sk_metodika`. Guidance is not a source of law: the binding text is the PDF at
`source_url`.

## Layout

| Path | Content |
|---|---|
| `dataplatform.json` | Manifest: two Source types (`fs-sections`, `pdf-sites`), licences, pipeline, dataset |
| `schema/migrations/` | `0001_init.sql` (4 tables), `0002_sk_unaccent.sql` (text search configuration), `0003_search.sql` (generated `search_vector`, indexes) |
| `serving/dataset.odcs.yaml` | data contract (columns, `largeValue` text columns, search properties, `ftsConfig sk_unaccent`) |
| `serving/tools/public/` | the five curated Tools (`<tool>.json` + `<tool>.sql`, pure SQL with named `@params`) |
| `tests/sql/` | the package's own SQL tests (`001`-`007` schema, `020`-`027` search, `030`-`035` doc, `040`-`043` lookup, `050`-`051` guide, `060`-`063` status) |
| `tests/tools/` | one call per Tool (`search`, `doc`, `lookup`, `guide`, `status`) |

## Schema `ds_sk_metodika`

| Table | Content |
|---|---|
| `documents` | one row per PDF, identity `(fonte, source_id)`; `fonte` is one of `financnasprava`, `mfsr-spravodajca`, `nbs-metodicke`, `uvo-metodicke`; ente, tipo, section, group_label, numero, anno, data, oggetto, `text_raw`, `text_source` (pdf, ocr), `source_url`, PDF size and pages, generated `search_vector` |
| `passages` | embeddable passages of a document (`text_contextual` is what is embedded), `embedding vector(1024)` HNSW cosine |
| `skipped` | items seen but not turned into a document, with the reason |
| `coverage` | listed versus taken per Catalog item, with a note |

`numero`, `anno` and `data` are NULL when the source does not give them (the legacy filled the source id and year 0).

## Source configs

| Source type | Setting | Meaning |
|---|---|---|
| `fs-sections` | `sections` | Financna sprava sections, default all four: `metodicke-pokyny`, `metodicke-usmernenia`, `zavery-komisii`, `prehlady-zmluv-zdz` |
| `pdf-sites` | `sites` | `mfsr-spravodajca`, `nbs-metodicke`, `uvo-metodicke` (default: the first two) |
| `pdf-sites` | `annoFrom`, `annoTo` | years of the Financny spravodajca (from 2010; earlier years hold only zip archives, which are not collected) |
| `pdf-sites` | `uvoRobotsAck` | default false; required for `uvo-metodicke` (see below) |
| both | `only`, `maxDocs` | sample filters (a document, a maximum per item) |
| both | `delaySeconds`, `verifyTls`, `baseUrl` | pause between requests (default and minimum 0.6 s), TLS (leave on), base URL (replay servers only) |
| both | `refreshToken` | change it to fetch every listing again |
| both | `tokenBudget`, `dryRun` | embedding budget per Run (default 20000) and the embedding dry run |

## Pins

Classes (all `0ics-srls`, tag `v0.1.0`): `dp-sk-metodika-detect`, `dp-sk-metodika-grab`, `dp-sk-metodika-convert`, `dp-sk-metodika-ingest`; shared embed class
`dp-lex-embed@dp-p7.1`. Full-text configuration `sk_unaccent` (simple + unaccent: case and diacritics folded, no stemming; migration 0002; the Host provides the
`unaccent` extension). The generated column, the contract (`ftsConfig`) and every Tool use the same plain identifier `sk_unaccent`.

## Tools (Gateway names `sk-metodika_<tool>`)

| Tool | Purpose |
|---|---|
| `search` | hybrid search (sk_unaccent full-text + best passage per document, reciprocal rank fusion); `mode` hybrid, lexical, semantic; filters `fonte`, `section`, `tipo`, `ente`, `anno_from`, `anno_to`, `data_from`, `data_to`; `k` 1..50; no query lists the documents by tipo, anno, numero |
| `doc` | one document by `id`, or `fonte` + `source_id`, or `tipo` + `numero` + `anno` (one form is required), text in slices (`offset`, `length` default 20000 max 50000, `truncated`, `next_offset`) |
| `lookup` | structured list by extremes (port of the branch-53 `query_prassi`), `sort` data_desc, data_asc, tipo, anno_numero, paging with `total`, never the text |
| `guide` | usage text for agents (Slovak, short Italian section) and the honest limits |
| `status` | live coverage per source from the data (documents, years, sections, text source mix, OCR, passages and pending embeddings, skipped by reason, coverage, duplicate identity groups) and the honest limits |

`search` and `lookup` accept an empty call (a Screen opens with it). Generated Tools of the four tables never return `text_raw`, `text` or `text_contextual`
(`largeValue`); no Tool selects `passages.embedding`. Differences from the legacy `search_prassi` / `get_prassi`: `mode`, `fonte` and `section`, `k > 50` is an
error instead of a clamp, an unknown document answers no row instead of 404, the text comes in slices, a query typed without diacritics finds the text with
diacritics (the legacy `simple` configuration did not), inflected forms still do not match (no stemming; the semantic channel compensates).

## Licence and robots

- Financna sprava, MF SR and UVO publish no terms of use: licence entry `source-terms-not-published`. A public Grant of this data is blocked until the user decides.
- NBS (`https://nbs.sk/disclaimer-sk/`): reuse allowed, NBS must be named as the source and the electronic file must not be altered (`nbs-reuse-attribution-no-alteration`).
  The corpus text is a derived extract; the PDF at `source_url` is the original.
- `robots.txt` of `uvo.gov.sk` is `User-agent: *  Disallow: /` for generic agents. The UVO adapter is therefore OFF by default (`uvoRobotsAck=false`): the grab refuses
  `uvo-metodicke` without the acknowledgement and quotes the rule. Even when enabled it takes the layouts (a) `/extdoc/` and (b) direct `/fileadmin` PDFs only; layout (c),
  the detail records of the two per-law leaves (about 8,000), is not collected. MF SR Financny spravodajca 1999-2009 exists only as zip archives and is not collected.

## The legacy identity fix

The legacy keyed documents by the slug of the PDF file name: 44 stems repeat in the MF SR collection, so 70 documents would overwrite one another. Here `source_id` is
derived from the unique URL path (query string dropped), the legacy `doc_id` is kept in `legacy_doc_id`, and the key is `unique(fonte, source_id)`. The stale UVO
selector of the legacy (`/extdoc/` only) is fixed for layout (b). `status` reports `duplicate_identity_groups` (same `fonte`, `ente`, `tipo`, `numero`, `anno` with a numero) as information.

## Version history

0.1.0: first release (data, five Tools). See `releases.breakingChanges` in the Manifest.
