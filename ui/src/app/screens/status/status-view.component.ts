import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { fonteKey } from '../../shared/fonte';
import { StatusStore } from './status.store';

@Component({
  selector: 'dp-sk-metodika-status-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './status-view.component.html',
  styleUrl: './status-view.component.css',
})
export class StatusViewComponent {
  protected readonly store = inject(StatusStore);
  protected readonly fonteKey = fonteKey;
}
