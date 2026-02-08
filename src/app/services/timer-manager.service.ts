import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

export type TimerState = 'IDLE' | 'WORKING' | 'BREAKING';

@Injectable({
  providedIn: 'root'
})
export class TimerManagerService implements OnDestroy {
  private readonly WORK_TIME = 20 * 60; // 20 minutes in seconds
  private readonly BREAK_TIME = 20; // 20 seconds

  private state = new BehaviorSubject<TimerState>('IDLE');
  private timeLeft = new BehaviorSubject<number>(this.WORK_TIME);
  private breakCount = new BehaviorSubject<number>(0);

  state$ = this.state.asObservable();
  timeLeft$ = this.timeLeft.asObservable();
  breakCount$ = this.breakCount.asObservable();

  private timerSubscription?: Subscription;
  private targetEndTime: number = 0;
  private swRegistration?: ServiceWorkerRegistration;

  constructor() {
    this.registerServiceWorker();
    this.setupVisibilityHandler();
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/EyeVision202020/sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.state.value !== 'IDLE') {
      this.recalculateTimeLeft();
    }
  };

  private recalculateTimeLeft() {
    if (this.targetEndTime === 0) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));

    if (remaining <= 0) {
      // Timer expired while in background
      this.handleStepComplete();
    } else {
      this.timeLeft.next(remaining);
    }
  }

  start() {
    if (this.state.value !== 'IDLE') return;
    this.requestPermission();
    this.startWork();
  }

  private startWork() {
    this.state.next('WORKING');
    this.targetEndTime = Date.now() + this.WORK_TIME * 1000;
    this.timeLeft.next(this.WORK_TIME);
    this.initTimer();
    this.scheduleBackgroundNotification(this.WORK_TIME * 1000);
  }

  private startBreak() {
    this.state.next('BREAKING');
    this.targetEndTime = Date.now() + this.BREAK_TIME * 1000;
    this.timeLeft.next(this.BREAK_TIME);
    this.initTimer();
    this.notify();
  }

  private initTimer() {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.recalculateTimeLeft();
    });
  }

  private handleStepComplete() {
    this.timerSubscription?.unsubscribe();
    this.cancelBackgroundNotification();

    if (this.state.value === 'WORKING') {
      this.startBreak();
    } else if (this.state.value === 'BREAKING') {
      this.breakCount.next(this.breakCount.value + 1);
      this.startWork();
    }
  }

  pause() {
    this.timerSubscription?.unsubscribe();
    this.cancelBackgroundNotification();
    this.targetEndTime = 0;
    this.state.next('IDLE');
  }

  reset() {
    this.pause();
    this.timeLeft.next(this.WORK_TIME);
    this.breakCount.next(0);
  }

  private scheduleBackgroundNotification(delay: number) {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delay: delay
      });
    }
  }

  private cancelBackgroundNotification() {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'CANCEL_NOTIFICATION'
      });
    }
  }

  private notify() {
    // Show notification when break starts
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Eye Care 20/20', {
        body: 'Time for a 20-second break! Look 20 feet away.'
      });
    }
    // Play sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => { });
  }

  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
