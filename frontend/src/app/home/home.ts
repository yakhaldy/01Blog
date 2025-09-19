// home.component.ts

import {
  Component, OnInit, ChangeDetectorRef, TrackByFunction
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
import { MatSnackBarModule } from '@angular/material/snack-bar';


// App Modules
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../components/navbar/navbar';
import { FilterPipe } from '../pipes/filter-pipe';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';

import { isImage, isVideo } from './home.helpers';
import { User, UpdatePostResult, NewPost } from './home.model';
import { HomeService } from './home.service';
import { Post } from '../auth';
import { error, log } from 'node:console';

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
    FilterPipe
  ]
})
export class Home implements OnInit {
  currentUser: User | null = null;
  posts: Post[] = [];
  users: User[] = [];
  searchTerm = '';
  isLoading = true;
  showMediaUpload = false;
  selectedFileName = '';

  newPost: NewPost = {
    description: '',
    mediaFile: undefined
  };

  constructor(
    private router: Router,
    private homeService: HomeService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    const token = this.homeService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCurrentUser();
    this.loadPosts();
    this.loadUsers();
  }

  private loadCurrentUser(): void {
    this.homeService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleAuthError(error);
        this.cdr.detectChanges();
      }
    });
  }
  private loadUsers(): void {
   this.homeService.getAllUsers().subscribe({
    next:(users) =>{
      this.users = users;
    },
    error:(error)=>{
        this.handleAuthError(error);
    }
   })
  }


  private handleAuthError(error: any): void {
    // if (error.status === 401 || error.status === 403) {
    //   localStorage.removeItem('token');
    //   this.router.navigate(['/login']);
    // }
    console.log(error);
    
  }

  private loadPosts(): void {
    this.homeService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.cdr.detectChanges();        
      },
      error: (error) => {
        console.error('Failed to load posts:', error);
      }
    });
  }

  isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser?.username;
  }

  deletePost(post: Post): void {
    this.homeService.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => post.id !== p.id);
      },
      error: (error) => {
        console.error('Failed to delete Post:', error);
      }
    });
  }

  updatePost(post: Post): void {
    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
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
            this.cdr.detectChanges();
          },
          error: (error) => this.handleUpdatePostError(error)
        });
      }
    });
  }

  private handleUpdatePostError(error: any): void {
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
    console.error(errorMessage);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'video/mp4', 'video/webm', 'video/avi'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type.');
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      this.newPost.mediaFile = file;
      this.selectedFileName = file.name;
    }
  }

  removeMediaFile(): void {
    this.newPost.mediaFile = undefined;
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  createPost(): void {
    if (!this.isPostFormValid) return;

    const postData = {
      description: this.newPost.description.trim(),
      mediaFile: this.newPost.mediaFile
    };

    this.homeService.createPost(postData).subscribe({
      next: (newPost) => {
        this.posts = [newPost, ...this.posts];
        this.resetPostForm();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to create post:', error);
          this.handleAuthError(error);
        
      }
    });
  }

  private resetPostForm(): void {
    this.newPost = { description: '', mediaFile: undefined };
    this.selectedFileName = '';
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const input = document.getElementById('input') as HTMLInputElement;
    if (input) input.value = '';
  }

  likePoste(id: number): void {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      post.isLiked = !post.isLiked;
      this.homeService.likePost(id).subscribe({
        next:(updatedPost) =>{
            const index = this.posts.findIndex(p => p.id === post.id);
           this.posts[index].likesCount = updatedPost.likesCount;
        },
        error: (error)=>{
          this.handleAuthError(error);
        }
      })
    }
  }



  commentPoste(id: number): void {
    console.log('Comment on post', id);
  }

  follow(user: User): void {
    if (!user.id) return;
    console.log('Following user:', user.username);
  }

  goToProfile(username: string): void {
    console.log('Go to profile:', username);
  }

  // trackByUsername: TrackByFunction<User> = (index: number, user: User): string =>
  //   user.username || index.toString();

  get isPostFormValid(): boolean {
    return this.newPost.description.trim().length > 0 && !this.isCharacterLimitExceeded;
  }

  get postCharacterCount(): number {
    return this.newPost.description.length;
  }

  get isCharacterLimitExceeded(): boolean {
    return this.postCharacterCount > 1000;
  }

  // Optionally use these from home.helpers.ts
  isImage = isImage;
  isVideo = isVideo;
}
