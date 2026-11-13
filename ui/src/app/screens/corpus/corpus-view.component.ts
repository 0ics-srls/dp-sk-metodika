import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { estremiLabel } from '../../shared/estremi';
import { FONTE_CHOICES, fonteKey } from '../../shared/fonte';
import { CorpusStore } from './corpus.store';

@Component({
  selector: 'dp-sk-metodika-corpus-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './corpus-view.component.html',
  styleUrl: './corpus-view.component.css',
})
export class CorpusViewComponent {
  protected readonly store = inject(CorpusStore);

  protected readonly fonti = FONTE_CHOICES;
  protected readonly sorts: readonly string[] = ['data_desc', 'data_asc', 'tipo', 'anno_numero'];
  protected readonly modes: readonly string[] = ['hybrid', 'lexical', 'semantic'];
  protected readonly fonteKey = fonteKey;
  protected readonly estremi = estremiLabel;

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
