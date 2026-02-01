import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerManagerService } from '../../services/timer-manager.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-break-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './break-screen.component.html',
  styleUrl: './break-screen.component.css'
})
export class BreakScreenComponent {
  timerService = inject(TimerManagerService);
  timeLeft$ = this.timerService.timeLeft$;

  progress$ = this.timeLeft$.pipe(
    map(time => {
      const total = 20;
      return ((total - time) / total) * 100;
    })
  );

  getOffset(progress: number | null): number {
    return 283 - (283 * (progress || 0) / 100);
  }

  skipBreak() {
    this.timerService.reset();
    this.timerService.start();
  }
}
