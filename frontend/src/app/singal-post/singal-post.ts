import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
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
import { ReportDialog } from '../components/report-dialog/report-dialog';
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

  post = signal<Post | null>(null);
  currentUser = signal<User | null>(null);
  comments = signal<Comment[]>([]);
  newComment = signal('');

  isLoading = signal(true);
  isLoadingComments = signal(false);
  isSubmittingComment = signal(false);
  error = signal<string | null>(null);
  postId = signal('');

  editingCommentId = signal<number | null>(null);
  editedContent = signal('');

  PostToDelete = signal<Post | null>(null);
  showModal = signal(false);
  isOpen = signal(false);
  commentToDelete = signal<Comment | undefined>(undefined);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.postId.set(id);
        this.loadPost();
        this.loadComments();
      } else {
        this.error.set('Invalid post ID');
        this.isLoading.set(false);
      }
    });

    this.loadCurrentUser();
  }

  // --- Post Logic ---

  loadPost(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.auth.getPost(this.postId()).subscribe({
      next: (post) => {
        this.post.set(post);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set('Post not found or you do not have permission to view it.');
        this.isLoading.set(false);
        this.errorHandler.handle(error, 'Failed to load post');
      }
    });
  }

  editPost(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        content: currentPost.description,
        title: currentPost.title,
        imgUrl: currentPost.mediaUrl,
        postId: currentPost.id
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

        this.auth.updatePost(currentPost.id, updateData).subscribe({
          next: (updatedPost) => {
            this.post.set(updatedPost);
            this.showSuccessMessage('Post updated successfully!');
          },
          error: (error: HttpErrorResponse) => {
            this.errorHandler.handle(error, 'Failed to update post');
          }
        });
      }
    });
  }

  deletePost(): void {
    this.PostToDelete.set(this.post());
    this.open();
  }

  likePoste(): void {
    const currentPost = this.post();
    const user = this.currentUser();
    
    if (!currentPost || !user) {
      this.showErrorMessage('You must be logged in to like posts.');
      return;
    }

    // Optimistic update
    const originalIsLiked = currentPost.isLiked;
    const originalLikesCount = currentPost.likesCount;

    this.post.update(p => {
      if (!p) return p;
      return {
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.likesCount + (p.isLiked ? -1 : 1)
      };
    });

    this.auth.likePost(currentPost.id).subscribe({
      next: (updatedPost) => {
        this.post.update(p => {
          if (!p) return p;
          return { ...p, likesCount: updatedPost.likesCount };
        });
      },
      error: (error: HttpErrorResponse) => {
        // Revert on error
        this.post.update(p => {
          if (!p) return p;
          return {
            ...p,
            isLiked: originalIsLiked,
            likesCount: originalLikesCount
          };
        });
        this.errorHandler.handle(error, 'Failed to like/unlike post', false);
      }
    });
  }

  reportPost(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const dialogRef = this.dialog.open(ReportDialog, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        type: 'post',
        targetId: currentPost.id
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log('Post reported successfully');
      }
    });
  }

  // --- Comment Logic ---

  loadComments(): void {
    this.isLoadingComments.set(true);

    this.auth.getPostComments(this.postId()).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.isLoadingComments.set(false);
        // Also update the post's comment count if the post object is loaded
        this.post.update(p => {
          if (!p) return p;
          return { ...p, commentsCount: comments.length };
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to load comments', false);
        this.isLoadingComments.set(false);
      }
    });
  }


  submitComment(): void {
    if (!this.newComment().trim() || this.isSubmittingComment()) {
      return;
    }
    if (!this.currentUser()) {
      this.showErrorMessage('You must be logged in to comment.');
      return;
    }

    this.isSubmittingComment.set(true);

    const commentData = {
      content: this.newComment().trim(),
      postId: this.postId()
    };

    this.auth.createComment(commentData).subscribe({
      next: (newComment) => {
        this.comments.update(c => [newComment, ...c]);
        this.newComment.set('');
        this.isSubmittingComment.set(false);
        this.post.update(p => {
          if (!p) return p;
          return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
        });
        this.showSuccessMessage('Comment posted successfully!'); 
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error posting comment:', error);
        this.isSubmittingComment.set(false);
        this.errorHandler.handle(error, 'Failed to post comment');
      }
    });
  }




  editComment(comment: Comment): void {
    this.editingCommentId.set(comment.id);
    this.editedContent.set(comment.content);
  }

  saveEditedComment(comment: Comment): void {
    if (this.editedContent().length > 500) return;

    this.auth.updateComment(comment.id, {postId: comment.id, content: this.editedContent() }).subscribe({
      next: (updatedComment) => {
        comment.content = this.editedContent();
        this.cancelEdit();
        this.showSuccessMessage('Comment update successfully!'); 
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to update comment');
      }
    });
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editedContent.set('');
  }


  deleteComment(comment: Comment): void {
    this.commentToDelete.set(comment);
    this.open(); // Show door modal
  }

  open() {
    this.showModal.set(true);

    setTimeout(() => {
      this.isOpen.set(true);
    }, 10);
  }

  close() {
    this.isOpen.set(false);
    this.showModal.set(false);
    this.commentToDelete.set(undefined);
    this.PostToDelete.set(null);
  }


  confirm() {
    const commentToDelete = this.commentToDelete();
    const postToDelete = this.PostToDelete();
    
    if (!commentToDelete && !postToDelete) return;

    if (commentToDelete) {
      this.auth.deleteComment(commentToDelete.id).subscribe({
        next: () => {
          this.comments.update(c => c.filter(comment => comment.id !== commentToDelete.id));
          this.post.update(p => {
            if (!p) return p;
            return { ...p, commentsCount: (p.commentsCount || 0) - 1 };
          });
          this.showSuccessMessage('Comment deleted successfully!'); 
          this.commentToDelete.set(undefined);
          this.close();
        },
        error: (error: HttpErrorResponse) => {
          this.errorHandler.handle(error, 'Failed to delete comment');
          this.commentToDelete.set(undefined); 
          this.close();
        }
      });
    } else if (postToDelete){
      this.auth.deletePost(postToDelete.id).subscribe({
        next: () => {
          this.showSuccessMessage('Post deleted successfully!');
          this.router.navigate([`/`]);
           this.close();
        },
        error: (error: HttpErrorResponse) => {
          this.errorHandler.handle(error, 'Failed to delete post');
          this.close();
        }
      });
    }
  }


  loadCurrentUser(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'User not logged in', false);
        this.currentUser.set(null);
      }
    });
  }
  // --- Helper Methods ---


  isMyPost(): boolean {
    const currentPost = this.post();
    const user = this.currentUser();
    return currentPost?.user.username === user?.username;
  }

  isMyComment(comment: Comment): boolean {
    const user = this.currentUser();
    return comment.user?.username === user?.username;
  }

  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]);
  }

  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }

  backToHome(): void {
    this.router.navigate([`/`]);
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

  // Helper methods for ngModel with signals
  getNewComment(): string {
    return this.newComment();
  }

  setNewComment(value: string): void {
    this.newComment.set(value);
  }

  getEditedContent(): string {
    return this.editedContent();
  }

  setEditedContent(value: string): void {
    this.editedContent.set(value);
  }
}