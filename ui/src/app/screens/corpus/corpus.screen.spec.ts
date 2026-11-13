import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { metodikaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { DOC_ID, lookupWire, searchWire, WARNING_ENVELOPE } from '../../testing/metodika-fixtures';
import { callsOf, schemaViolations, stubMetodikaEnvironment } from '../../testing/stub-metodika-tools';
import { CorpusScreen } from './corpus.screen';

type Handler = (input: object) => unknown;

interface Handlers {
  readonly lookup?: Handler;
  readonly search?: Handler;
}

function setup(handlers: Handlers, overrides: Parameters<typeof stubMetodikaEnvironment>[1] = {}) {
  const env = stubMetodikaEnvironment(
    { lookup: handlers.lookup ?? (() => []), search: handlers.search ?? (() => []), doc: () => [], status: () => [] },
    { locale: 'en', ...overrides },
  );
  TestBed.configureTestingModule({ providers: [...metodikaProviders] });
  const fixture = TestBed.createComponent(CorpusScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<CorpusScreen>;

async function settle(fixture: Fixture, ms = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  fixture.detectChanges();
  for (let i = 0; i < 3; i++) {
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const all = (fixture: Fixture, id: string): HTMLElement[] => [...root(fixture).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

function type(fixture: Fixture, id: string, value: string): void {
  const input = el(fixture, id) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function choose(fixture: Fixture, id: string, value: string): void {
  const select = el(fixture, id) as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

const pagedList = (total: number): Handler => (input) => {
  const { offset, limit } = input as { offset?: number; limit?: number };
  const from = offset ?? 0;
  return Array.from({ length: Math.max(0, Math.min(limit ?? 20, total - from)) }, (_, i) =>
    lookupWire({ id: `00000000-0000-0000-0000-${String(from + i + 1).padStart(12, '0')}`, numero: `N${String(from + i + 1)}`, total }),
  );
};

describe('CorpusScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('first open', () => {
    it('should call lookup once with an empty argument object and nothing else when the Screen opens', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire(), lookupWire({ numero: '9/2026', total: 3 })] });
      expect(env.calls).toEqual([]); // nothing in the constructor (P78-30)
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'lookup')).toEqual([{}]);
      expect(callsOf(env, 'search')).toEqual([]);
      expect(env.calls).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
      const rows = all(fixture, 'corpus-row');
      expect(rows).toHaveLength(2);
      expect(rows[0]?.textContent).toContain('Financna sprava SR');
      expect(rows[0]?.textContent).toContain('metodicky pokyn');
      expect(rows[0]?.textContent).toContain('10/DZPaU/2026/MP');
      expect(rows[0]?.textContent).not.toContain('10/DZPaU/2026/MP/2026');
      expect(rows[0]?.textContent).toContain('Metodicky pokyn k dani z prijmov');
      expect(rows[0]?.textContent).toContain('2026-03-04');
    });

    it('should keep numero as text and say no number when numero is null', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire({ numero: null, fonte: 'nbs-metodicke' })] });
      fixture.detectChanges();
      await settle(fixture);
      expect(all(fixture, 'corpus-row')[0]?.textContent).toContain('no number');
      expect(all(fixture, 'corpus-row')[0]?.textContent).toContain('NBS');
    });

    it('should show the attribution, the not-a-source-of-law line and the no-stemming hint when the Screen opens', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-attribution').textContent).toContain('Financna sprava SR, Ministerstvo financii SR, NBS, UVO');
      expect(el(fixture, 'corpus-not-law').textContent).toContain('NOT a source of law');
      expect(el(fixture, 'corpus-stemming').textContent).toContain('no stemming');
    });

    it('should render Slovak texts when the locale is sk', async () => {
      const { fixture } = setup({ lookup: () => [] }, { locale: 'sk' });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Metodika SR');
    });

    it('should render Italian texts when the locale is it', async () => {
      const { fixture } = setup({ lookup: () => [] }, { locale: 'it' });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Prassi e metodica slovacca');
    });

    it('should mark scanned documents with an OCR badge only when text_source is ocr', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire(), lookupWire({ id: '00000000-0000-0000-0000-000000000002', text_source: 'ocr' })] });
      fixture.detectChanges();
      await settle(fixture);
      const rows = all(fixture, 'corpus-row');
      expect(rows[0]?.querySelector('[data-testid="corpus-ocr"]')).toBeNull();
      expect(rows[1]?.querySelector('[data-testid="corpus-ocr"]')?.textContent).toBe('OCR');
    });
  });

  describe('paging of the list', () => {
    it('should ask offset 20 (the Tool default page) when the next page is chosen and show the range from total', async () => {
      const { env, fixture } = setup({ lookup: pagedList(45) });
      fixture.detectChanges();
      await settle(fixture);
      expect(all(fixture, 'corpus-row')).toHaveLength(20);
      expect(el(fixture, 'corpus-range').textContent).toContain('1-20');
      expect(el(fixture, 'corpus-range').textContent).toContain('45');
      expect((el(fixture, 'corpus-prev') as HTMLButtonElement).disabled).toBe(true);
      el(fixture, 'corpus-next').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ offset: 20 });
      expect(all(fixture, 'corpus-row')[0]?.textContent).toContain('N21');
      expect((el(fixture, 'corpus-prev') as HTMLButtonElement).disabled).toBe(false);
      el(fixture, 'corpus-next').click();
      await settle(fixture);
      expect(el(fixture, 'corpus-range').textContent).toContain('41-45');
      expect((el(fixture, 'corpus-next') as HTMLButtonElement).disabled).toBe(true);
      el(fixture, 'corpus-prev').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ offset: 20 });
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should send the sort choice only when it differs from the Tool default', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-sort', 'anno_numero');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ sort: 'anno_numero' });
      choose(fixture, 'corpus-sort', 'data_desc');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
      expect(schemaViolations(env)).toEqual([]);
    });
  });

  describe('search', () => {
    it('should call search once with the query and k 50 after the debounce when the user types', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'metod');
      await settle(fixture, 100);
      type(fixture, 'corpus-search', 'metodicky pokyn');
      await settle(fixture, 100);
      expect(callsOf(env, 'search')).toEqual([]); // still inside the debounce
      await settle(fixture, 300);
      expect(callsOf(env, 'search')).toEqual([{ query: 'metodicky pokyn', k: 50 }]);
      expect(callsOf(env, 'lookup')).toEqual([{}]);
      expect(all(fixture, 'corpus-row')).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should send fonte, tipo, the year range and a non-default mode with the query when filters are set', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-fonte', 'nbs-metodicke');
      await settle(fixture);
      type(fixture, 'corpus-tipo', 'stanovisko');
      type(fixture, 'corpus-anno-from', '2023');
      type(fixture, 'corpus-anno-to', '2025');
      choose(fixture, 'corpus-mode', 'lexical');
      type(fixture, 'corpus-search', 'dan');
      await settle(fixture, 400);
      expect(callsOf(env, 'search').at(-1)).toEqual({ query: 'dan', k: 50, mode: 'lexical', fonte: 'nbs-metodicke', tipo: 'stanovisko', anno_from: 2023, anno_to: 2025 });
      expect(el(fixture, 'corpus-mode-shown').textContent).toContain('lexical');
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should render the marked words as mark text nodes and never as html when the headline carries markers and a script', async () => {
      const headline = 'Postup «dan z prijmov» <script>alert(1)</script> <img src=x onerror=alert(2)>';
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire({ headline })] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'dan');
      await settle(fixture, 400);
      const line = el(fixture, 'corpus-headline');
      const marks = [...line.querySelectorAll('mark')];
      expect(marks.map((mark) => mark.textContent)).toEqual(['dan z prijmov']);
      expect(line.querySelector('script')).toBeNull();
      expect(line.querySelector('img')).toBeNull();
      expect(line.textContent).toContain('<script>alert(1)</script>');
      expect(root(fixture).querySelector('script')).toBeNull();
    });

    it('should show the snippet when the hit has no headline', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire({ headline: null, snippet: 'Iba vyber z textu.' })] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'vyber');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-headline')).toBe(false);
      expect(el(fixture, 'corpus-snippet').textContent).toContain('Iba vyber z textu.');
    });

    it('should show the warnings note only when the envelope carries a warning', async () => {
      const { fixture } = setup({
        lookup: () => [lookupWire()],
        search: (input) => ((input as { query: string }).query === 'degraded' ? WARNING_ENVELOPE([searchWire()]) : [searchWire()]),
      });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'plain');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-warnings')).toBe(false);
      type(fixture, 'corpus-search', 'degraded');
      await settle(fixture, 400);
      expect(el(fixture, 'corpus-warnings').textContent).toContain('lexical only');
      type(fixture, 'corpus-search', 'plain again');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-warnings')).toBe(false);
    });

    it('should return to the list when the search box is cleared', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'dan');
      await settle(fixture, 400);
      type(fixture, 'corpus-search', '');
      await settle(fixture, 400);
      expect(callsOf(env, 'search')).toHaveLength(1);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
    });
  });

  describe('filters without text', () => {
    it('should go to lookup with the filters when no text is typed', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-fonte', 'mfsr-spravodajca');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ fonte: 'mfsr-spravodajca' });
      type(fixture, 'corpus-tipo', 'oznamenie');
      await settle(fixture, 400);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ fonte: 'mfsr-spravodajca', tipo: 'oznamenie' });
      type(fixture, 'corpus-anno-from', '2024');
      type(fixture, 'corpus-anno-to', '2025');
      await settle(fixture, 400);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ fonte: 'mfsr-spravodajca', tipo: 'oznamenie', data_from: '2024-01-01', data_to: '2025-12-31' });
      type(fixture, 'corpus-anno-to', '2024');
      await settle(fixture, 400);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ fonte: 'mfsr-spravodajca', tipo: 'oznamenie', anno: 2024 });
      expect(callsOf(env, 'search')).toEqual([]);
      expect(schemaViolations(env)).toEqual([]);
    });
  });

  describe('states', () => {
    it('should show the empty state when the Tool returns no rows', async () => {
      const { fixture } = setup({ lookup: () => [] });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-empty').textContent).toContain('No documents');
      expect(all(fixture, 'corpus-row')).toHaveLength(0);
    });

    it('should show the error message and not throw when a Tool fails', async () => {
      const { fixture } = setup({
        lookup: () => {
          throw new Error('boom');
        },
      });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-error').textContent).toContain('could not be loaded');
      expect(el(fixture, 'corpus-error').textContent).toContain('boom');
      expect(all(fixture, 'corpus-row')).toHaveLength(0);
    });

    it('should show the error of a failing search and recover when the text changes', async () => {
      const { fixture } = setup({
        lookup: () => [lookupWire()],
        search: (input) => {
          if ((input as { query: string }).query === 'fail') {
            throw new Error('search down');
          }
          return [searchWire()];
        },
      });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'fail');
      await settle(fixture, 400);
      expect(el(fixture, 'corpus-error').textContent).toContain('search down');
      type(fixture, 'corpus-search', 'ok');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-error')).toBe(false);
      expect(all(fixture, 'corpus-row')).toHaveLength(1);
    });
  });

  describe('rows', () => {
    it('should navigate with the raw doc key when a row is clicked', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = setup({ lookup: () => [lookupWire()] }, { navigateScreen });
      fixture.detectChanges();
      await settle(fixture);
      must(all(fixture, 'corpus-row')[0] ?? root(fixture), '[data-testid="corpus-open"]').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('document', `doc~${DOC_ID}`);
    });

    it('should navigate from a search hit with the same key', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] }, { navigateScreen });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'dan');
      await settle(fixture, 400);
      must(all(fixture, 'corpus-row')[0] ?? root(fixture), '[data-testid="corpus-open"]').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('document', `doc~${DOC_ID}`);
    });

    it('should link the PDF only for https and open it safely when the row has a source url', async () => {
      const { fixture } = setup({
        lookup: () => [
          lookupWire(),
          lookupWire({ id: '00000000-0000-0000-0000-000000000002', source_url: 'javascript:alert(1)' }),
          lookupWire({ id: '00000000-0000-0000-0000-000000000003', source_url: null }),
        ],
      });
      fixture.detectChanges();
      await settle(fixture);
      const links = all(fixture, 'corpus-source');
      expect(links).toHaveLength(1);
      const link = links[0] as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('https://www.financnasprava.sk/dokument_abc.pdf');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
