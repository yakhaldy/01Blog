
import { Injectable, NgZone, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
    private http: HttpClient
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
      console.error('❌ No authentication token available');
      this.notificationSubject.error('No authentication token');
      return;
    }

    // Close existing connection if any
    this.disconnect();

    console.log('🔌 Creating new SSE connection...');

    this.eventSource = new EventSource(
      `http://localhost:8080/api/notifications/stream?token=${jwt}&connectionId=${this.connectionId}`
    );

    this.eventSource.onopen = (event) => {
      console.log('✅ SSE Connection opened', event);
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset on successful connection
    };

    this.eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
      this.zone.run(() => {
        const count = Number(event.data);
        console.log("📩 unreadCount received:", count);
        this.notificationSubject.next(count);
      });
    });

    this.eventSource.onerror = (error) => {
      console.error('❌ SSE error', error);
      this.isConnected = false;

      // Check if it's a fatal error
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.log('🔴 SSE connection closed by server');
        
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ Max reconnection attempts reached');
          return;
        }
        
        // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 60s (max)
        const delay = Math.min(
          this.BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
          this.MAX_DELAY
        );
        
        console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
        
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
      console.log('🔌 Closing existing SSE connection');
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  ngOnDestroy(): void {
    console.log('🧹 Notifications service destroying');
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
          next: (response) => console.log('✅ Backend SSE connections closed:', response),
          error: (error) => console.error('❌ Failed to close backend SSE connections:', error)
        });
    }
  }
}
