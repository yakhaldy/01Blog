// home.service.ts

import { Injectable } from '@angular/core';
import { Auth, CreatePostRequest } from '../auth';
import { Observable } from 'rxjs';
import { User ,Post} from './home.model';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(private auth: Auth) {}

  // getToken(): string | null {
  //   return this.auth.getToken();
  // }

  getCurrentUser(): Observable<User> {
    return this.auth.getCurrentUser();
  }

  getAllPosts(): Observable<Post[]> {
    return this.auth.getAllPosts();
  }

  deletePost(id: number): Observable<any> {
    return this.auth.deletePost(id);
  }

  createPost(postData: CreatePostRequest): Observable<Post> {
    return this.auth.createPost(postData);
  }

  updatePost(postId: number, data: FormData): Observable<Post> {
    return this.auth.updatePost(postId, data);
  }
  likePost(postId: number) : Observable<Post> {
    return this.auth.likePost(postId);
  }
  getAllUsers(): Observable<User[]>{
    return  this.auth.getAllUsers();
  }
  follow(userID: string): Observable<any>{
    return this.auth.follow(userID);
  }
}
