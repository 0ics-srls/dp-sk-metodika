import type { Type } from '@angular/core';
import { CorpusScreen } from './screens/corpus/corpus.screen';
import { DocumentScreen } from './screens/document/document.screen';
import { StatusScreen } from './screens/status/status.screen';

/** Custom elements of the package: three Screens. */
export const ELEMENTS = {
  'dp-sk-metodika-corpus': CorpusScreen,
  'dp-sk-metodika-document': DocumentScreen,
  'dp-sk-metodika-status': StatusScreen,
} as const satisfies Readonly<Record<string, Type<unknown>>>;
