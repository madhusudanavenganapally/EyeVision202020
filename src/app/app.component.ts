import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerComponent } from './components/timer/timer.component';
import { BreakScreenComponent } from './components/break-screen/break-screen.component';
import { TimerManagerService } from './services/timer-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TimerComponent, BreakScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  timerService = inject(TimerManagerService);
  state$ = this.timerService.state$;
}
