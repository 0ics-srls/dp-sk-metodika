import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import { parseDocKey } from '../../shared/doc-key';
import { licenceKey } from '../../shared/fonte';
import { httpsUrl } from '../../shared/safe-url';
import type { DocRecord } from '../../tools/metodika-dto';
import { MetodikaTools } from '../../tools/metodika-tools';

export type LoadState = 'idle' | 'loading' | 'ready' | 'notfound' | 'error';

/**
 * The detail Screen: one document named by the route key `doc~<uuid>`, loaded when the key changes (an effect, never in the constructor, P78-30).
 * The key is the uuid only: the natural key of a document (e.g. `MF/013819/2025-74`) contains `/` and would need encoding, a uuid does not.
 */
@Injectable()
export class DocumentStore {
  private readonly tools = inject(MetodikaTools);
  private readonly context = injectPackageContext();

  readonly key = computed(() => parseDocKey(this.context().subPath));
  readonly state = signal<LoadState>('idle');
  readonly errorDetail = signal('');

  /** The document row of the first slice (header, source); `truncated` and `nextOffset` follow the last slice. */
  readonly doc = signal<DocRecord | null>(null);
  /** The slices loaded so far, concatenated. */
  readonly text = signal('');
  readonly loadingMore = signal(false);
  readonly moreError = signal('');
  readonly sourceLink = computed(() => httpsUrl(this.doc()?.sourceUrl));
  readonly hasMore = computed(() => this.doc()?.truncated === true && this.doc()?.nextOffset !== null);
  readonly licence = computed(() => licenceKey(this.doc()?.fonte ?? null));
  /** Size of the PDF in whole kilobytes, null when unknown. */
  readonly pdfKb = computed(() => {
    const bytes = this.doc()?.pdfBytes ?? null;
    return bytes === null ? null : Math.round(bytes / 1024);
  });

  private request = 0;

  constructor() {
    effect(() => {
      const key = this.key();
      untracked(() => void this.load(key));
    });
  }

  back(): void {
    this.context().navigateScreen('corpus');
  }

  async nextSlice(): Promise<void> {
    const current = this.doc();
    const key = this.key();
    if (current === null || key === null || current.nextOffset === null || this.loadingMore()) {
      return;
    }
    const request = this.request;
    this.loadingMore.set(true);
    this.moreError.set('');
    try {
      const { rows } = await this.tools.doc({ id: key, offset: current.nextOffset });
      const slice = rows[0];
      if (request !== this.request || slice === undefined) {
        return;
      }
      this.text.update((text) => text + slice.text);
      this.doc.set({ ...current, truncated: slice.truncated, nextOffset: slice.nextOffset });
    } catch (error) {
      if (request === this.request) {
        this.moreError.set(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (request === this.request) {
        this.loadingMore.set(false);
      }
    }
  }

  private reset(): void {
    this.errorDetail.set('');
    this.doc.set(null);
    this.text.set('');
    this.loadingMore.set(false);
    this.moreError.set('');
  }

  private async load(key: string | null): Promise<void> {
    const request = ++this.request;
    this.reset();
    if (key === null) {
      this.state.set('idle');
      return;
    }
    this.state.set('loading');
    try {
      const { rows } = await this.tools.doc({ id: key });
      if (request !== this.request) {
        return;
      }
      const [first] = rows;
      this.doc.set(first ?? null);
      this.text.set(first?.text ?? '');
      this.state.set(first === undefined ? 'notfound' : 'ready');
    } catch (error) {
      if (request !== this.request) {
        return;
      }
      this.errorDetail.set(error instanceof Error ? error.message : String(error));
      this.state.set('error');
    }
  }
}
