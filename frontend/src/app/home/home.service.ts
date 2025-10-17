// home.service.ts

import { Injectable, } from '@angular/core';
import { Auth, CreatePostRequest } from '../service/auth';
import { Observable } from 'rxjs';
import { User, Post, Page } from '../model/model';

@Injectable({ providedIn: 'root' })
export class HomeService {

  constructor(private auth: Auth
  ) {
  }


  getCurrentUser(): Observable<User> {
    return this.auth.getCurrentUser();
  }

  getPosts(page: number, size: number): Observable<Page<Post>> {
    return this.auth.getAllPosts(page, size);
  }

  deletePost(id: number): Observable<any> {
    return this.auth.deletePost(id);
  }

  createPost(postData: FormData): Observable<Post> {
    return this.auth.createPost(postData);
  }

  updatePost(postId: number, data: FormData): Observable<Post> {
    return this.auth.updatePost(postId, data);
  }
  likePost(postId: number): Observable<Post> {
    return this.auth.likePost(postId);
  }
  getAllUsers(): Observable<User[]> {
    return this.auth.getAllUsers();
  }
  follow(userID: string): Observable<any> {
    return this.auth.follow(userID);
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}
