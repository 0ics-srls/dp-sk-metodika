import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { fonteKey } from '../../shared/fonte';
import { DocumentStore } from './document.store';

@Component({
  selector: 'dp-sk-metodika-document-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './document-view.component.html',
  styleUrl: './document-view.component.css',
})
export class DocumentViewComponent {
  protected readonly store = inject(DocumentStore);
  protected readonly fonteKey = fonteKey;
}
