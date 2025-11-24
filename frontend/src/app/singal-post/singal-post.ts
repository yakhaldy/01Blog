import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isImage, isVideo } from '../helper/postHleper';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';
import { Navbar } from '../components/navbar/navbar';
import { User, Post, Comment, UpdatePostResult } from '../model/model';
import { Auth } from '../service/auth';
import { ToastService } from '../service/toast-service';
import { ErrorHandlerService } from '../helper/handleError';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-singal-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './singal-post.html',
  styleUrls: ['./singal-post.css', '../home/home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SingalPost implements OnInit {

  post: Post | null = null;
  currentUser: User | null = null;
  comments: Comment[] = [];
  newComment: string = '';

  isLoading: boolean = true;
  isLoadingComments: boolean = false;
  isSubmittingComment: boolean = false;
  error: string | null = null;
  postId: number = 0;

  editingCommentId: number | null = null;
  editedContent: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.postId = parseInt(id, 10);
        this.loadPost();
        this.loadComments();
      } else {
        this.error = 'Invalid post ID';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.loadCurrentUser();
  }

  // --- Post Logic ---

  loadPost(): void {
    this.isLoading = true;
    this.error = null;

    this.auth.getPost(this.postId).subscribe({
      next: (post) => {
        this.post = post;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.error = 'Post not found or you do not have permission to view it.';
        this.isLoading = false;
        this.errorHandler.handle(error, 'Failed to load post');
        this.cdr.markForCheck();
      }
    });
  }

  editPost(): void {
    if (!this.post) return;

    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        content: this.post.description,
        title: this.post.title,
        imgUrl: this.post.mediaUrl,
        postId: this.post.id
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

        this.auth.updatePost(this.post!.id, updateData).subscribe({
          next: (updatedPost) => {
            this.post = updatedPost;
            this.showSuccessMessage('Post updated successfully!');
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
  PostToDelete?: Post | null;
  deletePost(): void {
    this.PostToDelete = this.post;
    this.open();
  }

  likePoste(): void {
    if (!this.post || !this.currentUser) {
      this.showErrorMessage('You must be logged in to like posts.');
      return;
    }

    // Optimistic update
    const originalIsLiked = this.post.isLiked;
    const originalLikesCount = this.post.likesCount;

    this.post.isLiked = !this.post.isLiked;
    this.post.likesCount += this.post.isLiked ? 1 : -1;

    this.cdr.markForCheck();

    this.auth.likePost(this.post.id).subscribe({
      next: (updatedPost) => {
        if (this.post) {
          this.post.likesCount = updatedPost.likesCount;
        }
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        if (this.post) {
          // Revert on error
          this.post.isLiked = originalIsLiked;
          this.post.likesCount = originalLikesCount;
          this.errorHandler.handle(error, 'Failed to like/unlike post', false);
          this.cdr.markForCheck();
        }
      }
    });
  }

  // --- Comment Logic ---

  loadComments(): void {
    this.isLoadingComments = true;

    this.auth.getPostComments(this.postId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoadingComments = false;
        // Also update the post's comment count if the post object is loaded
        if (this.post) {
          this.post.commentsCount = comments.length;
        }
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to load comments', false);
        this.isLoadingComments = false;
        this.cdr.markForCheck();
      }
    });
  }


  submitComment(): void {
    if (!this.newComment.trim() || this.isSubmittingComment) {
      return;
    }
    if (!this.currentUser) {
      this.showErrorMessage('You must be logged in to comment.');
      return;
    }

    this.isSubmittingComment = true;

    const commentData = {
      content: this.newComment.trim(),
      postId: this.postId
    };

    this.auth.createComment(commentData).subscribe({
      next: (newComment) => {
        this.comments.unshift(newComment);
        this.newComment = '';
        this.isSubmittingComment = false;
        if (this.post) {
          this.post.commentsCount = (this.post.commentsCount || 0) + 1;
        }
        this.showSuccessMessage('Comment posted successfully!'); 
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error posting comment:', error);
        this.isSubmittingComment = false;
        this.errorHandler.handle(error, 'Failed to post comment');
        this.cdr.markForCheck();
      }
    });
  }




  editComment(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editedContent = comment.content;
  }

  saveEditedComment(comment: Comment): void {
    if (this.editedContent.length > 500) return;

    this.auth.updateComment(comment.id, {postId: comment.id,content: this.editedContent }).subscribe({
      next: (updatedComment) => {
        comment.content = this.editedContent;
        this.cancelEdit();
        this.showSuccessMessage('Comment update successfully!'); 
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to update comment');
        this.cdr.markForCheck();
      }
    });


  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editedContent = '';
  }


  showModal = false;
  isOpen = false;

  commentToDelete?: Comment;

  deleteComment(comment: Comment): void {
    this.commentToDelete = comment;
    this.open(); // Show door modal
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
    this.commentToDelete = undefined;
    this.PostToDelete = undefined;

  }


  confirm() {
    if (!this.commentToDelete && !this.PostToDelete) return;

    if (this.commentToDelete) {
      this.auth.deleteComment(this.commentToDelete.id).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== this.commentToDelete!.id);
          if (this.post) {
            this.post.commentsCount = (this.post.commentsCount || 0) - 1;
          }
          this.showSuccessMessage('Comment deleted successfully!'); 
          this.cdr.markForCheck();
          this.commentToDelete = undefined;
          this.close();
        },
        error: (error: HttpErrorResponse) => {
          this.errorHandler.handle(error, 'Failed to delete comment');
          this.commentToDelete = undefined; 
          this.close();
        }
      });
    } else if (this.PostToDelete){
      this.auth.deletePost(this.PostToDelete.id).subscribe({
        next: () => {
          this.showSuccessMessage('Post deleted successfully!');
          this.router.navigate([`/`]);
           this.close();
        },
        error: (error: HttpErrorResponse) => {
          this.errorHandler.handle(error, 'Failed to delete post');
          this.cdr.markForCheck();
          this.close();
        }
      });
    }
  
  }


  loadCurrentUser(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'User not logged in', false);
        this.currentUser = null;
        this.cdr.markForCheck();
      }
    });
  }
  // --- Helper Methods ---


  isMyPost(): boolean {
    return this.post?.user.username === this.currentUser?.username;
  }

  isMyComment(comment: Comment): boolean {
    return comment.user?.username === this.currentUser?.username;
  }

  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]);
  }

  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }



  // --- Message Utilities ---

  private showSuccessMessage(message: string): void {
    this.toastService.show(message, "success")
  }

  private showErrorMessage(message: string): void {
    this.toastService.show(message, "error")
  }

  // Exported functions
  isImage = isImage;
  isVideo = isVideo;
}