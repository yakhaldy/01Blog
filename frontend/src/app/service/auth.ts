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
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  logout() {
    localStorage.removeItem('token');
    this.notifications.closeConnection();
  }

  getCurrentUser(): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get(`${this.apiUrl}/profile`);
  }
  getInfoUser(username: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get(`${this.apiUrl}/profile/${username}`);
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
    return this.http.get<Page<Post>>(`${this.apiUrl}/posts/CurrentUserPost?page=${page}&size=${size}`)
  }
  getPostsUser(username: string,page: number, size: number): Observable<Page<Post>> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Page<Post>>(`${this.apiUrl}/posts/${username}?page=${page}&size=${size}`);
  }
  updateProfile(data: FormData): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/profile`, data)
  }

  getImage(path: string | undefined): string | undefined {
    if (path) {
      return `${this.urlImage}/${path}`
    }
    return undefined;
  }
  getPost(id: number): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Post>(`${this.apiUrl}/post/${id}`)
  }

  Report(data: any) {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/profile/report`, data)
  }

  createComment(data: object): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/posts/comment`, data)
  }

  getPostComments(postId: number): Observable<Comment[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Comment[]>(`${this.apiUrl}/posts/getComment/${postId}`,)
  }


  updateComment(id: number, data: object): Observable<Comment> {
    if (!this.isBrowser) return EMPTY;
    return this.http.patch<Comment>(`${this.apiUrl}/posts/comment/${id}`, data)
  }

  deleteComment(id: number): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/posts/comment/${id}`)
  }

  getAllReports(): Observable<Report[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Report[]>(`${this.apiUrl}/admin/getReports`,)
  }

  getDashboardStats(): Observable<DashboardStats> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboardStats`,)

  }

  deleteUser(id: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/admin/deleteUser/${id}`)
  }

  banUser(id: string): Observable<User> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post<User>(`${this.apiUrl}/admin/banUser`, { userId: id })
  }

  getNotifications(): Observable<Notification[]> {
    if (!this.isBrowser) return EMPTY;
    return this.http.get<Notification[]>(`${this.apiUrl}/notification`,)

  }

  deleteReports(id: string): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.delete(`${this.apiUrl}/admin/report/${id}`)

  }

  searchUsers(searchTerm: string, page: number = 0, size: number = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search?searchTerm=${searchTerm}`);
  }
  markNotificationAsRead(ids: number[]): Observable<any> {
    if (!this.isBrowser) return EMPTY;
    return this.http.post(`${this.apiUrl}/notification/markAsRead`, { ids: ids });
  }

  updatePostStatue(id: number, statue: string): Observable<Post> {
    if (!this.isBrowser) return EMPTY;
    return this.http.patch<Post>(`${this.apiUrl}/admin/updateStatusP/${id}`, { statue: statue })
  }
}
