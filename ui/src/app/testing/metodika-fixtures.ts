/** Wire rows (snake case, like the Tool SQL returns them) for the specs. */
export type WireRow = Record<string, unknown>;

export const DOC_ID = '3f2b8c1e-6d3a-4a52-9f0e-1c2d3e4f5a6b';
export const OTHER_ID = '9c1d7e2a-4b5f-4c6d-8e7f-0a1b2c3d4e5f';

/** One row of `lookup`; `total` is the size of the filtered set, repeated on every row. */
export function lookupWire(over: WireRow = {}): WireRow {
  return {
    id: DOC_ID,
    fonte: 'financnasprava',
    source_id: 'dokument_abc',
    ente: 'Financna sprava SR',
    tipo: 'metodicky pokyn',
    section: 'metodicke-pokyny',
    numero: '10/DZPaU/2026/MP',
    anno: 2026,
    data: '2026-03-04',
    oggetto: 'Metodicky pokyn k dani z prijmov',
    source_url: 'https://www.financnasprava.sk/dokument_abc.pdf',
    text_source: 'pdf',
    total: 3,
    ...over,
  };
}

/** One row of `search`. */
export function searchWire(over: WireRow = {}): WireRow {
  return {
    id: DOC_ID,
    fonte: 'financnasprava',
    source_id: 'dokument_abc',
    ente: 'Financna sprava SR',
    tipo: 'metodicky pokyn',
    section: 'metodicke-pokyny',
    numero: '10/DZPaU/2026/MP',
    anno: 2026,
    data: '2026-03-04',
    oggetto: 'Metodicky pokyn k dani z prijmov',
    headline: 'Postup pri «dani z prijmov» fyzickych osob',
    snippet: 'Tento pokyn upravuje postup pri dani z prijmov.',
    text_source: 'pdf',
    source_url: 'https://www.financnasprava.sk/dokument_abc.pdf',
    position: 1,
    ...over,
  };
}

export const WARNING_ENVELOPE = (data: readonly WireRow[]): { data: readonly WireRow[]; warnings: readonly { code: string; message: string }[] } => ({
  data,
  warnings: [{ code: 'embed_unavailable', message: 'The embedding provider is unavailable; the result is lexical only.' }],
});

/** One row of `doc` (a slice of the text). */
export function docWire(over: WireRow = {}): WireRow {
  return {
    id: DOC_ID,
    fonte: 'financnasprava',
    source_id: 'dokument_abc',
    legacy_doc_id: '10_DZPaU_2026_MP',
    ente: 'Financna sprava SR',
    tipo: 'metodicky pokyn',
    section: 'metodicke-pokyny',
    group_label: 'Dane z prijmov',
    numero: '10/DZPaU/2026/MP',
    anno: 2026,
    data: '2026-03-04',
    oggetto: 'Metodicky pokyn k dani z prijmov',
    text: 'Prvy usek textu.',
    text_length: 16,
    truncated: false,
    next_offset: null,
    text_source: 'pdf',
    source_url: 'https://www.financnasprava.sk/dokument_abc.pdf',
    pdf_bytes: 204800,
    pdf_pages: 12,
    ...over,
  };
}

/** One coverage row of `status.coverage`. */
export function coverageWire(over: WireRow = {}): WireRow {
  return { item: 'fs:metodicke-pokyny', listed: 40, taken: 38, skipped: 2, note: null, ...over };
}

/** One fonte row of `status`; the jsonb members arrive as JSON values (D114). */
export function statusWire(over: WireRow = {}): WireRow {
  return {
    fonte: 'financnasprava',
    documents: 120,
    first_year: 2014,
    last_year: 2026,
    sections: { 'metodicke-pokyny': 80, 'metodicke-usmernenia': 40 },
    text_sources: { pdf: 113, ocr: 7 },
    ocr_documents: 7,
    passages_total: 900,
    passages_pending: 0,
    skipped: { ocr_empty: 2 },
    coverage: [coverageWire(), coverageWire({ item: 'pdf:mfsr-spravodajca:2005', listed: 1, taken: 0, skipped: 1, note: 'zip_archives_only' })],
    duplicate_identity_groups: 0,
    last_ingested_at: '2026-11-10T08:30:00Z',
    honest_limits: 'Ide o metodicke dokumenty vo forme PDF, nie o pramen prava.',
    ...over,
  };
}

/** The single row the Tool answers on an empty corpus. */
export function emptyStatusWire(): WireRow {
  return statusWire({
    fonte: null,
    documents: 0,
    first_year: null,
    last_year: null,
    sections: {},
    text_sources: {},
    ocr_documents: 0,
    passages_total: 0,
    passages_pending: 0,
    skipped: {},
    coverage: [],
    last_ingested_at: null,
  });
}
