// home.component.ts - محسّن مع معالجة أخطاء أفضل

import {
  Component, OnInit, ChangeDetectorRef,signal
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

// Angular Material Modules
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
import { MatMenuModule } from '@angular/material/menu';

import { isValidMediaType, isValidMediaSize, isImage, isVideo } from '../helper/postHleper';

// App Modules
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';

import { User, UpdatePostResult, NewPost, Post } from '../model/model';
import {
  getErrorMessage,
  HTTP_STATUS,
  getFirstValidationError
} from '../model/error-response.model';
import { HomeService } from './home.service';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { Auth } from '../service/auth';
import { ToastService } from '../service/toast-service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
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
    MatMenuModule,
    MatTooltipModule,
    MatToolbarModule,
    Navbar,
    FilterPipe,
    InfiniteScrollModule
  ]
})
export class Home implements OnInit {
  currentUser: User | null = null;
  posts: Post[] = [];
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  isLoading = true;
  isLoadingPost = false;
  isLoadingUsers = true;
  showMediaUpload = false;
  selectedFileName = '';
  isSubmittingPost = false;
  newPost: NewPost = {
    title: '',
    description: '',
    mediaFile: undefined
  };

  hasMorePosts = true;
  currentPage = 0;
  pageSize = 10;
  scrollDistance = 0;

  showModal = false;
  isOpen = false;
  PostToDelete?: Post;

  constructor(
    private router: Router,
    private homeService: HomeService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private auth: Auth,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.loadCurrentUser();
    this.loadPosts();
    this.loadUsers();
  }

  // ==================== Load Data Methods ====================

