import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Post } from '../app/home/home.model';
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
  getInfoUser(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/${username}`);
  }
  
  // getToken(): string | null {
  //   return localStorage.getItem('token');
  // }



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
  follow(userId: string):Observable<any>{
    return this.http.post<Post>(`${this.apiUrl}/users/follow`, {userId: userId})
  }
//   getProfile(username: string): Observable<any> {
//   return this.http.get(`${this.apiUrl}/users/profile/${username}`);
// }
getMyPosts():Observable<Post[]> {
   return this.http.get<Post[]>(`${this.apiUrl}/posts/CurrentUserPost`)
}
getPostsUser(username:  string):Observable<Post[]> {
   return this.http.get<Post[]>(`${this.apiUrl}/posts/${username}`);
}
updateProfile(data: FormData):Observable<any>{
    return this.http.post(`${this.apiUrl}/profile`, data)
}

   
}
