
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { Auth } from '../auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar, FilterPipe, CommonModule, FormsModule],
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
  // errorMessage: string | null = null;

  constructor(private router: Router, private http: HttpClient, private auth: Auth,private cdr: ChangeDetectorRef) { }


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
        // this.errorMessage = null;

        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.log('Failed to load current user', err);
        this.isLoading = false;
        // this.errorMessage = 'Failed to load user data';

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
