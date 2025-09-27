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
  private urlImage = 'http://localhost:8080/uploads'

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



createPost(postData: FormData): Observable<Post> {
 

    return this.http.post<Post>(`${this.apiUrl}/posts`, postData);
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

 getImage(path: string | undefined): string | undefined {
    if (path){
      return `${this.urlImage}/${path}`
    }
    return undefined;
  }
   getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/post/${id}`)
  }

  Report(data: any){
    return this.http.post(`${this.apiUrl}/profile/report`, data)
  }
   
}
