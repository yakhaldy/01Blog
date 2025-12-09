import { Injectable, Inject, PLATFORM_ID  } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { User, Post, Comment, Report, DashboardStats, Notification,Page } from '../model/model';
import { Notifications } from './notifications';
import { isPlatformBrowser } from '@angular/common';

export interface CreatePostRequest {
  description: string;
  mediaFile?: File;
  mediaUrl?: string;
}



@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/api';
  private urlImage = 'http://localhost:8080/uploads'
  private isBrowser: boolean;

  constructor(private http: HttpClient, private notifications: Notifications,     @Inject(PLATFORM_ID) private platformId: Object) {
     this.isBrowser = isPlatformBrowser(this.platformId);
  }

  register(user: any): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  login(credentials: any): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }
  logout() {
    localStorage.removeItem('token');
    this.notifications.closeConnection();
  }

  getCurrentUser(): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get(`${this.apiUrl}/users/me`);
  }
  getInfoUser(username: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get(`${this.apiUrl}/users/${username}`);
  }



  createPost(postData: FormData): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post<Post>(`${this.apiUrl}/posts`, postData);
  }



  getAllPosts(page: number, size: number): Observable<Page<Post>> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Page<Post>>(`${this.apiUrl}/posts?page=${page}&size=${size}`);
  }

  deletePost(id: number): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/posts/${id}`)
  }
  updatePost(id: number, data: FormData): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.patch<Post>(`${this.apiUrl}/posts/${id}`, data)
  }
  likePost(id: number): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post<Post>(`${this.apiUrl}/posts/like`, { postId: id })
  }
  getAllUsers(page: number = 0, size: number = 7): Observable<Page<User>> {
    if (!this.isBrowser) return EMPTY;

    return this.http.get<Page<User>>(`${this.apiUrl}/users?page=${page}&size=${size}`)

  }
  follow(userId: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post<Post>(`${this.apiUrl}/users/follow`, { userId: userId })
  }

  getMyPosts(page: number, size: number): Observable<Page<Post>> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Page<Post>>(`${this.apiUrl}/posts/me?page=${page}&size=${size}`)
  }
  getPostsUser(username: string,page: number, size: number): Observable<Page<Post>> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Page<Post>>(`${this.apiUrl}/posts/user/${username}?page=${page}&size=${size}`);
  }
  updateProfile(data: FormData): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/users/me`, data)
  }

  getImage(path: string | undefined): string | undefined {
    if (path) {
      return `${this.urlImage}/${path}`
    }
    return undefined;
  }
  getPost(id: string): Observable<Post> {    
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`)
  }

  Report(data: any) {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/reports/user`, data)
  }

  createComment(data: object): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/comments`, data)
  }

  getPostComments(postId: string): Observable<Comment[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Comment[]>(`${this.apiUrl}/comments/post/${postId}`,)
  }


  updateComment(id: number, data: object): Observable<Comment> {
    if (!this.isBrowser) return EMPTY;
    return this.http.patch<Comment>(`${this.apiUrl}/comments/${id}`, data)
  }

  deleteComment(id: number): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/comments/${id}`)
  }

  getAllReports(): Observable<Report[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Report[]>(`${this.apiUrl}/admin/reports`,)
  }

  getDashboardStats(): Observable<DashboardStats> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`,)

  }

  deleteUser(id: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`)
  }

  banUser(id: string): Observable<User> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post<User>(`${this.apiUrl}/admin/users/ban`, { userId: id })
  }

  getNotifications(): Observable<Notification[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`,)

  }

  deleteReports(id: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/admin/reports/${id}`)

  }

  searchUsers(searchTerm: string, page: number = 0, size: number = 10): Observable<User[]> {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    return this.http.get<User[]>(`${this.apiUrl}/users/search?searchTerm=${encodedSearchTerm}`);
  }
  markNotificationAsRead(ids: number[]): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/notifications/markAsRead`, { ids: ids });
  }

  updatePostStatue(id: number, statue: string): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.patch<Post>(`${this.apiUrl}/admin/posts/${id}/status`, { statue: statue })
  }

  ReportPost(data: any) {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/reports/post`, data)  
  }
}
