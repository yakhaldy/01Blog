import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { Auth } from '../auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    Navbar, 
    FilterPipe
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  currentUser: any = null;
  posts: any[] = [];
  users: any[] = [];
  searchTerm: string = '';

  newPost = { description: '', mediaUrl: '' };
  isLoading = true;

 showMediaInput: boolean = false;
 
  constructor(
    private router: Router, 
    private http: HttpClient, 
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCurrentUser();
    this.loadPosts();
    this.loadUsers();
  }

  loadCurrentUser() {
    this.auth.getCurrentUser().subscribe({
      next: (res) => {
        console.log('Current user ===>', res);
        this.currentUser = res;
        this.isLoading = false;

        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.log('Failed to load current user', err);
        this.isLoading = false;

        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }

        this.cdr.detectChanges();
      }
    });
  }

  loadPosts() {
    // this.http.get('http://localhost:8080/api/posts').subscribe((res: any) => {
    //   this.posts = res;
    // });
  }

  loadUsers() {
    for (let index = 0; index < 10; index++) {
      this.users.push({ username: `user${index}` });
    }
    // this.http.get('http://localhost:8080/api/users').subscribe((res: any) => {
    //   this.users = res;
    // });
  }

  createPost() {
    // this.http.post('http://localhost:8080/api/posts', this.newPost).subscribe((res: any) => {
    //   this.posts.unshift(res);
    //   this.newPost = { description: '', mediaUrl: '' };
    // });
  }

  follow(user: any) {
    console.log('Follow clicked:', user);
  }

  goToProfile(username: string) {
    console.log('Navigate to profile:', username);
  }
}