# ui/dist build notes

Recorded for the 0.2.0 release (open-lex-it 81b plan-c, blocks 22-26). The Host never builds; the committed `dist` is the registered artifact.

| Item | Value |
|---|---|
| Command | `npm ci && npm run build` |
| SDK | `@olx/package-ui-sdk` 0.2.2 from `vendor/olx-package-ui-sdk-0.2.2.tgz` (the same tarball as `dp-it-prassi` and `dp-sk-judikatura`, md5 216640e118d42451bb541fb5adc1151a, copied, not rebuilt) |
| `du -sb dist` | 477221 bytes (limit `PackageUi:MaxBytes` 5 MB) |
| `main.js` | 434015 bytes (limit per file 1.5 MB) |
| chunks | none (single bundle, no lazy chunks) |
| `styles.css` | 0 bytes (the package relies on the Host PrimeNG theme) |
| `3rdpartylicenses.txt` | 43188 bytes |
| `prerendered-routes.json` | 18 bytes |
| files in `dist` | 4 |
| `grep -c "zone.js" dist/main.js` | 0 (zoneless) |
| Custom elements | `dp-sk-metodika-corpus`, `dp-sk-metodika-document`, `dp-sk-metodika-status` (the SDK requires the prefix `dp-<package name>-`) |
| Determinism | after deleting `dist` and `.angular`, two `npm run build` runs give the same md5 for the four files (`outputHashing: none`) |
| md5 | `main.js` aa3a500054fedc5cd4f57e199c678b31, `3rdpartylicenses.txt` 4a0ddff082829e6aa72c232cd197096d, `prerendered-routes.json` d5eabf3e8b1c211a1474cb10914ca1c1, `styles.css` d41d8cd98f00b204e9800998ecf8427e |
| Unit tests | `npm test` (Vitest through `ng test`): 7 files, 83 passed; `npm run lint` clean |

The lock file derives from the one of `dp-it-prassi` (package name replaced); `npm ci` works, also offline from a warm npm cache.

The specs validate every argument object a Screen sends against the real Tool schemas in `../serving/tools/public` (`src/app/testing/tool-schemas.ts`, ajv 2020), so a Screen that drifts from a Tool fails its own spec. The `built bundle` checks of `manifest-ui.spec.ts` read `dist/`, so run `npm run build` before `npm test` on a fresh clone.

`manifest-ui.spec.ts` reads the `ui` block from `../dataplatform.json`; while the Manifest has none it falls back to `manifest-ui.fragment.json` (this folder), which holds the exact block to merge into the Manifest at block 26.

Screens: `corpus` (first open: `lookup` with `{}`; text: `search` k 50; filters fonte, tipo, years, mode, sort), `document` (route key `doc~<uuid>`, text slices from `doc`), `status` (one `status` call).
