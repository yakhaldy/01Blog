
import { Injectable, NgZone, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../helper/handleError';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root'
})
export class Notifications implements OnDestroy {
  private isBrowser: boolean;
  private eventSource: EventSource | null = null;
  private apiUrl = 'http://localhost:8080/api/notifications';

  private notificationSubject = new BehaviorSubject<number>(0);
  private isConnected = false;
  private connectionId: string = '';
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_DELAY = 3000; // 3 seconds
  private readonly MAX_DELAY = 60000; // 60 seconds

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private toastService: ToastService

  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Generate or retrieve connection ID for this tab
    if (this.isBrowser) {
      let connectionId = sessionStorage.getItem('sse-connection-id');
      if (!connectionId) {
        connectionId = this.generateUUID();
        sessionStorage.setItem('sse-connection-id', connectionId);
      }
      this.connectionId = connectionId;
    }
  }

  public getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get notification count stream - uses a SINGLE shared SSE connection
   * Multiple subscribers will share the same EventSource
   */
  getNotificationCountStream(): Observable<number> {
    if (this.isConnected && this.eventSource) {
      return this.notificationSubject.asObservable();
    }

    this.connect();

    return this.notificationSubject.asObservable();
  }

  private connect(): void {
    if (!this.isBrowser) {
      console.warn('SSE connections not supported on server side');
      return;
    }
    const jwt = this.getToken();

    if (!jwt) {
      this.notificationSubject.error('No authentication token');
      return;
    }

    // Close existing connection if any
    this.disconnect();


    this.eventSource = new EventSource(
      `http://localhost:8080/api/notifications/stream?token=${jwt}&connectionId=${this.connectionId}`
    );

    this.eventSource.onopen = (event) => {
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset on successful connection
    };

    this.eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
      this.zone.run(() => {
        const count = Number(event.data);
        this.notificationSubject.next(count);
      });
    });

    this.eventSource.onerror = (error) => {
      this.isConnected = false;

      // Check if it's a fatal error
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
          this.disconnect();
          return;
        }

        // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 60s (max)
        const delay = Math.min(
          this.BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
          this.MAX_DELAY
        );


        // Attempt to reconnect after delay
        setTimeout(() => {
          this.connect();
        }, delay);
      }
      // For network errors, EventSource will auto-reconnect
    };
  }

  private disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.notificationSubject.complete();
  }

  public closeConnection(): void {
    this.disconnect();

    // Optionally notify backend to close all SSE connections for this user
    const token = this.getToken();
    if (token && this.isBrowser) {
      this.http.post(`${this.apiUrl}/disconnect?token=${token}`, {})
        .subscribe({
          next: (response) => {
            this.toastService.show('Disconnected from notifications', 'info');
          },
          error: (error: HttpErrorResponse) => {
            this.errorHandler.handle(error, 'Failed to update post');
          }
        });
    }
  }
}
