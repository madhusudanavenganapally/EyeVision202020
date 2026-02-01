import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerManagerService, TimerState } from '../../services/timer-manager.service';
import { map, take } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.css'
})
export class TimerComponent {
  timerService = inject(TimerManagerService);
  notificationHidden = true;

  timeLeft$ = this.timerService.timeLeft$;
  state$ = this.timerService.state$;
  breakCount$ = this.timerService.breakCount$;

  progress$ = this.timeLeft$.pipe(
    map(time => {
      const total = 20 * 60;
      return ((total - time) / total) * 100;
    })
  );

  getOffset(progress: number | null): number {
    return 289 - (289 * (progress || 0) / 100);
  }

  formatTime(seconds: number | null): string {
    if (seconds === null) return '20:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  handleToggle() {
    this.state$.pipe(take(1)).subscribe(state => {
      if (state === 'IDLE') {
        this.timerService.start();
      } else {
        this.timerService.pause();
      }
    });
  }

  requestPermission() {
    this.timerService.requestPermission();
  }
}
