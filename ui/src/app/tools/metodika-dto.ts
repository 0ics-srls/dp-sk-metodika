/** The four sources of the package, as the Tools name them (`fonte`). */
export const FONTI: readonly string[] = ['financnasprava', 'mfsr-spravodajca', 'nbs-metodicke', 'uvo-metodicke'];

/** One document of `lookup`; `total` is the size of the filtered set, repeated on every row. Never the text. */
export interface LookupRow {
  readonly id: string;
  readonly fonte: string;
  readonly sourceId: string;
  readonly ente: string | null;
  readonly tipo: string;
  readonly section: string | null;
  readonly numero: string | null;
  readonly anno: number | null;
  readonly data: Date | null;
  readonly oggetto: string | null;
  readonly sourceUrl: string | null;
  readonly textSource: string;
  readonly total: number;
}

/** One hit of `search`: the estremi, the headline (words between guillemets) or a snippet, never the whole text. */
export interface SearchHit {
  readonly id: string;
  readonly fonte: string;
  readonly sourceId: string;
  readonly ente: string | null;
  readonly tipo: string;
  readonly section: string | null;
  readonly numero: string | null;
  readonly anno: number | null;
  readonly data: Date | null;
  readonly oggetto: string | null;
  readonly headline: string | null;
  readonly snippet: string | null;
  readonly textSource: string;
  readonly sourceUrl: string | null;
  readonly position: number;
}

/** One document of `doc` with a slice of its text. */
export interface DocRecord {
  readonly id: string;
  readonly fonte: string;
  readonly sourceId: string;
  readonly legacyDocId: string | null;
  readonly ente: string | null;
  readonly tipo: string;
  readonly section: string | null;
  readonly groupLabel: string | null;
  readonly numero: string | null;
  readonly anno: number | null;
  readonly data: Date | null;
  readonly oggetto: string | null;
  readonly text: string;
  readonly textLength: number;
  readonly truncated: boolean;
  readonly nextOffset: number | null;
  readonly textSource: string;
  readonly sourceUrl: string | null;
  readonly pdfBytes: number | null;
  readonly pdfPages: number | null;
}

/** One coverage row of `status.coverage` (jsonb array). */
export interface CoverageRow {
  readonly item: string;
  readonly listed: number;
  readonly taken: number;
  readonly skipped: number;
  readonly note: string | null;
}

/** One source (fonte) of `status`; the empty corpus answers one row with `fonte` null. */
export interface StatusRow {
  readonly fonte: string | null;
  readonly documents: number;
  readonly firstYear: number | null;
  readonly lastYear: number | null;
  /** Documents per section. */
  readonly sections: Readonly<Record<string, number>>;
  /** Documents per text source (pdf / ocr). */
  readonly textSources: Readonly<Record<string, number>>;
  readonly ocrDocuments: number;
  readonly passagesTotal: number;
  readonly passagesPending: number;
  /** Skipped items of the fonte by reason. */
  readonly skipped: Readonly<Record<string, number>>;
  readonly coverage: readonly CoverageRow[];
  readonly duplicateIdentityGroups: number;
  readonly lastIngestedAt: Date | null;
  readonly honestLimits: string | null;
}

/** A Tool answer: the rows of the envelope and the codes or messages of its `warnings` (empty when the envelope has none). */
export interface ToolRows<T> {
  readonly rows: readonly T[];
  readonly warnings: readonly string[];
}

/** Wire names (camelCase) of the date members; the number members arrive as bigint text from some hosts and are coerced. */
export const DATE_KEYS: readonly string[] = ['data', 'lastIngestedAt'];
export const NUMBER_KEYS: readonly string[] = [
  'anno', 'total', 'position', 'textLength', 'nextOffset', 'pdfBytes', 'pdfPages', 'documents', 'firstYear', 'lastYear', 'ocrDocuments',
  'passagesTotal', 'passagesPending', 'duplicateIdentityGroups',
];
/** jsonb members: arrays of objects whose keys are camelised (a host that serialises jsonb as text is parsed). */
export const JSON_LIST_KEYS: readonly string[] = ['coverage'];
/** jsonb members that are maps (counts by section / text source / skip reason): parsed, keys left as they are. */
export const JSON_MAP_KEYS: readonly string[] = ['sections', 'textSources', 'skipped'];
