import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectMetodikaScreen, screenContextProvider } from '../../shared/connect-screen';
import { MetodikaTools } from '../../tools/metodika-tools';
import { CorpusStore } from './corpus.store';
import { CorpusViewComponent } from './corpus-view.component';

/** Root of the dp-sk-metodika-corpus Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-metodika-corpus',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CorpusViewComponent],
  providers: [screenContextProvider(() => CorpusScreen), MetodikaTools, CorpusStore],
  template: '<dp-sk-metodika-corpus-view />',
})
export class CorpusScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectMetodikaScreen(this.context);
  }
}
