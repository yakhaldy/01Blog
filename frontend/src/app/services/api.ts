import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Api {
  private http!: HttpClient;

  private getHttp(): HttpClient {
    // if (!this.http && typeof window !== 'undefined') {
    //   this.http = inject(HttpClient);
    // }
    return this.http;
  }

  login(username: string, password: string): Observable<any> {
    if (typeof window === 'undefined') return of(null); // SSR-safe
    return this.getHttp().post('/api/login', { username, password });
  }

  register(username: string, password: string): Observable<any> {
    if (typeof window === 'undefined') return of(null);
    return this.getHttp().post('/api/register', { username, password });
  }
}
