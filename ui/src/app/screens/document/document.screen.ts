import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectMetodikaScreen, screenContextProvider } from '../../shared/connect-screen';
import { MetodikaTools } from '../../tools/metodika-tools';
import { DocumentStore } from './document.store';

import { DocumentViewComponent } from './document-view.component';

/** Root of the dp-sk-metodika-document Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-metodika-document',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentViewComponent],
  providers: [screenContextProvider(() => DocumentScreen), MetodikaTools, DocumentStore],
  template: '<dp-sk-metodika-document-view />',
})
export class DocumentScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectMetodikaScreen(this.context);
  }
}
