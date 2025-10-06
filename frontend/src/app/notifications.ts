import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class Notifications {
  private isBrowser: boolean;

  constructor(private zone: NgZone, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  public getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }
  getNotificationCountStream(): Observable<number> {
    return new Observable<number>(observer => {
      const jwt = this.getToken();
      const eventSource = new EventSource(
        `http://localhost:8080/api/notifications/stream?token=${jwt}`,
        { withCredentials: true }
      );

      // Log when connection opens
      eventSource.onopen = (event) => {
        console.log('✅ SSE Connection opened', event);
      };

      eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
        this.zone.run(() => {
          const count = Number(event.data);
          console.log("📩 unreadCount received:", count);
          observer.next(count);
        });
      });



      eventSource.onerror = (error) => {
        console.error('❌ SSE error', error);
        console.log('🔍 ReadyState:', eventSource.readyState);
        console.log('🔍 URL:', eventSource.url);
        console.log('🔍 WithCredentials:', eventSource.withCredentials);

        // Don't close immediately on error - EventSource will auto-reconnect
        // eventSource.close();
        observer.error(error);
      };

      // Cleanup function
      return () => {
        console.log('🔌 Closing SSE connection');
        eventSource.close();
      };
    });
  }
}