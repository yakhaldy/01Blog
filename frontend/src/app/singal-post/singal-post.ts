import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Added MatSnackBarModule
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Added MatDialogModule
import { MatTooltipModule } from '@angular/material/tooltip'; // Added for tooltips used in HTML
import { isImage, isVideo } from '../home/home.helpers';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog'; // *Imported missing component*
import { Navbar } from '../components/navbar/navbar';
import { User, Post, Comment, UpdatePostResult } from '../home/home.model';
import { Auth } from '../auth';

@Component({
  selector: 'app-singal-post',
  standalone: true, // Assuming this is a standalone component based on imports array
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule, // Added
    MatDialogModule, // Added
    MatTooltipModule // Added
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

  // @ViewChild and ElementRef were imported but not used, so they were removed from the imports.
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog, // Kept for updatePostDialog
    private snackBar: MatSnackBar // Kept for messaging
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
      error: (error) => {
        console.error('Error loading post:', error);
        this.error = 'Post not found or you do not have permission to view it.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  editPost(): void {
    // Only open dialog if post exists
    if (!this.post) return;

    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        content: this.post.description,
        title: this.post.title, // Assuming UpdatePostDialog also handles title
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
          error: (error) => {
            this.showErrorMessage('Failed to update post.');
            console.error('Failed to update post:', error);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  deletePost(): void {
    if (this.post && confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.auth.deletePost(this.post.id).subscribe({
        next: () => {
          this.showSuccessMessage('Post deleted successfully!');
          this.router.navigate([`/`]);
        },
        error: (error) => {
          console.error('Failed to delete Post:', error);
          this.showErrorMessage('Failed to delete post.');
          this.cdr.markForCheck();
        }
      });
    }
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
      error: (error) => {
        if (this.post) {
          // Revert on error
          this.post.isLiked = originalIsLiked;
          this.post.likesCount = originalLikesCount;
          this.showErrorMessage('Failed to like/unlike post.');
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
      error: (error) => {
        console.error('Error loading comments:', error);
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
        this.showSuccessMessage('Comment posted successfully!'); // *Uncommented and implemented*
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error posting comment:', error);
        this.isSubmittingComment = false;
        this.showErrorMessage('Failed to post comment. Please try again.'); // *Uncommented and implemented*
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

    this.auth.updateComment(comment.id, { content: this.editedContent }).subscribe({
      next: (updatedComment) => {
        comment.content = this.editedContent;
        this.cancelEdit();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to update comment:', error);
        this.showErrorMessage('Failed to update comment. Please try again.');
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

}


confirm() {
  if (!this.commentToDelete) return;

  // this.auth.deleteComment(this.commentToDelete.id).subscribe({
  //   next: () => {
  //     this.comments = this.comments.filter(c => c.id !== this.commentToDelete!.id);
  //     if (this.post) {
  //       this.post.commentsCount = (this.post.commentsCount || 0) - 1;
  //     }
  //     this.cdr.markForCheck();
  //     this.commentToDelete = undefined; // Reset
  //     this.close();
  //   },
  //   error: (error) => {
  //     console.error('Failed to delete comment:', error);
  //     this.showErrorMessage('Failed to delete comment. Please try again.');
  //     this.commentToDelete = undefined; // Reset even on error
  //     this.close();
  //   }
  // });
      this.close();

}


  // --- Helper Methods ---

  loadCurrentUser(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      },
      error: () => {
        // console.log('User not logged in'); // Log is fine, no action needed for non-logged user
        this.currentUser = null;
        this.cdr.markForCheck();
      }
    });
  }

  isMyPost(): boolean {
    return this.post?.user.username === this.currentUser?.username;
  }

  isMyComment(comment: Comment): boolean {
    console.log("isMyComment");

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
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  // Exported functions
  isImage = isImage;
  isVideo = isVideo;
}