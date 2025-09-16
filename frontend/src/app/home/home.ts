import { Component, OnInit, ChangeDetectorRef, OnDestroy, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { MatToolbarModule } from '@angular/material/toolbar';

// Custom Imports
import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { Auth, CreatePostRequest, Post } from '../auth';

// Interfaces
interface User {
  id?: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
}

// interface Post {
//   id?: string;
//   description: string;
//   media?: string;
//   author?: User;
//   createdAt?: Date;
//   likesCount?: number;
//   commentsCount?: number;
// }

interface NewPost {
  description: string;
  mediaFile?: File;
}

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
    MatToolbarModule,
    Navbar, 
    FilterPipe
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {
  // Component State
  currentUser: User | null = null;
  posts: Post[] = [];
  users: User[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  showMediaUpload: boolean = false;
  selectedFileName: string = '';
  
  // New Post Form
  newPost: NewPost = { 
    description: '', 
    mediaFile: undefined
  };


  // RxJS Subject for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component by checking authentication and loading data
   */
  private initializeComponent(): void {
    const token = this.auth.getToken();
    
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadAllData();
  }

  /**
   * Load all necessary data for the component
   */
  private loadAllData(): void {
    this.loadCurrentUser();
    this.loadPosts();
    this.loadUsers();
  }

  /**
   * Load current authenticated user data
   */
  loadCurrentUser(): void {
    this.auth.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          console.log('Current user loaded:', user);
          this.currentUser = user;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load current user:', error);
          this.isLoading = false;
          this.handleAuthError(error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load posts from the server
   */
  loadPosts(): void {
        this.auth.getAllPosts()
      .subscribe({
        next: (posts) => {
          this.posts = posts;
          console.log('Posts loaded:', posts);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load posts:', error);
          // this.showErrorMessage('Failed to load posts');
        }
      });
  }
 isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser?.username;
  }

   deletePost(post: Post): void {
    console.log("deletePost :", post);
    
    if (!post.id || !confirm('Are you sure you want to delete this post?')) {
      return;
    }

    // this.auth.deletePost(post.id)
      // .subscribe({
      //   next: () => {
      //     this.showSuccessMessage('Post deleted successfully!');
      //   },
      //   error: (error) => {
      //     console.error('Failed to delete post:', error);
      //     this.showErrorMessage(error.message || 'Failed to delete post');
      //   }
      // });
  }
isImage(url: string | null | undefined): boolean {
  return !!url && /\.(jpg|jpeg|png|gif)$/i.test(url);
}

isVideo(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|avi)$/i.test(url);
}


  loadUsers(): void {
    this.users = Array.from({ length: 10 }, (_, index) => ({
      id: `user-${index}`,
      username: `user${index}`,
      email: `user${index}@example.com`
    }));
  }

 
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/avi'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please select an image (JPEG, PNG, GIF) or video (MP4, WebM, AVI).');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      this.newPost.mediaFile = file;
      this.selectedFileName = file.name;
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  }

  removeMediaFile(): void {
    this.newPost.mediaFile = undefined;
    this.selectedFileName = '';
    // Clear the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }


  createPost(): void {
    if (!this.isPostFormValid) {
      console.log('Post form is invalid');
      return;
    }

    // Prepare form data
    const postData: CreatePostRequest = {
      description: this.newPost.description.trim()
    };

    if (this.newPost.mediaFile) {
      postData.mediaFile = this.newPost.mediaFile;
    }

    console.log("Creating post with data:", {
      description: postData.description,
      hasFile: !!postData.mediaFile,
      fileName: this.newPost.mediaFile?.name
    });
    
    this.auth.createPost(postData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newPost) => {
          console.log('Post created successfully:', newPost);
          this.posts = [newPost,...this.posts];
          this.resetPostForm();
          this.cdr.detectChanges();
        
        },
        error: (error) => {
          console.error('Failed to create post:', error);
          if (error.status === 401 || error.status === 403) {
            this.handleAuthError(error);
          }
        }
      });
  }

 
  private resetPostForm(): void {
    this.newPost = {
      description: '',
      mediaFile: undefined
    };
    this.selectedFileName = '';
    
    // Clear the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
     const Input = document.getElementById('input') as HTMLInputElement;
    if (Input) {
      Input.value = '';
    }
  }

  

  follow(user: User): void {
    if (!user.id) {
      console.error('Cannot follow user without ID');
      return;
    }

    console.log('Following user:', user.username);
  }

  goToProfile(username: string): void {
    console.log('Navigating to profile:', username);
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByUsername: TrackByFunction<User> = (index: number, user: User): string => {
    return user.username || index.toString();
  };

  /**
   * Check if the new post form is valid
   */
  get isPostFormValid(): boolean {
    return this.newPost.description.trim().length > 0 && !this.isCharacterLimitExceeded;
  }

  /**
   * Get character count for post description
   */
  get postCharacterCount(): number {
    return this.newPost.description.length;
  }

  /**
   * Check if character limit is exceeded
   */
  get isCharacterLimitExceeded(): boolean {
    return this.postCharacterCount > 280;
  }
}