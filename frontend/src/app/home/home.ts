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
import { log } from 'console';

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
  selectedFileNames = signal<string[]>([]);
  filePreviewUrls = signal<string[]>([]);
  isSubmittingPost = signal(false);
  newPost = signal<NewPost>({
    title: '',
    description: '',
    mediaFiles: []
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

  // Carousel state - map postId to current image index
  currentImageIndices = new Map<number, number>();

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

        this.hasMoreUsersResults.set(this.currentUsersPage() + 1 < response.totalPages);
        this.isLoadingUsers.set(false);
        this.currentUsersPage.update(page => page + 1);
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

    if (currentPost.mediaFiles && currentPost.mediaFiles.length > 0) {
      currentPost.mediaFiles.forEach(file => {
        formData.append('mediaFiles', file);
      });
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
        imgUrls: post.mediaUrls,
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

        if (result.mediaFiles && result.mediaFiles.length > 0) {
          
          result.mediaFiles.forEach(file => {
            updateData.append('mediaFiles', file);
          });
        }

        if (result.removeCurrentImage) {
          updateData.append('removeImage', 'true');
        }
        
        // Send remaining image URLs
        if (result.remainingImageUrls && result.remainingImageUrls.length > 0) {
          updateData.append('keepImages', JSON.stringify(result.remainingImageUrls));
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
        post.isLiked = originalIsLiked;
        post.likesCount = originalLikesCount;
        this.posts.set([...posts]);
        if (error.status === 404) {
          this.toastService.show('Post not found or has been removed', 'error');
        }else{
          this.errorHandler.handle(error, 'Failed to like post');
        }
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

  updatePostTitle(title: string): void {
    const trimmedTitle = title.trim();
    this.newPost.update(post => ({ ...post, title: trimmedTitle }));
  }

  updatePostDescription(description: string): void {
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
      const currentFiles = this.newPost().mediaFiles || [];
      
      // Limiter à 3 fichiers maximum
      if (currentFiles.length + input.files.length > 3) {
        this.toastService.show('You can upload a maximum of 3 images', 'error');
        input.value = '';
        return;
      }

      const validFiles: File[] = [];
      const validUrls: string[] = [];
      const validNames: string[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        if (!isValidMediaType(file)) {
          this.toastService.show(`${file.name}: Please select a valid image or video file (JPEG, PNG, GIF, MP4, AVI, MOV)`, 'error');
          continue;
        }

        if (!isValidMediaSize(file)) {
          this.toastService.show(`${file.name}: File size must be less than 10MB`, 'error');
          continue;
        }

        validFiles.push(file);
        validUrls.push(URL.createObjectURL(file));
        validNames.push(file.name);
      }

      if (validFiles.length > 0) {
        this.newPost.update(post => ({ 
          ...post, 
          mediaFiles: [...currentFiles, ...validFiles] 
        }));
        this.filePreviewUrls.update(urls => [...urls, ...validUrls]);
        this.selectedFileNames.update(names => [...names, ...validNames]);
      }

      input.value = '';
    }
  }

  removeMediaFile(index: number): void {
    // Revoke the blob URL to free memory
    const urls = this.filePreviewUrls();
    if (urls[index]) {
      URL.revokeObjectURL(urls[index]);
    }

    this.newPost.update(post => {
      const files = [...(post.mediaFiles || [])];
      files.splice(index, 1);
      return { ...post, mediaFiles: files };
    });
    
    this.selectedFileNames.update(names => {
      const newNames = [...names];
      newNames.splice(index, 1);
      return newNames;
    });
    
    this.filePreviewUrls.update(urls => {
      const newUrls = [...urls];
      newUrls.splice(index, 1);
      return newUrls;
    });
  }

  // ==================== Helper Methods ====================

  private resetPostForm(): void {
    this.newPost.set({ title: '', description: '', mediaFiles: [] });
    this.selectedFileNames.set([]);
    
    // Revoke all preview URLs
    const urls = this.filePreviewUrls();
    urls.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewUrls.set([]);
    
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

  // Carousel methods
  getCurrentImageIndex(postId: number): number {
    return this.currentImageIndices.get(postId) || 0;
  }

  nextImage(post: Post, event: Event): void {
    event.stopPropagation();
    if (!post.mediaUrls || post.mediaUrls.length === 0) return;
    
    const currentIndex = this.getCurrentImageIndex(post.id);
    const nextIndex = (currentIndex + 1) % post.mediaUrls.length;
    this.currentImageIndices.set(post.id, nextIndex);
  }

  previousImage(post: Post, event: Event): void {
    event.stopPropagation();
    if (!post.mediaUrls || post.mediaUrls.length === 0) return;
    
    const currentIndex = this.getCurrentImageIndex(post.id);
    const previousIndex = currentIndex === 0 ? post.mediaUrls.length - 1 : currentIndex - 1;
    this.currentImageIndices.set(post.id, previousIndex);
  }

  goToImageIndex(post: Post, index: number, event: Event): void {
    event.stopPropagation();
    this.currentImageIndices.set(post.id, index);
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
