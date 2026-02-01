import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

export type TimerState = 'IDLE' | 'WORKING' | 'BREAKING';

@Injectable({
  providedIn: 'root'
})
export class TimerManagerService {
  private readonly WORK_TIME = 20 * 60; // 20 minutes
  private readonly BREAK_TIME = 20; // 20 seconds

  private state = new BehaviorSubject<TimerState>('IDLE');
  private timeLeft = new BehaviorSubject<number>(this.WORK_TIME);
  private breakCount = new BehaviorSubject<number>(0);

  state$ = this.state.asObservable();
  timeLeft$ = this.timeLeft.asObservable();
  breakCount$ = this.breakCount.asObservable();

  private timerSubscription?: Subscription;

  constructor() { }

  start() {
    if (this.state.value !== 'IDLE') return;
    this.startWork();
  }

  private startWork() {
    this.state.next('WORKING');
    this.timeLeft.next(this.WORK_TIME);
    this.initTimer();
  }

  private startBreak() {
    this.state.next('BREAKING');
    this.timeLeft.next(this.BREAK_TIME);
    this.initTimer();
    this.notify();
  }

  private initTimer() {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      const current = this.timeLeft.value;
      if (current > 0) {
        this.timeLeft.next(current - 1);
      } else {
        this.handleStepComplete();
      }
    });
  }

  private handleStepComplete() {
    this.timerSubscription?.unsubscribe();
    if (this.state.value === 'WORKING') {
      this.startBreak();
    } else if (this.state.value === 'BREAKING') {
      this.breakCount.next(this.breakCount.value + 1);
      this.startWork();
    }
  }

  pause() {
    this.timerSubscription?.unsubscribe();
    this.state.next('IDLE');
  }

  reset() {
    this.pause();
    this.timeLeft.next(this.WORK_TIME);
    this.breakCount.next(0);
  }

  private notify() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Eye Care 20/20', {
        body: 'Time for a 20-second break! Look 20 feet away.'
      });
    }
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => { }); // Catch if browser blocks audio
  }

  requestPermission() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }
}
