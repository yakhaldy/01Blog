import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../app/home/home.model';

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


  constructor(private http: HttpClient) { }

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
    return this.http.get(`${this.apiUrl}/profile`);
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }



createPost(postData: CreatePostRequest): Observable<Post> {
    const formData = new FormData();
    formData.append('description', postData.description);
    
    if (postData.mediaFile) {
      formData.append('mediaFile', postData.mediaFile);
    }

    return this.http.post<Post>(`${this.apiUrl}/posts`, formData);
  }

    
 getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts`)
  }
  deletePost(id : number): Observable<any>  {
    return this.http.delete(`${this.apiUrl}/posts/${id}`)
  }
  updatePost(id: number, data: FormData):Observable<Post>{
    return this.http.patch<Post>(`${this.apiUrl}/posts/${id}`,data)
  }
  likePost(id: number):Observable<Post>{
    return this.http.post<Post>(`${this.apiUrl}/posts/like`, {postId: id})
  }
  getAllUsers():Observable<User[]>{
        return this.http.get<User[]>(`${this.apiUrl}/users`)
 
  }
}
export interface Post {
  id: number;
  description: string;
  mediaUrl?: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}