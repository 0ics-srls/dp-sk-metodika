import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectMetodikaScreen, screenContextProvider } from '../../shared/connect-screen';
import { MetodikaTools } from '../../tools/metodika-tools';
import { StatusStore } from './status.store';
import { StatusViewComponent } from './status-view.component';

/** Root of the dp-sk-metodika-status Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-metodika-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusViewComponent],
  providers: [screenContextProvider(() => StatusScreen), MetodikaTools, StatusStore],
  template: '<dp-sk-metodika-status-view />',
})
export class StatusScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectMetodikaScreen(this.context);
  }
}
