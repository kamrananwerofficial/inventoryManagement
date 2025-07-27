
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$: Observable<Notification> = this.notificationSubject.asObservable();

  constructor() {}

  success(message: string, timeout: number = 5000): void {
    this.notify({ message, type: 'success', timeout });
  }

  info(message: string, timeout: number = 5000): void {
    this.notify({ message, type: 'info', timeout });
  }

  warning(message: string, timeout: number = 5000): void {
    this.notify({ message, type: 'warning', timeout });
  }

  error(message: string, timeout: number = 5000): void {
    this.notify({ message, type: 'danger', timeout });
  }

  private notify(notification: Notification): void {
    this.notificationSubject.next(notification);
  }
}
