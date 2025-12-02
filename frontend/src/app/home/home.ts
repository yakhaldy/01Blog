import {
  Component, OnInit, signal, computed
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
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';
import { ReportDialog } from '../components/report-dialog/report-dialog';

import { User, UpdatePostResult, NewPost, Post } from '../model/model';

import { HomeService } from './home.service';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { Auth } from '../service/auth';
import { ToastService } from '../service/toast-service';
import { ErrorHandlerService } from '../helper/handleError';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
    InfiniteScrollModule
  ]
})
export class Home implements OnInit {
  currentUser = signal<User | null>(null);
  posts = signal<Post[]>([]);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  isLoadingPost = signal(false);
  isLoadingUsers = signal(true);
  showMediaUpload = signal(false);
  selectedFileName = signal('');
  filePreviewUrl = signal<string | null>(null);
  isSubmittingPost = signal(false);
  newPost = signal<NewPost>({
    title: '',
    description: '',
    mediaFile: undefined
  });

  hasMorePosts = signal(true);
  currentPage = signal(0);
  pageSize = 10;
  scrollDistance = 0;

  showModal = signal(false);
  isOpen = signal(false);
  PostToDelete = signal<Post | undefined>(undefined);

  // Create Post Modal
  showCreatePostModal = signal(false);

  // Search-related signals
  searchResults = signal<User[]>([]);
  isLoadingSearch = signal(false);
  hasMoreUsersResults = signal(true);
  currentUsersPage = signal(0);
  usersPageSize = 6;
  private searchSubject = new Subject<string>();

  // Computed signals
  isPostFormValid = computed(() => {
    const post = this.newPost();
    return post.description.trim().length > 0
      && post.title.trim().length > 0
      && !this.isCharacterLimitExceeded()
      && !this.isCharacterTitleLimitExceeded();
  });

  postCharacterCount = computed(() => this.newPost().description.trim().length);
  isCharacterLimitExceeded = computed(() => this.postCharacterCount() > 5000);
  postTitelCharacterCount = computed(() => this.newPost().title.trim().length);
  isCharacterTitleLimitExceeded = computed(() => this.postTitelCharacterCount() > 280);

