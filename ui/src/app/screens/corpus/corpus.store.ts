import { computed, inject, Injectable, signal } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import { docKey } from '../../shared/doc-key';
import { ListStore, toYear } from '../../shared/list-store';
import { httpsUrl } from '../../shared/safe-url';
import { textParts, type TextPart } from '../../shared/text-parts';
import { MetodikaTools } from '../../tools/metodika-tools';

/** The Tool `lookup` pages by its default limit; the Screen does not send a limit so that the first open is the empty argument object (P79-56). */
export const PAGE_SIZE = 20;
/** Hits asked from `search` (the Tool maximum). */
export const SEARCH_K = 50;
/** The sort the Tool applies when none is sent; it is never sent. */
export const DEFAULT_SORT = 'data_desc';

export type SearchMode = 'hybrid' | 'lexical' | 'semantic';
export type SortKey = 'data_desc' | 'data_asc' | 'tipo' | 'anno_numero';

export interface CorpusQuery {
  readonly text: string;
  /** One of the Tool `fonte` values, or the empty string for all four. */
  readonly fonte: string;
  readonly tipo: string;
  readonly annoFrom: number | undefined;
  readonly annoTo: number | undefined;
  readonly mode: SearchMode;
  readonly sort: SortKey;
  readonly offset: number;
}

/** One line of the list, whichever Tool produced it. */
export interface CorpusItem {
  readonly key: string;
  readonly id: string;
  readonly fonte: string;
  readonly tipo: string;
  readonly numero: string | null;
  readonly anno: number | null;
  readonly data: Date | null;
  readonly ente: string | null;
  readonly oggetto: string | null;
  readonly headline: readonly TextPart[];
  readonly snippet: string | null;
  readonly ocr: boolean;
  /** Only an https link; the empty string otherwise. */
  readonly sourceUrl: string;
}

/** Text goes to `search`; the filters without text (and the empty box) go to `lookup`. */
export function toolOf(query: CorpusQuery): 'search' | 'lookup' {
  return query.text === '' ? 'lookup' : 'search';
}

const orUndefined = (value: string): string | undefined => (value === '' ? undefined : value);
const edge = (value: number, end: string): string => `${String(value).padStart(4, '0')}-${end}`;

@Injectable()
export class CorpusStore extends ListStore<CorpusQuery, CorpusItem> {
  private readonly tools = inject(MetodikaTools);
  private readonly context = injectPackageContext();
  private readonly total = signal(0);

  /** Warnings of the last answer (a degraded search is lexical only). */
  readonly warnings = signal<readonly string[]>([]);
  readonly tool = computed(() => toolOf(this.query()));
  readonly paged = computed(() => this.tool() === 'lookup');
  readonly offset = computed(() => this.query().offset);
  readonly count = computed(() => this.total());
  readonly from = computed(() => (this.count() === 0 ? 0 : this.offset() + 1));
  readonly to = computed(() => Math.min(this.offset() + PAGE_SIZE, this.count()));
  readonly hasPrevious = computed(() => this.paged() && this.offset() > 0);
  readonly hasNext = computed(() => this.paged() && this.offset() + PAGE_SIZE < this.count());

  constructor() {
    super({ text: '', fonte: '', tipo: '', annoFrom: undefined, annoTo: undefined, mode: 'hybrid', sort: DEFAULT_SORT, offset: 0 }, true);
  }

  search(text: string): void {
    this.edit({ text: text.trim(), offset: 0 });
  }

  tipo(text: string): void {
    this.edit({ tipo: text.trim(), offset: 0 });
  }

  annoFrom(text: string): void {
    this.edit({ annoFrom: toYear(text), offset: 0 });
  }

  annoTo(text: string): void {
    this.edit({ annoTo: toYear(text), offset: 0 });
  }

  fonte(fonte: string): void {
    this.choose({ fonte, offset: 0 });
  }

  mode(mode: string): void {
    this.choose({ mode: mode === 'lexical' || mode === 'semantic' ? mode : 'hybrid', offset: 0 });
  }

  sort(sort: string): void {
    this.choose({ sort: sort === 'data_asc' || sort === 'tipo' || sort === 'anno_numero' ? sort : DEFAULT_SORT, offset: 0 });
  }

  next(): void {
    if (this.hasNext()) {
      this.choose({ offset: this.offset() + PAGE_SIZE });
    }
  }

  previous(): void {
    if (this.hasPrevious()) {
      this.choose({ offset: Math.max(0, this.offset() - PAGE_SIZE) });
    }
  }

  open(item: CorpusItem): void {
    this.context().navigateScreen('document', docKey(item.id));
  }

  protected override async readRows(query: CorpusQuery): Promise<readonly CorpusItem[]> {
    const fonte = orUndefined(query.fonte);
    const tipo = orUndefined(query.tipo);
    if (toolOf(query) === 'search') {
      const { rows, warnings } = await this.tools.search({
        query: query.text,
        k: SEARCH_K,
        mode: query.mode === 'hybrid' ? undefined : query.mode,
        fonte,
        tipo,
        annoFrom: query.annoFrom,
        annoTo: query.annoTo,
      });
      this.total.set(rows.length);
      this.warnings.set(warnings);
      return rows.map((hit) => ({
        key: `${hit.id}|${String(hit.position)}`,
        id: hit.id,
        fonte: hit.fonte,
        tipo: hit.tipo,
        numero: hit.numero,
        anno: hit.anno,
        data: hit.data,
        ente: hit.ente,
        oggetto: hit.oggetto,
        headline: textParts(hit.headline),
        snippet: hit.snippet,
        ocr: hit.textSource === 'ocr',
        sourceUrl: httpsUrl(hit.sourceUrl),
      }));
    }

    const { annoFrom, annoTo } = query;
    const sameYear = annoFrom !== undefined && annoFrom === annoTo;
    const { rows, warnings } = await this.tools.lookup({
      fonte,
      tipo,
      anno: sameYear ? annoFrom : undefined,
      dataFrom: !sameYear && annoFrom !== undefined ? edge(annoFrom, '01-01') : undefined,
      dataTo: !sameYear && annoTo !== undefined ? edge(annoTo, '12-31') : undefined,
      sort: query.sort === DEFAULT_SORT ? undefined : query.sort,
      offset: query.offset > 0 ? query.offset : undefined,
    });
    this.total.set(rows[0]?.total ?? 0);
    this.warnings.set(warnings);
    return rows.map((row) => ({
      key: row.id,
      id: row.id,
      fonte: row.fonte,
      tipo: row.tipo,
      numero: row.numero,
      anno: row.anno,
      data: row.data,
      ente: row.ente,
      oggetto: row.oggetto,
      headline: [],
      snippet: null,
      ocr: row.textSource === 'ocr',
      sourceUrl: httpsUrl(row.sourceUrl),
    }));
  }
}
