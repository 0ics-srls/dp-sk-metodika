import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ELEMENTS } from '../app/screens';
import { MetodikaTool } from '../app/tools/metodika-tool';
import { loadToolDirectory } from './audit';

interface Declared {
  readonly id: string;
  readonly element: string;
  readonly label: Readonly<Record<string, string>>;
  readonly default?: boolean;
}

interface Manifest {
  readonly ui: {
    readonly entry: string;
    readonly styles: readonly string[];
    readonly screens: readonly Declared[];
    readonly permissions: readonly string[];
  };
}

const PACKAGE_ROOT = resolve(process.cwd(), '..');
/** The `ui` block of the Manifest; until the orchestrator merges it (plan-c block 26) the fragment next to this folder stands in for it. */
function readUi(): Manifest {
  const merged = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'dataplatform.json'), 'utf8')) as Partial<Manifest>;
  return merged.ui === undefined ? (JSON.parse(readFileSync(join(PACKAGE_ROOT, 'ui', 'manifest-ui.fragment.json'), 'utf8')) as Manifest) : (merged as Manifest);
}
const manifest = readUi();
const { ui } = manifest;
const DIST = resolve(process.cwd(), 'dist');
const MAIN = join(DIST, 'main.js');

const sizes = (): number[] => readdirSync(DIST).map((name) => statSync(join(DIST, name)).size);

describe('Manifest ui section', () => {
  it('should declare every ELEMENTS key exactly once when the Manifest is read', () => {
    expect(ui.screens.map((screen) => screen.element).sort()).toEqual(Object.keys(ELEMENTS).sort());
  });

  it('should keep screen ids unique, exactly one default and labels in sk, en and it when the screens are declared', () => {
    const ids = ui.screens.map((screen) => screen.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ui.screens.filter((screen) => screen.default === true).map((screen) => screen.id)).toEqual(['corpus']);
    for (const screen of ui.screens) {
      expect(Object.keys(screen.label).sort(), screen.id).toEqual(['en', 'it', 'sk']);
    }
  });

  it('should declare the three metodika Screens with their elements and the menu entry when the Manifest is read', () => {
    expect(ui.screens.map((screen) => [screen.id, screen.element])).toEqual([
      ['corpus', 'dp-sk-metodika-corpus'],
      ['document', 'dp-sk-metodika-document'],
      ['status', 'dp-sk-metodika-status'],
    ]);
    expect(ui.entry).toBe('ui/dist/main.js');
    expect(ui.styles).toEqual(['ui/dist/styles.css']);
  });

  it('should grant exactly the Tools the UI uses and navigate when the permissions are read', () => {
    const granted = ui.permissions.filter((permission) => permission.startsWith('tools:')).map((permission) => permission.slice('tools:'.length));
    expect(granted.sort()).toEqual(Object.values(MetodikaTool).sort());
    expect(ui.permissions).toContain('navigate');
    const declared = loadToolDirectory(PACKAGE_ROOT);
    for (const tool of granted) {
      expect(declared.has(tool), tool).toBe(true);
    }
  });

  it('should find entry and styles under ui/dist when the build is committed', () => {
    for (const file of [ui.entry, ...ui.styles]) {
      expect(existsSync(join(PACKAGE_ROOT, file)), file).toBe(true);
    }
  });
});

describe('built bundle', () => {
  it('should stay within 5 MB in total and 1.5 MB per file when dist is measured', () => {
    expect(existsSync(MAIN), `run npm run build first: ${MAIN} missing`).toBe(true);
    expect(sizes().reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(Math.max(...sizes())).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });

  it('should not contain zone.js when read from dist', () => {
    expect(readFileSync(MAIN, 'utf8')).not.toContain('zone.js');
  });

  it('should define every element once and survive a second import when imported twice', async () => {
    const url = pathToFileURL(MAIN).href;
    await import(/* @vite-ignore */ `${url}?first`);
    for (const tag of Object.keys(ELEMENTS)) {
      expect(customElements.get(tag), tag).toBeDefined();
    }
    const before = Object.keys(ELEMENTS).map((tag) => customElements.get(tag));
    await expect(import(/* @vite-ignore */ `${url}?second`)).resolves.toBeDefined();
    expect(Object.keys(ELEMENTS).map((tag) => customElements.get(tag))).toEqual(before);
  });
});