  private loadCurrentUser(): void {
    this.homeService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleError(error, 'Failed to load user profile');
        this.cdr.markForCheck();
      }
    });
  }

  private loadUsers(): void {
    this.homeService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingUsers = false;
        this.handleError(error, 'Failed to load users', false);
        this.cdr.markForCheck();
      }
    });
  }

  loadPosts(): void {
    if (this.isLoadingPost || !this.hasMorePosts) return;

    this.isLoadingPost = true;
    this.homeService.getPosts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response && response.content.length > 0) {
          this.posts.push(...response.content);
          this.currentPage++;
          if (this.currentPage >= response.totalPages) {
            this.hasMorePosts = false;
          }
        } else {
          this.hasMorePosts = false;
        }

        this.isLoadingPost = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPost = false;
        this.handleError(error, 'Failed to load posts', false);
        this.cdr.markForCheck();
      }
    });
  }

  // ==================== Post CRUD Operations ====================

  createPost(): void {
    if (!this.isPostFormValid || this.isSubmittingPost) return;

    this.isSubmittingPost = true;

    const formData = new FormData();

    const postJson = JSON.stringify({
      title: this.newPost.title.trim()+"5444",
      description: this.newPost.description.trim()
    });

    formData.append('post', new Blob([postJson], { type: 'application/json' }));

    if (this.newPost.mediaFile) {
      formData.append('mediaFile', this.newPost.mediaFile);
    }

    this.homeService.createPost(formData).subscribe({
      next: (newPost) => {
        this.posts = [newPost, ...this.posts];
        this.isSubmittingPost = false;
        this.resetPostForm();
        this.toastService.show('Post created successfully', 'success');
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmittingPost = false;
        this.handleError(error, 'Failed to create post');
        this.cdr.markForCheck();
      }
    });
  }

  updatePost(post: Post): void {
    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        title: post.title,
        content: post.description,
        imgUrl: post.mediaUrl,
        postId: post.id
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result: UpdatePostResult) => {
      if (result) {
        const updateData = new FormData();
        updateData.append('description', result.description);
        updateData.append('title', result.title);

        if (result.mediaFile) {
          updateData.append('mediaFile', result.mediaFile);
        }

        if (result.removeCurrentImage) {
          updateData.append('removeImage', 'true');
        }

        this.homeService.updatePost(post.id!, updateData).subscribe({
          next: (updatedPost) => {
            const index = this.posts.findIndex(p => p.id === post.id);
            if (index !== -1) {
              this.posts[index] = updatedPost;
            }
            this.toastService.show('Post updated successfully', 'success');
            this.cdr.markForCheck();
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, 'Failed to update post');
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  deletePost(post: Post): void {
    this.PostToDelete = post;
    this.open();
  }

  confirm(): void {
    if (!this.PostToDelete) return;

    this.close();

    this.homeService.deletePost(this.PostToDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => this.PostToDelete?.id !== p.id);
        this.toastService.show('Post deleted successfully', 'success');
        this.PostToDelete = undefined;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.PostToDelete = undefined;
        this.handleError(error, 'Failed to delete post');
        this.cdr.markForCheck();
      }
    });
  }

  likePoste(id: number): void {
    const post = this.posts.find(p => p.id === id);
    if (!post) return;

    // Optimistic update
    const originalIsLiked = post.isLiked;
    const originalLikesCount = post.likesCount;

    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;

    this.homeService.likePost(id).subscribe({
      next: (updatedPost) => {
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
          this.posts[index].likesCount = updatedPost.likesCount;
          // this.posts[index].isLiked = updatedPost.isLiked;
        }
      },
      error: (error: HttpErrorResponse) => {
        // Revert optimistic update
        post.isLiked = originalIsLiked;
        post.likesCount = originalLikesCount;
        this.handleError(error, 'Failed to like post', false);
        this.cdr.markForCheck();
      }
    });
  }

  // ==================== User Actions ====================

  follow(user: User): void {
    if (!user.id) return;

    this.homeService.follow(user.id).subscribe({
      next: () => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].isfollowing = !this.users[index].isfollowing;
        }
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Failed to follow user', false);
      }
    });
  }

  // ==================== Media Handling ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!isValidMediaType(file)) {
      this.toastService.show(
        'Invalid file type. Please select an image (JPEG, PNG, GIF) or video (MP4, WebM, AVI).',
        'error'
      );
      return;
    }

    if (!isValidMediaSize(file)) {
      this.toastService.show('File size exceeds 10MB limit.', 'error');
      return;
    }

    this.newPost.mediaFile = file;
    this.selectedFileName = file.name;
    this.cdr.markForCheck();
  }

  removeMediaFile(): void {
    this.newPost.mediaFile = undefined;
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.cdr.markForCheck();
  }

  // ==================== Error Handling ====================

  private handleError(
    error: HttpErrorResponse,
    defaultMessage: string = 'An error occurred',
    showToast: boolean = true
  ): void {
    console.error('Error:', error);

    let errorMessage = defaultMessage;

    // معالجة حسب status code
    switch (error.status) {
      case HTTP_STATUS.BAD_REQUEST:
        // قد يكون validation error أو business error
        errorMessage = getErrorMessage(error);
        break;

      case HTTP_STATUS.UNAUTHORIZED:
        errorMessage = 'Your session has expired. Please login again.';
        // الـ AuthInterceptor سيتعامل مع redirect
        break;

      case HTTP_STATUS.FORBIDDEN:
        errorMessage = getErrorMessage(error) || 'You do not have permission to perform this action.';
        break;

      case HTTP_STATUS.NOT_FOUND:
        errorMessage = getErrorMessage(error) || 'The requested resource was not found.';
        break;

      case HTTP_STATUS.CONFLICT:
        errorMessage = getErrorMessage(error) || 'This resource already exists.';
        break;

      case HTTP_STATUS.PAYLOAD_TOO_LARGE:
        errorMessage = 'File size is too large. Maximum size is 10MB.';
        break;

      case HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE:
        errorMessage = 'File type is not supported.';
        break;

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        errorMessage = 'Server error. Please try again later.';
        break;

      case 0:
        // Network error
        errorMessage = 'Network error. Please check your connection.';
        break;

      default:
        errorMessage = getErrorMessage(error) || defaultMessage;
    }

    if (showToast) {
      this.toastService.show(errorMessage, 'error');
    }
  }

  // ==================== Helper Methods ====================

  private resetPostForm(): void {
    this.newPost = { title: '', description: '', mediaFile: undefined };
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const input = document.getElementById('input') as HTMLInputElement;
    if (input) input.value = '';
  }

  open(): void {
    this.showModal = true;
    setTimeout(() => this.isOpen = true, 10);
  }

  close(): void {
    this.isOpen = false;
    this.showModal = false;
    this.PostToDelete = undefined;
  }

  onScroll(): void {
    this.loadPosts();
  }

  isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser?.username;
  }

  goToPost(id: number): void {
    this.router.navigate([`post/${id}`]);
  }

  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]);
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = term === ''
      ? []
      : this.users.filter(user => user.username.toLowerCase().includes(term));
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/default-avatar.png';
  }

  getImage(path: string | undefined): string | undefined {
    return this.homeService.getImage(path);
  }

  // ==================== Form Validation ====================

  get isPostFormValid(): boolean {
    return this.newPost.description.trim().length > 0
      && this.newPost.title.trim().length > 0
      && !this.isCharacterLimitExceeded
      && !this.isCharacterTitleLimitExceeded;
  }

  get postCharacterCount(): number {
    return this.newPost.description.length;
  }

  get isCharacterLimitExceeded(): boolean {
    return this.postCharacterCount > 5000;
  }

  get postTitelCharacterCount(): number {
    return this.newPost.title.length;
  }

  get isCharacterTitleLimitExceeded(): boolean {
    return this.postTitelCharacterCount > 280;
  }

  // Media helpers
  isImage = isImage;
  isVideo = isVideo;
}