// home.service.ts

import { Injectable,  Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, CreatePostRequest } from '../auth';
import { Observable } from 'rxjs';
import { User ,Post} from './home.model';

@Injectable({ providedIn: 'root' })
export class HomeService {
  isBrowser: boolean;

  constructor(private auth: Auth,
        @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

   public getToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem('token');
        }
        return null;
    }

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