  constructor(
    private router: Router,
    private homeService: HomeService,
    private dialog: MatDialog,
    private auth: Auth,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
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
        this.currentUser.set(user);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorHandler.handle(error, 'Failed to load user profile');
      }
    });
  }

  private loadUsers(): void {
    this.homeService.getAllUsers(this.currentUsersPage(), this.usersPageSize).subscribe({
      next: (response) => {
        this.users.update(users => [...users, ...response.content]);
        console.log(response.content);

        this.hasMoreUsersResults.set(this.currentUsersPage() + 1 < response.totalPages);
        this.isLoadingUsers.set(false);
        this.currentUsersPage.update(page => page + 1);
        console.table(this.users());
        console.log(this.isLoadingUsers());
      },
      error: (error: HttpErrorResponse) => {
        this.currentUsersPage.update(page => page - 1);
        this.isLoadingUsers.set(false);
        this.errorHandler.handle(error, 'Failed to load more results', false);
      }
    });
  }

  // Unified scroll handler for the user list
  showMoreUsers(): void {
    if (!this.hasMoreUsersResults()) {
      return;
    }
    this.loadUsers();
  }

  // Track by function for better performance
  trackByUserId(index: number, user: User): number {
    return Number(user.id) || index;
  }

  loadPosts(): void {
    if (this.isLoadingPost() || !this.hasMorePosts()) return;

    this.isLoadingPost.set(true);
    this.homeService.getPosts(this.currentPage(), this.pageSize).subscribe({
      next: (response) => {

        if (response && response.content.length > 0) {
          this.posts.update(posts => [...posts, ...response.content]);
          this.currentPage.update(page => page + 1);
          if (this.currentPage() >= response.totalPages) {
            this.hasMorePosts.set(false);
          }
        } else {
          this.hasMorePosts.set(false);
        }

        this.isLoadingPost.set(false);

      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPost.set(false);
        this.errorHandler.handle(error, 'Failed to load posts', false);
      }
    });
  }

  // ==================== Post CRUD Operations ====================

  createPost(): void {
    if (!this.isPostFormValid() || this.isSubmittingPost()) return;

    this.isSubmittingPost.set(true);

    const formData = new FormData();
    const currentPost = this.newPost();

    const postJson = JSON.stringify({
      title: currentPost.title.trim(),
      description: currentPost.description.trim()
    });

    formData.append('post', new Blob([postJson], { type: 'application/json' }));

    if (currentPost.mediaFile) {
      formData.append('mediaFile', currentPost.mediaFile);
    }

    this.homeService.createPost(formData).subscribe({
      next: (newPost) => {
        this.posts.update(posts => [newPost, ...posts]);
        this.isSubmittingPost.set(false);
        this.resetPostForm();
        this.closeCreatePostModal();
        this.toastService.show('Post created successfully', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmittingPost.set(false);
        this.errorHandler.handle(error, 'Failed to create post');
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
            this.posts.update(posts => {
              const index = posts.findIndex(p => p.id === post.id);
              if (index !== -1) {
                const newPosts = [...posts];
                newPosts[index] = updatedPost;
                return newPosts;
              }
              return posts;
            });
            this.toastService.show('Post updated successfully', 'success');
          },
          error: (error: HttpErrorResponse) => {
            this.errorHandler.handle(error, 'Failed to update post');
          }
        });
      }
    });
  }

  deletePost(post: Post): void {
    this.PostToDelete.set(post);
    this.open();
  }

  confirm(): void {
    const postToDelete = this.PostToDelete();
    if (!postToDelete) return;

    this.close();

    this.homeService.deletePost(postToDelete.id).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => postToDelete.id !== p.id));
        this.toastService.show('Post deleted successfully', 'success');
        this.PostToDelete.set(undefined);
      },
      error: (error: HttpErrorResponse) => {
        this.PostToDelete.set(undefined);
        this.errorHandler.handle(error, 'Failed to delete post');
      }
    });
  }

  likePoste(id: number): void {
    const posts = this.posts();
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Optimistic update
    const originalIsLiked = post.isLiked;
    const originalLikesCount = post.likesCount;

    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;
    this.posts.set([...posts]);

    this.homeService.likePost(id).subscribe({
      next: (updatedPost) => {
        this.posts.update(posts => {
          const index = posts.findIndex(p => p.id === id);
          if (index !== -1) {
            const newPosts = [...posts];
            newPosts[index].likesCount = updatedPost.likesCount;
            return newPosts;
          }
          return posts;
        });
      },
      error: (error: HttpErrorResponse) => {
        // Revert optimistic update
        post.isLiked = originalIsLiked;
        post.likesCount = originalLikesCount;
        this.posts.set([...posts]);
        this.errorHandler.handle(error, 'Failed to like post', false);
      }
    });
  }

  // ==================== User Actions ====================

  follow(user: User): void {
    if (!user.id) return;

    this.homeService.follow(user.id).subscribe({
      next: () => {
        this.users.update(users => {
          const index = users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            const newUsers = [...users];
            newUsers[index].isfollowing = !newUsers[index].isfollowing;
            return newUsers;
          }
          return users;
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to follow user', false);
      }
    });
  }

  // ==================== Media Handling ====================

  // Helper methods for ngModel binding with signals
  updatePostTitle(title: string): void {
    // Trim to match backend validation
    const trimmedTitle = title.trim();
    this.newPost.update(post => ({ ...post, title: trimmedTitle }));
  }

  updatePostDescription(description: string): void {
    // Trim to match backend validation
    const trimmedDescription = description.trim();
    this.newPost.update(post => ({ ...post, description: trimmedDescription }));
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!isValidMediaType(file)) {
        input.value = '';
        this.toastService.show('Please select a valid image or video file (JPEG, PNG, GIF, MP4, AVI, MOV)', 'error');
        return;
      }

      if (!isValidMediaSize(file)) {
        input.value = '';
        this.toastService.show('File size must be less than 10MB', 'error');
        return;
      }

      // Revoke previous URL if exists
      const prevUrl = this.filePreviewUrl();
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }

      // Create new preview URL
      const previewUrl = URL.createObjectURL(file);

      this.newPost.update(post => ({ ...post, mediaFile: file }));
      this.selectedFileName.set(file.name);
      this.filePreviewUrl.set(previewUrl);
    }
  }

  removeMediaFile(): void {
    // Revoke the blob URL to free memory
    const prevUrl = this.filePreviewUrl();
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }

    this.newPost.update(post => ({ ...post, mediaFile: undefined }));
    this.selectedFileName.set('');
    this.filePreviewUrl.set(null);

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // ==================== Helper Methods ====================

  private resetPostForm(): void {
    this.newPost.set({ title: '', description: '', mediaFile: undefined });
    this.selectedFileName.set('');
    if (this.filePreviewUrl()) {
      URL.revokeObjectURL(this.filePreviewUrl()!);
      this.filePreviewUrl.set(null);
    }
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const input = document.getElementById('input') as HTMLInputElement;
    if (input) input.value = '';
  }

  openCreatePostModal(): void {
    this.showCreatePostModal.set(true);
  }

  closeCreatePostModal(): void {
    this.showCreatePostModal.set(false);
    this.resetPostForm();
  }

  open(): void {
    this.showModal.set(true);
    setTimeout(() => this.isOpen.set(true), 10);
  }

  close(): void {
    this.isOpen.set(false);
    this.showModal.set(false);
  }

  onScroll(): void {
    this.loadPosts();
  }

  isMyPost(post: Post): boolean {
    const user = this.currentUser();
    return post.user?.username === user?.username;
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

  /***************=>Search<=***********************/

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  // Search method
  onSearch(): void {
    const term = this.searchTerm().trim();
    console.log('=====> ', term);

    if (term.length === 0) {
      this.searchResults.set([]);
      return;
    }

    this.searchResults.set([]);
    this.searchSubject.next(term);
  }

  // Perform the actual search
  private performSearch(searchTerm: string): void {
    if (!searchTerm || searchTerm.length === 0) {
      this.searchResults.set([]);
      return;
    }

    this.isLoadingSearch.set(true);

    this.homeService.searchUsers(searchTerm).subscribe({
      next: (response) => {
        this.searchResults.set(response);
        this.isLoadingSearch.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSearch.set(false);
        this.errorHandler.handle(error, 'Failed to search users', false);
      }
    });
  }
  reportPost(postId: number): void {
    const dialogRef = this.dialog.open(ReportDialog, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        type: 'post',
        targetId: postId
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        // Report was successfully submitted, toast is already shown by the dialog
        console.log('Post reported successfully');
      }
    });
  }

  /*****************************************************/

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/default-avatar.png';
  }

  getImage(path: string | undefined): string | undefined {
    return this.homeService.getImage(path);
  }

  // Media helpers
  isImage = isImage;
  isVideo = isVideo;
}
