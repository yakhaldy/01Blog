import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  logout() {
    localStorage.removeItem('token');
  }

  getCurrentUser(): Observable<any> {
    // Debug: Check if token exists
    const token = localStorage.getItem('token');
    console.log('🔍 Auth Service - Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found in getCurrentUser()');
    }

    // The interceptor should add the Authorization header automatically
    console.log('🚀 Making request to /getMydata');
    return this.http.get(`${this.apiUrl}/getMydata`);
  }

  // Alternative method with manual header (for testing)
  getCurrentUserManual(): Observable<any> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('🚀 Making manual request with headers:', headers.keys());
    
    return this.http.get(`${this.apiUrl}/getMydata`, { headers });
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
