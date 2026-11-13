import { APP_ROOT, flattenKeys, templateKeys } from '../testing/source-scan';
import enDict from './en.json';
import itDict from './it.json';
import skDict from './sk.json';

describe('dictionaries', () => {
  it('should have the same keys in sk, en and it when compared', () => {
    const keys = flattenKeys(enDict).sort();
    expect(keys.length).toBeGreaterThan(5);
    expect(flattenKeys(skDict).sort()).toEqual(keys);
    expect(flattenKeys(itDict).sort()).toEqual(keys);
  });

  it('should define every literal key used in a template when the sources are scanned', () => {
    const defined = new Set(flattenKeys(enDict));
    const missing = templateKeys(APP_ROOT)
      .filter((used) => !defined.has(used.key))
      .map((used) => `${used.key} (${used.path})`);
    expect(missing).toEqual([]);
  });

  it('should find template keys when scanning (no vacuous pass)', () => {
    expect(templateKeys(APP_ROOT).length).toBeGreaterThan(2);
  });

  it('should carry the attribution and the not-a-source-of-law line in sk, en and it when the dictionaries are read', () => {
    for (const dict of [skDict, enDict, itDict]) {
      const keys = flattenKeys(dict);
      expect(keys).toContain('common.attribution');
      expect(keys).toContain('common.notLaw');
    }
    expect(JSON.stringify(enDict)).toContain('Financna sprava SR, Ministerstvo financii SR, NBS, UVO');
    expect(JSON.stringify(enDict)).toContain('not a source of law');
    expect(JSON.stringify(enDict)).toContain('binding text is the PDF');
    expect(JSON.stringify(itDict)).toContain('NON è una fonte del diritto');
  });
});
