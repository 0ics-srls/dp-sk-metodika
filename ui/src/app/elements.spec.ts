import { NgZone, type EnvironmentProviders, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { PrimeNG } from 'primeng/config';
import { must } from './testing/dom';
import { stubMetodikaEnvironment } from './testing/stub-metodika-tools';
import { metodikaProviders } from './providers';
import { registerMetodika } from './register';
import { ELEMENTS } from './screens';

const TAGS = ['dp-sk-metodika-corpus', 'dp-sk-metodika-document', 'dp-sk-metodika-status'];

function flatten(providers: readonly (Provider | EnvironmentProviders)[]): readonly unknown[] {
  return providers.flatMap((p) => {
    if (Array.isArray(p)) {
      return flatten(p as Provider[]);
    }
    const inner = (p as { ɵproviders?: readonly Provider[] }).ɵproviders;
    return inner === undefined ? [p] : flatten(inner);
  });
}

describe('ELEMENTS', () => {
  it('should hold exactly the three package tags when listed', () => {
    expect(Object.keys(ELEMENTS).sort()).toEqual(TAGS);
  });

  it('should prefix every tag with dp-sk-metodika- and map it to a component class when listed', () => {
    for (const [tag, type] of Object.entries(ELEMENTS)) {
      expect(tag.startsWith('dp-sk-metodika-')).toBe(true);
      expect((type as unknown as { ɵcmp?: unknown }).ɵcmp).toBeDefined();
    }
  });
});

describe('registerMetodika', () => {
  it('should pass the package name, the map and the providers when registering', async () => {
    const define = vi.fn().mockResolvedValue(undefined);
    await registerMetodika(define);
    expect(define).toHaveBeenCalledTimes(1);
    const [name, map, options] = define.mock.calls[0] as [string, unknown, { providers: unknown }];
    expect(name).toBe('sk-metodika');
    expect(map).toBe(ELEMENTS);
    expect(options.providers).toBe(metodikaProviders);
  });

  it('should provide PrimeNG, i18n and zoneless change detection when the injector is built', () => {
    TestBed.configureTestingModule({ providers: [...metodikaProviders] });
    expect(TestBed.inject(PrimeNG)).toBeDefined();
    expect(TestBed.inject(TranslocoService)).toBeDefined();
    expect(TestBed.inject(NgZone).constructor.name).toBe('NoopNgZone');
  });

  it('should not provide a router or zone change detection when the providers are listed', () => {
    const tokens = flatten(metodikaProviders).map((p) => (p as { provide?: unknown }).provide);
    const names = tokens.map((t) => (typeof t === 'function' ? t.name : String(t)));
    expect(names).not.toContain('Router');
    expect(names.join('|')).not.toMatch(/ROUTES|NgZoneChangeDetectionScheduler|ZoneChangeDetection/);
  });
});

describe('Screen elements', () => {
  for (const tag of TAGS) {
    it(`should render a title without network when ${tag} gets a stub context`, async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const env = stubMetodikaEnvironment({
        search: () => [],
        lookup: () => [],
        doc: () => [],
        status: () => [],
      });
      TestBed.configureTestingModule({ providers: [...metodikaProviders] });
      const fixture = TestBed.createComponent(ELEMENTS[tag as keyof typeof ELEMENTS]);
      fixture.componentRef.setInput('context', env.context());
      fixture.detectChanges();
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(must(fixture.nativeElement as HTMLElement, '[data-testid="screen-title"]').textContent.trim()).not.toBe('');
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  }
});
