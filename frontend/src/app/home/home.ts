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
import { Auth } from '../auth';

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

interface Post {
  id?: string;
  description: string;
  media?: string;
  author?: User;
  createdAt?: Date;
  likesCount?: number;
  commentsCount?: number;
}

interface NewPost {
  description: string;
  media: string;
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
    media: '',
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
    // TODO: Implement API call
    // this.http.get<Post[]>('http://localhost:8080/api/posts')
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (posts) => {
    //       this.posts = posts;
    //       this.cdr.detectChanges();
    //     },
    //     error: (error) => {
    //       console.error('Failed to load posts:', error);
    //     }
    //   });
  }

  /**
   * Load users list for suggestions
   */
  loadUsers(): void {
    // Generate mock users for now
    this.users = Array.from({ length: 10 }, (_, index) => ({
      id: `user-${index}`,
      username: `user${index}`,
      email: `user${index}@example.com`
    }));

    // TODO: Implement API call
    // this.http.get<User[]>('http://localhost:8080/api/users')
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (users) => {
    //       this.users = users;
    //       this.cdr.detectChanges();
    //     },
    //     error: (error) => {
    //       console.error('Failed to load users:', error);
    //     }
    //   });
  }

  /**
   * Toggle media upload section visibility
   */
  toggleMediaUpload(): void {
    this.showMediaUpload = !this.showMediaUpload;
    
    // Clear media data when hiding upload section
    if (!this.showMediaUpload) {
      this.newPost.media = '';
      this.newPost.mediaFile = undefined;
      this.selectedFileName = '';
    }
  }


  /**
   * Handle file selection for media upload
   */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        console.error('File size exceeds 10MB limit');
        // TODO: Show user-friendly error message
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type');
        // TODO: Show user-friendly error message
        return;
      }

      this.newPost.mediaFile = file;
      this.selectedFileName = file.name;
      this.newPost.media = ''; // Clear URL input when file is selected
      
      console.log('File selected:', file.name, file.size, file.type);
    }
  }

  /**
   * Create a new post
   */
  createPost(): void {
    if (!this.newPost.description.trim()) {
      return;
    }

    console.log('Creating post:', {
      description: this.newPost.description.trim(),
      mediaUrl: this.newPost.media.trim(),
      mediaFile: this.newPost.mediaFile ? {
        name: this.newPost.mediaFile.name,
        size: this.newPost.mediaFile.size,
        type: this.newPost.mediaFile.type
      } : null
    });

    // Reset form after creating post
    this.resetPostForm();

    // TODO: Implement API call with FormData for file upload
    // const formData = new FormData();
    // formData.append('description', this.newPost.description.trim());
    // 
    // if (this.newPost.mediaFile) {
    //   formData.append('mediaFile', this.newPost.mediaFile);
    // } else if (this.newPost.media.trim()) {
    //   formData.append('mediaUrl', this.newPost.media.trim());
    // }
    // 
    // this.http.post<Post>('http://localhost:8080/api/posts', formData)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (newPost) => {
    //       this.posts.unshift(newPost);
    //       this.resetPostForm();
    //       this.cdr.detectChanges();
    //     },
    //     error: (error) => {
    //       console.error('Failed to create post:', error);
    //     }
    //   });
  }

  /**
   * Reset the post creation form
   */
  private resetPostForm(): void {
    this.newPost = { 
      description: '', 
      media: '',
      mediaFile: undefined
    };
    this.selectedFileName = '';
    this.showMediaUpload = false;
  }

  /**
   * Follow a user
   */
  follow(user: User): void {
    if (!user.id) {
      console.error('Cannot follow user without ID');
      return;
    }

    console.log('Following user:', user.username);

    // TODO: Implement API call
    // this.http.post(`http://localhost:8080/api/users/${user.id}/follow`, {})
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       console.log(`Successfully followed ${user.username}`);
    //       // Update UI state or reload data as needed
    //     },
    //     error: (error) => {
    //       console.error('Failed to follow user:', error);
    //     }
    //   });
  }

  /**
   * Navigate to user profile
   */
  goToProfile(username: string): void {
    console.log('Navigating to profile:', username);
    // this.router.navigate(['/profile', username]);
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