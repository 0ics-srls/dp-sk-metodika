import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { metodikaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { DOC_ID, docWire } from '../../testing/metodika-fixtures';
import { callsOf, schemaViolations, stubMetodikaEnvironment } from '../../testing/stub-metodika-tools';
import { DocumentScreen } from './document.screen';

type Handler = (input: object) => unknown;

interface Handlers {
  readonly doc?: Handler;
}

function setup(subPath: string, handlers: Handlers = {}, overrides: Parameters<typeof stubMetodikaEnvironment>[1] = {}) {
  const env = stubMetodikaEnvironment(
    { doc: handlers.doc ?? (() => [docWire()]), search: () => [], lookup: () => [], status: () => [] },
    { locale: 'en', subPath, ...overrides },
  );
  TestBed.configureTestingModule({ providers: [...metodikaProviders] });
  const fixture = TestBed.createComponent(DocumentScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<DocumentScreen>;

async function settle(fixture: Fixture): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await vi.waitFor(() => undefined);
    await Promise.resolve();
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

async function loaded(subPath: string, handlers: Handlers = {}, overrides: Parameters<typeof stubMetodikaEnvironment>[1] = {}) {
  const made = setup(subPath, handlers, overrides);
  made.fixture.detectChanges();
  await settle(made.fixture);
  return made;
}

const KEY = `doc~${DOC_ID}`;

describe('DocumentScreen', () => {
  describe('loading', () => {
    it('should load doc once with the id only and render the header and the first slice when the key is doc~uuid', async () => {
      const { env, fixture } = await loaded(KEY);
      expect(callsOf(env, 'doc')).toEqual([{ id: DOC_ID }]);
      expect(env.calls).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
      const header = el(fixture, 'doc-header').textContent;
      for (const text of ['Financna sprava SR', 'metodicky pokyn', '10/DZPaU/2026/MP', '2026-03-04', 'metodicke-pokyny', 'Dane z prijmov']) {
        expect(header, text).toContain(text);
      }
      expect(header).not.toContain('10/DZPaU/2026/MP/2026');
      expect(el(fixture, 'doc-oggetto').textContent).toContain('Metodicky pokyn k dani z prijmov');
      expect(el(fixture, 'doc-text').textContent).toBe('Prvy usek textu.');
      expect(el(fixture, 'doc-length').textContent).toContain('16 of 16');
      expect(has(fixture, 'doc-next')).toBe(false);
      expect(el(fixture, 'doc-text-source').textContent).toContain('PDF text');
      expect(el(fixture, 'doc-pdf-info').textContent).toContain('12 pages');
      expect(el(fixture, 'doc-pdf-info').textContent).toContain('200 KB');
    });

    it('should show the no-number wording and the year when the document declares no number', async () => {
      const { fixture } = await loaded(KEY, { doc: () => [docWire({ numero: null, anno: 2018, data: null })] });
      expect(el(fixture, 'doc-header').textContent).toContain('no number');
      expect(el(fixture, 'doc-header').textContent).toContain('2018');
    });

    it('should show the PDF text badge for pdf and the OCR badge for ocr when the text source differs', async () => {
      const pdf = await loaded(KEY);
      expect(el(pdf.fixture, 'doc-text-source').textContent).toContain('PDF text');
      expect(has(pdf.fixture, 'doc-ocr')).toBe(false);
      TestBed.resetTestingModule();
      const ocr = await loaded(KEY, { doc: () => [docWire({ text_source: 'ocr' })] });
      expect(el(ocr.fixture, 'doc-text-source').textContent).toContain('OCR');
      expect(el(ocr.fixture, 'doc-ocr').textContent).toContain('OCR');
    });

    it('should reload and reset when the Host navigates to another document', async () => {
      const second = '9c1d7e2a-4b5f-4c6d-8e7f-0a1b2c3d4e5f';
      const { env, fixture } = await loaded(KEY, {
        doc: (input) => [docWire({ id: (input as { id: string }).id, text: `Text ${(input as { id: string }).id.slice(0, 4)}` })],
      });
      expect(el(fixture, 'doc-text').textContent).toBe('Text 3f2b');
      env.update({ subPath: `doc~${second}` });
      fixture.componentRef.setInput('context', env.context());
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'doc')).toEqual([{ id: DOC_ID }, { id: second }]);
      expect(el(fixture, 'doc-text').textContent).toBe('Text 9c1d');
    });

    it('should render Slovak texts when the locale is sk', async () => {
      const { fixture } = await loaded(KEY, {}, { locale: 'sk' });
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Dokument');
    });

    it('should render Italian texts when the locale is it', async () => {
      const { fixture } = await loaded(KEY, {}, { locale: 'it' });
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Documento');
    });
  });

  describe('slices', () => {
    const sliced: Handler = (input) => {
      const { offset } = input as { offset?: number };
      return offset === undefined
        ? [docWire({ text: 'AAAA', text_length: 10, truncated: true, next_offset: 4 })]
        : [docWire({ text: 'BBBBBB', text_length: 10, truncated: false, next_offset: null })];
    };

    it('should append the next slice with offset = next_offset and update the length line when the button is pressed', async () => {
      const { env, fixture } = await loaded(KEY, { doc: sliced });
      expect(el(fixture, 'doc-text').textContent).toBe('AAAA');
      expect(el(fixture, 'doc-length').textContent).toContain('4 of 10');
      el(fixture, 'doc-next').click();
      await settle(fixture);
      expect(callsOf(env, 'doc')).toEqual([{ id: DOC_ID }, { id: DOC_ID, offset: 4 }]);
      expect(el(fixture, 'doc-text').textContent).toBe('AAAABBBBBB');
      expect(el(fixture, 'doc-length').textContent).toContain('10 of 10');
      expect(has(fixture, 'doc-next')).toBe(false);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should keep the first slice and show an error when the next slice fails', async () => {
      const { fixture } = await loaded(KEY, {
        doc: (input) => {
          if ((input as { offset?: number }).offset !== undefined) {
            throw new Error('slice down');
          }
          return [docWire({ text: 'AAAA', text_length: 10, truncated: true, next_offset: 4 })];
        },
      });
      el(fixture, 'doc-next').click();
      await settle(fixture);
      expect(el(fixture, 'doc-text').textContent).toBe('AAAA');
      expect(el(fixture, 'doc-slice-error').textContent).toContain('slice down');
    });
  });

  describe('text safety', () => {
    it('should render the text and the oggetto as text nodes when they carry tags and keep line breaks through a css class', async () => {
      const { fixture } = await loaded(KEY, {
        doc: () => [docWire({ text: 'Riadok <b>tucne</b>\nDruhy riadok <script>alert(1)</script>', oggetto: 'Predmet <i>x</i>' })],
      });
      const text = el(fixture, 'doc-text');
      expect(text.textContent).toContain('<b>tucne</b>');
      expect(text.textContent).toContain('\nDruhy riadok');
      expect(text.classList.contains('pre-wrap')).toBe(true);
      expect(text.hasAttribute('style')).toBe(false);
      expect(el(fixture, 'doc-oggetto').textContent).toContain('<i>x</i>');
      expect(root(fixture).querySelector('b')).toBeNull();
      expect(root(fixture).querySelector('i')).toBeNull();
      expect(root(fixture).querySelector('script')).toBeNull();
    });

    it('should link the PDF only for https and open it safely when the document has a source url', async () => {
      const { fixture } = await loaded(KEY);
      const link = el(fixture, 'doc-source') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('https://www.financnasprava.sk/dokument_abc.pdf');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      TestBed.resetTestingModule();
      for (const source_url of ['javascript:alert(1)', 'http://www.financnasprava.sk/a.pdf', null]) {
        const unsafe = await loaded(KEY, { doc: () => [docWire({ source_url })] });
        expect(has(unsafe.fixture, 'doc-source'), String(source_url)).toBe(false);
        TestBed.resetTestingModule();
      }
    });

    it('should state that the binding text is the PDF and show the attribution when a document is open', async () => {
      const { fixture } = await loaded(KEY);
      expect(el(fixture, 'doc-attribution').textContent).toContain('Financna sprava SR, Ministerstvo financii SR, NBS, UVO');
      expect(el(fixture, 'doc-not-law').textContent).toContain('NOT a source of law');
      expect(el(fixture, 'doc-binding').textContent).toContain('binding text is the PDF');
    });
  });

  describe('licence note', () => {
    it('should show the unaltered-file note for NBS and the terms-not-published note for the other sources', async () => {
      const nbs = await loaded(KEY, { doc: () => [docWire({ fonte: 'nbs-metodicke' })] });
      expect(el(nbs.fixture, 'doc-licence').textContent).toContain('unaltered');
      TestBed.resetTestingModule();
      for (const fonte of ['financnasprava', 'mfsr-spravodajca', 'uvo-metodicke']) {
        const other = await loaded(KEY, { doc: () => [docWire({ fonte })] });
        expect(el(other.fixture, 'doc-licence').textContent, fonte).toContain('not published');
        TestBed.resetTestingModule();
      }
    });
  });

  describe('states and keys', () => {
    it('should show the not-found state when doc returns no row for the id', async () => {
      const { fixture } = await loaded(KEY, { doc: () => [] });
      expect(has(fixture, 'doc-notfound')).toBe(true);
      expect(has(fixture, 'doc-text')).toBe(false);
    });

    it('should show the error state and not throw when doc fails', async () => {
      const { fixture } = await loaded(KEY, {
        doc: () => {
          throw new Error('doc down');
        },
      });
      expect(el(fixture, 'doc-error').textContent).toContain('doc down');
    });

    it('should show a hint and call no Tool when the key is missing', async () => {
      for (const subPath of ['', 'something', 'doc~', 'doc~not-a-uuid', 'MF/013819/2025-74']) {
        const { env, fixture } = await loaded(subPath);
        expect(has(fixture, 'doc-hint'), subPath).toBe(true);
        expect(env.calls, subPath).toEqual([]);
        TestBed.resetTestingModule();
      }
    });

    it('should go back to the corpus when the back button is pressed', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = await loaded(KEY, {}, { navigateScreen });
      el(fixture, 'doc-back').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('corpus');
    });
  });
});
