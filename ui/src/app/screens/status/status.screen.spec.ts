import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { metodikaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { coverageWire, emptyStatusWire, statusWire } from '../../testing/metodika-fixtures';
import { callsOf, schemaViolations, stubMetodikaEnvironment } from '../../testing/stub-metodika-tools';
import { StatusScreen } from './status.screen';

type Handler = (input: object) => unknown;

function setup(status: Handler, overrides: Parameters<typeof stubMetodikaEnvironment>[1] = {}) {
  const env = stubMetodikaEnvironment({ status, search: () => [], lookup: () => [], doc: () => [] }, { locale: 'en', ...overrides });
  TestBed.configureTestingModule({ providers: [...metodikaProviders] });
  const fixture = TestBed.createComponent(StatusScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<StatusScreen>;

async function settle(fixture: Fixture): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await vi.waitFor(() => undefined);
    await Promise.resolve();
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const all = (fixture: Fixture, id: string): HTMLElement[] => [...root(fixture).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

async function loaded(status: Handler, overrides: Parameters<typeof stubMetodikaEnvironment>[1] = {}) {
  const made = setup(status, overrides);
  made.fixture.detectChanges();
  await settle(made.fixture);
  return made;
}

const TWO_FONTI: Handler = () => [
  statusWire(),
  statusWire({
    fonte: 'nbs-metodicke',
    documents: 40,
    first_year: 2019,
    last_year: 2025,
    sections: { 'metodicke-usmernenia': 25, stanoviska: 15 },
    text_sources: { pdf: 40 },
    ocr_documents: 0,
    passages_total: 300,
    passages_pending: 12,
    skipped: {},
    duplicate_identity_groups: 2,
    coverage: [coverageWire({ item: 'pdf:nbs-metodicke:all', listed: 40, taken: 40, skipped: 0, note: 'new_leaf:vestnik' })],
  }),
];

describe('StatusScreen', () => {
  describe('rows', () => {
    it('should call status once with an empty argument object, not in the constructor, and render one row per fonte', async () => {
      const made = setup(TWO_FONTI);
      expect(made.env.calls).toEqual([]);
      made.fixture.detectChanges();
      await settle(made.fixture);
      expect(callsOf(made.env, 'status')).toEqual([{}]);
      expect(made.env.calls).toHaveLength(1);
      expect(schemaViolations(made.env)).toEqual([]);
      const rows = all(made.fixture, 'status-row');
      expect(rows).toHaveLength(2);
      const first = rows[0]?.textContent ?? '';
      expect(first).toContain('Financna sprava SR');
      expect(first).toContain('120');
      expect(first).toContain('2014-2026');
      expect(first).toContain('900');
      expect(first).toContain('2026-11-10 08:30');
      expect(el(made.fixture, 'screen-title').textContent.trim()).toBe('Corpus status');
    });

    it('should show pdf and ocr counts of the text source mix per fonte', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      const first = all(fixture, 'status-row')[0];
      expect(must(first ?? root(fixture), '[data-testid="status-pdf"]').textContent.trim()).toBe('113');
      expect(must(first ?? root(fixture), '[data-testid="status-ocr"]').textContent.trim()).toBe('7');
    });

    it('should show the warning badge only for the fonte with passages_pending above zero', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      const rows = all(fixture, 'status-row');
      expect(rows[0]?.querySelector('[data-testid="status-warning"]')).toBeNull();
      const badge = rows[1]?.querySelector('[data-testid="status-warning"]');
      expect(badge?.textContent.trim()).toBe('12');
      expect(badge?.getAttribute('title')).toContain('embedding');
    });

    it('should list the sections counts per fonte', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      const sections = all(fixture, 'status-sections');
      expect(sections).toHaveLength(2);
      expect(sections[0]?.textContent).toContain('metodicke-pokyny');
      expect(sections[0]?.textContent).toContain('80');
      expect(sections[1]?.textContent).toContain('stanoviska');
      expect(sections[1]?.textContent).toContain('15');
    });

    it('should show the duplicate identity groups as information', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      const cells = all(fixture, 'status-duplicates');
      expect(cells.map((cell) => cell.textContent.trim())).toEqual(['0', '2']);
      expect(el(fixture, 'status-duplicates-note').textContent).toContain('informative');
    });
  });

  describe('skipped and coverage', () => {
    it('should list skipped items by reason once per fonte and nothing for a fonte without any', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      const groups = all(fixture, 'status-skipped');
      expect(groups).toHaveLength(1);
      expect(groups[0]?.textContent).toContain('financnasprava');
      expect(groups[0]?.textContent).toContain('ocr_empty');
      expect(groups[0]?.textContent).toContain('2');
    });

    it('should render the coverage rows with item, counts and the note as text', async () => {
      const { fixture } = await loaded(() => [
        statusWire({
          coverage: [
            coverageWire({ note: 'zip_archives_only', item: 'pdf:mfsr-spravodajca:2005' }),
            coverageWire({ note: 'layout_c_not_collected', item: 'pdf:uvo-metodicke:leaf' }),
            coverageWire({ note: 'new_leaf:<b>x</b>', item: 'pdf:uvo-metodicke:new' }),
          ],
        }),
      ]);
      const rows = all(fixture, 'coverage-row');
      expect(rows).toHaveLength(3);
      expect(rows[0]?.textContent).toContain('pdf:mfsr-spravodajca:2005');
      expect(rows[0]?.textContent).toContain('zip_archives_only');
      expect(rows[1]?.textContent).toContain('layout_c_not_collected');
      expect(rows[2]?.textContent).toContain('new_leaf:<b>x</b>');
      expect(root(fixture).querySelector('b')).toBeNull();
      expect(must(rows[0] ?? root(fixture), '[data-testid="coverage-listed"]').textContent.trim()).toBe('40');
      expect(must(rows[0] ?? root(fixture), '[data-testid="coverage-taken"]').textContent.trim()).toBe('38');
    });

    it('should read jsonb columns that the host serialises as text', async () => {
      const { fixture } = await loaded(() => [
        statusWire({
          sections: JSON.stringify({ stanoviska: 9 }),
          skipped: JSON.stringify({ pdf_too_large: 4 }),
          coverage: JSON.stringify([{ item: 'fs:x', listed: 5, taken: 5, skipped: 0, note: null }]),
        }),
      ]);
      expect(el(fixture, 'status-sections').textContent).toContain('stanoviska');
      expect(el(fixture, 'status-skipped').textContent).toContain('pdf_too_large');
      expect(all(fixture, 'coverage-row')).toHaveLength(1);
    });
  });

  describe('limits and licence', () => {
    it('should show the honest limits of the Tool once and the attribution footer', async () => {
      const { fixture } = await loaded(TWO_FONTI);
      expect(all(fixture, 'status-limits')).toHaveLength(1);
      expect(el(fixture, 'status-limits').textContent).toContain('nie o pramen prava');
      expect(el(fixture, 'status-footer').textContent).toContain('Financna sprava SR, Ministerstvo financii SR, NBS, UVO');
      expect(el(fixture, 'status-footer').textContent).toContain('NOT a source of law');
    });
  });

  describe('states', () => {
    it('should show the empty state and no table when the corpus answers its single row of zeros', async () => {
      const { fixture } = await loaded(() => [emptyStatusWire()]);
      expect(has(fixture, 'status-empty')).toBe(true);
      expect(all(fixture, 'status-row')).toHaveLength(0);
      expect(has(fixture, 'status-warning')).toBe(false);
    });

    it('should show the empty state when the Tool answers no rows at all', async () => {
      const { fixture } = await loaded(() => []);
      expect(has(fixture, 'status-empty')).toBe(true);
    });

    it('should show the error message and not throw when status fails', async () => {
      const { fixture } = await loaded(() => {
        throw new Error('status down');
      });
      expect(el(fixture, 'status-error').textContent).toContain('could not be loaded');
      expect(el(fixture, 'status-error').textContent).toContain('status down');
    });

    it('should call status again only when the refresh button is pressed', async () => {
      const { env, fixture } = await loaded(TWO_FONTI);
      el(fixture, 'status-refresh').click();
      await settle(fixture);
      expect(callsOf(env, 'status')).toEqual([{}, {}]);
    });

    it('should render Slovak and Italian titles when the locale changes', async () => {
      const sk = await loaded(TWO_FONTI, { locale: 'sk' });
      expect(el(sk.fixture, 'screen-title').textContent.trim()).toBe('Stav korpusu');
      TestBed.resetTestingModule();
      const it = await loaded(TWO_FONTI, { locale: 'it' });
      expect(el(it.fixture, 'screen-title').textContent.trim()).toBe('Stato del corpus');
    });
  });
});
