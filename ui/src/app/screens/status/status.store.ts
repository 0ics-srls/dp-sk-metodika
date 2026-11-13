import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { CoverageRow, StatusRow } from '../../tools/metodika-dto';
import { MetodikaTools } from '../../tools/metodika-tools';

export interface CountGroup {
  readonly fonte: string;
  readonly entries: readonly { readonly name: string; readonly count: number }[];
}

export interface CoverageLine extends CoverageRow {
  readonly key: string;
  readonly fonte: string;
}

function groupsOf(rows: readonly StatusRow[], pick: (row: StatusRow) => Readonly<Record<string, number>>): readonly CountGroup[] {
  const groups: CountGroup[] = [];
  for (const row of rows) {
    const entries = Object.entries(pick(row)).map(([name, count]) => ({ name, count }));
    if (row.fonte !== null && entries.length > 0) {
      groups.push({ fonte: row.fonte, entries });
    }
  }
  return groups;
}

@Injectable()
export class StatusStore {
  private readonly tools = inject(MetodikaTools);

  readonly rows = signal<readonly StatusRow[]>([]);
  readonly loading = signal(false);
  /** Translation key of the failure, null when fine. */
  readonly error = signal<string | null>(null);
  readonly errorDetail = signal('');

  /** The per-fonte rows; the empty corpus answers one row of zeros without fonte, which is not a row of the table. */
  readonly dataRows = computed(() => this.rows().filter((row) => row.fonte !== null));
  /** True once a load has finished: before it the Screen shows the loading line, not "no documents". */
  readonly loaded = signal(false);
  readonly empty = computed(() => this.loaded() && this.dataRows().length === 0 && this.error() === null);
  /** The honest-limits text is built from the data and is the same on every row: shown once. */
  readonly limits = computed(() => this.rows().find((row) => row.honestLimits !== null && row.honestLimits !== '')?.honestLimits ?? null);

  readonly sections = computed(() => groupsOf(this.dataRows(), (row) => row.sections));
  readonly skipped = computed(() => groupsOf(this.dataRows(), (row) => row.skipped));

  readonly coverage = computed<readonly CoverageLine[]>(() =>
    this.dataRows().flatMap((row) =>
      row.coverage.map((line, index) => ({ ...line, key: `${row.fonte ?? ''}|${line.item}|${String(index)}`, fonte: row.fonte ?? '' })),
    ),
  );

  /** pdf documents of a row (the text source mix; ocr documents are counted apart). */
  pdfDocuments(row: StatusRow): number {
    return row.textSources.pdf ?? Math.max(0, row.documents - row.ocrDocuments);
  }

  private request = 0;

  constructor() {
    // an effect, not a constructor call: the context input is set after construction (P78-30)
    effect(() => {
      untracked(() => void this.refresh());
    });
  }

  async refresh(): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    try {
      const { rows } = await this.tools.status();
      if (request !== this.request) {
        return;
      }
      this.rows.set(rows);
      this.error.set(null);
      this.errorDetail.set('');
    } catch (error) {
      if (request !== this.request) {
        return;
      }
      this.rows.set([]);
      this.error.set('common.error');
      this.errorDetail.set(error instanceof Error ? error.message : String(error));
    } finally {
      if (request === this.request) {
        this.loading.set(false);
        this.loaded.set(true);
      }
    }
  }
}
