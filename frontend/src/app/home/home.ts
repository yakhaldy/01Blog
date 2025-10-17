// home.component.ts

import {
  Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

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

import { isValidMediaType, isValidMediaSize,isImage, isVideo } from '../helper/postHleper';

// App Modules
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';

import { User, UpdatePostResult, NewPost, Post } from '../model/model';
import { HomeService } from './home.service';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { Auth } from '../service/auth'
import { ToastService } from '../service/toast-service';
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    // Sequential loading approach
    this.loadCurrentUser();
    this.loadPosts();
    this.loadUsers();
  }

  private loadCurrentUser(): void {
    this.homeService.getCurrentUser().subscribe({
      next: (user) => {
        console.log(user);

        this.currentUser = user;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleAuthError(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadUsers(): void {
    this.homeService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
        console.log("==> ", users);
        this.cdr.markForCheck();

      },
      error: (error) => {
        this.handleAuthError(error);
        this.isLoadingUsers = false;
        this.cdr.markForCheck();
      }
    });
  }


  private handleAuthError(error: any): void {
    console.log(error);
  }

  /**************************** */
  hasMorePosts = true;
  currentPage = 0;
  pageSize = 10;
  scrollDistance = 2;
  /******************************* */


  loadPosts(): void {
    if (this.isLoadingPost || !this.hasMorePosts) return;
    
    this.isLoadingPost = true;
    this.homeService.getPosts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        const postsPage = response; 

        if (postsPage && postsPage.content.length > 0) {
          this.posts.push(...postsPage.content);
          this.currentPage++;
          if (this.currentPage >= postsPage.totalPages) {
            this.hasMorePosts = false;
          }
        } else {
          this.hasMorePosts = false; 
        }

        this.isLoadingPost = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load posts:', error);
        this.isLoadingPost = false;
        this.cdr.markForCheck();
      }
    });
  }

trackByPostId(index: number, post: any): number {
  return post.id;
}


  onScroll(): void {
    console.log(".............................onScroll.......................");
    this.loadPosts();
  }

  isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser?.username;
  }

  showModal = false;
  isOpen = false;

  PostToDelete?: Post; // add this at the top of your component

  deletePost(post: Post): void {
    this.PostToDelete = post;
    this.open();
  }

  open() {
    this.showModal = true;
    setTimeout(() => {
      this.isOpen = true;
    }, 10);

  }

  close() {
    this.isOpen = false;
    this.showModal = false;
    this.PostToDelete = undefined;

  }


  confirm() {
    if (!this.PostToDelete) return;
    this.isOpen = false;
    this.showModal = false;

    this.homeService.deletePost(this.PostToDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => this.PostToDelete?.id !== p.id);
        this.toastService.show("Post deleted successfully", "success")
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.show("Failed to delete Post", "error")
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
            console.log("updatePost :", updatedPost);

            const index = this.posts.findIndex(p => p.id === post.id);
            if (index !== -1) {
              this.posts[index] = updatedPost;
            }

            this.toastService.show("Post deleted successfully", "success")
            this.cdr.markForCheck();
          },
          error: (error) => {
            const errorMessage = this.handleUpdatePostError(error);
            this.toastService.show(errorMessage, "error")
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private handleUpdatePostError(error: any): string {
    let errorMessage = 'Failed to update post';
    if (error.status === 401 || error.status === 403) {
      errorMessage = 'Unauthorized to update this post';
      this.handleAuthError(error);
    } else if (error.status === 404) {
      errorMessage = 'Post not found';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid post data';
    } else if (error.status === 413) {
      errorMessage = 'File size too large';
    } else if (error.status === 415) {
      errorMessage = 'Unsupported file type';
    }
    return errorMessage;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!isValidMediaType(file)) {
        alert('Invalid file type. Please select an image (JPEG, PNG, GIF) or video (MP4, WebM, AVI).');
        return;
      }
      if (!isValidMediaSize(file)) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      this.newPost.mediaFile = file;
      this.selectedFileName = file.name;
      this.cdr.markForCheck();
    }
  }

  removeMediaFile(): void {
    this.newPost.mediaFile = undefined;
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.cdr.markForCheck();
  }

  createPost(): void {
    if (!this.isPostFormValid || this.isSubmittingPost) return;

    this.isSubmittingPost = true;

    const formData = new FormData();
    formData.append('title', this.newPost.title.trim());
    formData.append('description', this.newPost.description.trim());

    if (this.newPost.mediaFile) {
      formData.append('mediaFile', this.newPost.mediaFile);
    }

    this.homeService.createPost(formData).subscribe({
      next: (newPost) => {
        this.posts = [newPost, ...this.posts];
        this.isSubmittingPost = false;
        this.resetPostForm();
        this.toastService.show("Post create successfully", "success")
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to create post:', error);
        this.isSubmittingPost = false;
        this.handleAuthError(error);
        this.toastService.show(error.error, "error")
        this.cdr.markForCheck();
      }
    });
  }


  private resetPostForm(): void {
    this.newPost = { title: '', description: '', mediaFile: undefined };
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const input = document.getElementById('input') as HTMLInputElement;
    if (input) input.value = '';
  }

  likePoste(id: number): void {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      // Optimistic update
      const originalIsLiked = post.isLiked;
      const originalLikesCount = post.likesCount;

      post.isLiked = !post.isLiked;
      post.likesCount += post.isLiked ? 1 : -1;

      this.cdr.markForCheck();

      this.homeService.likePost(id).subscribe({
        next: (updatedPost) => {
          const index = this.posts.findIndex(p => p.id === post.id);
          if (index !== -1) {
            this.posts[index].likesCount = updatedPost.likesCount;
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          // Revert optimistic update on error
          post.isLiked = originalIsLiked;
          post.likesCount = originalLikesCount;
          this.handleAuthError(error);
          this.cdr.markForCheck();
        }
      });
    }
  }

  goToPost(id: number): void {
    console.log('go to post', id);
    this.router.navigate([`post/${id}`]);
  }

  follow(user: User): void {
    if (!user.id) return;
    console.log('Following user:', user.username);
    this.homeService.follow(user.id).subscribe({
      next: (res) => {
        console.log(res);
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].isfollowing = !this.users[index].isfollowing;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.handleAuthError(error);
      }
    });

  }

  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]);
  }

  get isPostFormValid(): boolean {
    return this.newPost.description.trim().length > 0 && this.newPost.title.trim().length > 0 && !this.isCharacterLimitExceeded && !this.isCharacterTitleLimitExceeded;
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


  // Optionally use these from home.helpers.ts
  isImage = isImage;
  isVideo = isVideo;

  getImage(path: string | undefined): string | undefined {
    return this.homeService.getImage(path)
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (term === '') {
      this.filteredUsers = [];
      return;
    }

    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(term)
    );
  }
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/default-avatar.png';
  }


}