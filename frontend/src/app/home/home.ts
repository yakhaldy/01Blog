import {
  Component, OnInit, ChangeDetectorRef, signal
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
        this.currentUser = user;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorHandler.handle(error, 'Failed to load user profile');
        this.cdr.markForCheck();
      }
    });
  }

  private loadUsers(): void {

    //  this.isLoadingUsers = true;
    this.homeService.getAllUsers(this.currentUsersPage, this.usersPageSize).subscribe({
      next: (response) => {        
        this.users.push(...response.content);
        console.log(response.content);
        
        this.hasMoreUsersResults = this.currentUsersPage + 1 < response.totalPages;
        this.isLoadingUsers = false;
        this.currentUsersPage++;
        console.table(this.users);
        console.log(this.isLoadingUsers);
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.currentUsersPage--; 
       this.isLoadingUsers = false;
        this.errorHandler.handle(error, 'Failed to load more results', false);
        this.cdr.markForCheck();
      }
    });
  }

    // Unified scroll handler for the user list
  showMoreUsers(): void {
    if (!this.hasMoreUsersResults ) {
      return;
    }
    this.loadUsers();
  }

 

  // Track by function for better performance
  trackByUserId(index: number, user: User): number {
    return Number(user.id) || index;
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
        this.errorHandler.handle(error, 'Failed to load posts', false);
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
      title: this.newPost.title.trim() + "5444",
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
        this.errorHandler.handle(error, 'Failed to create post');
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
            this.errorHandler.handle(error, 'Failed to update post');
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
        this.errorHandler.handle(error, 'Failed to delete post');
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
        this.errorHandler.handle(error, 'Failed to like post', false);
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
        this.errorHandler.handle(error, 'Failed to follow user', false);
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
    // this.PostToDelete = undefined;
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
  /***************=>Search<=***********************/
  // Updated methods for your home.component.ts

  // Replace the search-related variables and methods with these:

  // Variables (add/update these in your component)
  searchResults: User[] = [];
  isLoadingSearch = false;
  hasMoreUsersResults = true;
  currentUsersPage = 0;
  usersPageSize = 6;
  private searchSubject = new Subject<string>();

  // In ngOnInit, call this:
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
    console.log('=====> ', this.searchTerm.trim());

    const term = this.searchTerm.trim();

    if (term.length === 0) {
      // Clear search results when search is empty
      this.searchResults = [];
      // this.currentUsersPage = 0;
      // this.hasMoreSearchResults = true;
      return;
    }

    // Reset search state for new search
    // this.currentUsersPage = 0;
    // this.hasMoreSearchResults = true;
    this.searchResults = [];

    // Trigger debounced search
    this.searchSubject.next(term);
  }

  // Perform the actual search
  private performSearch(searchTerm: string): void {
    if (!searchTerm || searchTerm.length === 0) {
      this.searchResults = [];
      return;
    }

    this.isLoadingSearch = true;

    this.homeService.searchUsers(searchTerm).subscribe({
      next: (response) => {
        this.searchResults = response;
        this.isLoadingSearch = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSearch = false;
        this.errorHandler.handle(error, 'Failed to search users', false);
        this.cdr.markForCheck();
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