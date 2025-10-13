
// import { Injectable, NgZone, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { isPlatformBrowser } from '@angular/common';

// @Injectable({
//   providedIn: 'root'
// })
// export class Notifications implements OnDestroy {
//   private isBrowser: boolean;
//   private eventSource: EventSource | null = null;

//   private notificationSubject = new BehaviorSubject<number>(0);
//   private isConnected = false;

//   constructor(private zone: NgZone, @Inject(PLATFORM_ID) platformId: Object) {
//     this.isBrowser = isPlatformBrowser(platformId);
//   }

//   public getToken(): string | null {
//     if (this.isBrowser) {
//       return localStorage.getItem('token');
//     }
//     return null;
//   }

//   /**
//    * Get notification count stream - uses a SINGLE shared SSE connection
//    * Multiple subscribers will share the same EventSource
//    */
//   getNotificationCountStream(): Observable<number> {
//     if (this.isConnected && this.eventSource) {
//       return this.notificationSubject.asObservable();
//     }

//     this.connect();
//     return this.notificationSubject.asObservable();
//   }

//   private connect(): void {
//     const jwt = this.getToken();
    
//     if (!jwt) {
//       console.error('❌ No authentication token available');
//       this.notificationSubject.error('No authentication token');
//       return;
//     }

//     // Close existing connection if any
//     this.disconnect();

//     console.log('🔌 Creating new SSE connection...');
    
//     this.eventSource = new EventSource(
//       `http://localhost:8080/api/notifications/stream?token=${jwt}`,
//       { withCredentials: true }
//     );

//     this.eventSource.onopen = (event) => {
//       console.log('✅ SSE Connection opened', event);
//       this.isConnected = true;
//     };

//     this.eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
//       this.zone.run(() => {
//         const count = Number(event.data);
//         console.log("📩 unreadCount received:", count);
//         this.notificationSubject.next(count);
//       });
//     });

//     this.eventSource.onerror = (error) => {
//       console.error('❌ SSE error', error);
//       this.isConnected = false;
      
//       // Check if it's a fatal error
//       if (this.eventSource?.readyState === EventSource.CLOSED) {
//         console.log('🔴 SSE connection closed by server');
//         this.notificationSubject.error(error);
        
//         // Attempt to reconnect after 5 seconds
//         setTimeout(() => {
//           console.log('🔄 Attempting to reconnect...');
//           this.connect();
//         }, 5000);
//       }
//       // For network errors, EventSource will auto-reconnect
//     };
//   }

//   private disconnect(): void {
//     if (this.eventSource) {
//       console.log('🔌 Closing existing SSE connection');
//       this.eventSource.close();
//       this.eventSource = null;
//       this.isConnected = false;
//     }
//   }

//   ngOnDestroy(): void {
//     console.log('🧹 Notifications service destroying');
//     this.disconnect();
//     this.notificationSubject.complete();
//   }

//   /**
//    * Manually close the connection (useful for logout)
//   */
//   public closeConnection(): void {
//     this.disconnect();
//   }
// }

// // import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
// // import { Observable } from 'rxjs';
// // import { isPlatformBrowser } from '@angular/common';


// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class Notifications {
// //   private isBrowser: boolean;

// //   constructor(private zone: NgZone, @Inject(PLATFORM_ID) platformId: Object) {
// //     this.isBrowser = isPlatformBrowser(platformId);
// //   }
// //   public getToken(): string | null {
// //     if (this.isBrowser) {
// //       return localStorage.getItem('token');
// //     }
// //     return null;
// //   }
// //   getNotificationCountStream(): Observable<number> {
// //     return new Observable<number>(observer => {
// //       const jwt = this.getToken();
// //       const eventSource = new EventSource(
// //         `http://localhost:8080/api/notifications/stream?token=${jwt}`,
// //         { withCredentials: true }
// //       );

// //       // Log when connection opens
// //       eventSource.onopen = (event) => {
// //         console.log('✅ SSE Connection opened', event);
// //       };

// //       eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
// //         this.zone.run(() => {
// //           const count = Number(event.data);
// //           console.log("📩 unreadCount received:", count);
// //           observer.next(count);
// //         });
// //       });



// //       eventSource.onerror = (error) => {
// //         console.error('❌ SSE error', error);
// //         console.log('🔍 ReadyState:', eventSource.readyState);
// //         console.log('🔍 URL:', eventSource.url);
// //         console.log('🔍 WithCredentials:', eventSource.withCredentials);

// //         // Don't close immediately on error - EventSource will auto-reconnect
// //         // eventSource.close();
// //         observer.error(error);
// //       };

// //       // Cleanup function
// //       return () => {
// //         console.log('🔌 Closing SSE connection');
// //         eventSource.close();
// //       };
// //     });
// //   }
// // }


import { Injectable, NgZone, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Notifications implements OnDestroy {
  private isBrowser: boolean;
  private eventSource: EventSource | null = null;

  private notificationSubject = new BehaviorSubject<number>(0);
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;

  constructor(private zone: NgZone, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  public getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Get notification count stream - uses a SINGLE shared SSE connection
   * Multiple subscribers will share the same EventSource
   */
  getNotificationCountStream(): Observable<number> {
    if (!this.isConnected || !this.eventSource) {
      this.connect();
    }
    
    return this.notificationSubject.asObservable();
  }

  private connect(): void {
    const jwt = this.getToken();
    
    if (!jwt) {
      console.error('❌ No authentication token available');
      return;
    }

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Close existing connection if any
    this.disconnect();

    console.log('🔌 Creating new SSE connection... (attempt ' + (this.reconnectAttempts + 1) + ')');
    
    try {
      this.eventSource = new EventSource(
        `http://localhost:8080/api/notifications/stream?token=${jwt}`,
        { withCredentials: true }
      );

      this.eventSource.onopen = (event) => {
        this.zone.run(() => {
          console.log('✅ SSE Connection opened');
          this.isConnected = true;
          this.reconnectAttempts = 0; // Reset on successful connection
        });
      };

      this.eventSource.addEventListener('unreadCount', (event: MessageEvent) => {
        this.zone.run(() => {
          const count = Number(event.data);
          console.log("📩 unreadCount received:", count);
          this.notificationSubject.next(count);
        });
      });

      // Add a heartbeat listener to detect connection health
      this.eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
        console.log('💓 Heartbeat received');
      });

      this.eventSource.onerror = (error) => {
        this.zone.run(() => {
          console.error('❌ SSE error', error);
          this.isConnected = false;
          
          // Check connection state
          if (this.eventSource) {
            console.log('🔍 ReadyState:', this.eventSource.readyState);
            
            // If connection is closed, attempt to reconnect
            if (this.eventSource.readyState === EventSource.CLOSED) {
              console.log('🔴 SSE connection closed by server');
              this.handleReconnect();
            } else if (this.eventSource.readyState === EventSource.CONNECTING) {
              console.log('🟡 SSE reconnecting...');
              // EventSource is already trying to reconnect
            }
          }
        });
      };
    } catch (error) {
      console.error('❌ Failed to create EventSource:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.notificationSubject.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.disconnect();
    this.notificationSubject.complete();
  }

  /**
   * Manually close the connection (useful for logout)
   */
  public closeConnection(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.disconnect();
  }

  /**
   * Manually trigger a reconnection
   */
  public forceReconnect(): void {
    console.log('🔄 Force reconnecting...');
    this.reconnectAttempts = 0;
    this.connect();
  }
}