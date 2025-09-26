import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { isImage, isVideo } from '../home/home.helpers';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';
import { Navbar } from '../components/navbar/navbar';
import { User, Post, Comment, UpdatePostResult } from '../home/home.model';
import { Auth } from '../auth';

@Component({
  selector: 'app-singal-post',
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './singal-post.html',
  styleUrls: ['./singal-post.css', '..//home/home.css'],
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog, // haydha 
    private snackBar: MatSnackBar
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
  loadCurrentUser(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.log('User not logged in');
        this.cdr.markForCheck();
      }
    });
  }
  loadComments(): void {
    this.isLoadingComments = true;

    // this.isLoadingComments = false;


    // this.auth.getPostComments(this.postId).subscribe({
    //   next: (comments) => {
    //     this.comments = comments;
    //     this.isLoadingComments = false;
    //     this.cdr.markForCheck();
    //   },
    //   error: (error) => {
    //     console.error('Error loading comments:', error);
    //     this.isLoadingComments = false;
    //     this.cdr.markForCheck();
    //   }
    // });
  }


  isMyPost(): boolean {
    return this.post?.user.username === this.currentUser?.username;
  }
  isMyComment(comment: Comment): boolean {
    return comment.user?.username === this.currentUser?.username;
  }

  editPost(): void {
    const dialogRef = this.dialog.open(UpdatePostDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        content: this.post?.description,
        imgUrl: this.post?.mediaUrl,
        postId: this.post?.id
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

        this.auth.updatePost(this.post?.id!, updateData).subscribe({
          next: (updatedPost) => {
            this.post = updatedPost;
            this.cdr.markForCheck();
          },
          error: (error) => {

            this.cdr.markForCheck();
          }
        });
      }
    });
  }
  deletePost(): void {
    if (this.post) {
      this.auth.deletePost(this.post.id).subscribe({
        next: () => {
          this.router.navigate([`/`]);
        },
        error: (error) => {
          console.error('Failed to delete Post:', error);
          this.cdr.markForCheck();
        }
      });
    }
  }
  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]);
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
  reportPost() {
    console.log("report Post");

  }
  likePoste(): void {
    if (this.post) {
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
            this.post.isLiked = originalIsLiked;
            this.post.likesCount = originalLikesCount;
            this.cdr.markForCheck();
          }
        }
      });
    }
  }
  submitComment(): void {
    if (!this.newComment.trim() || this.isSubmittingComment) {
      return;
    }

    this.isSubmittingComment = true;

    const commentData = {
      content: this.newComment.trim(),
      postId: this.postId
    };

    // this.auth.createComment(commentData).subscribe({
    //   next: (newComment) => {
    //     this.comments.unshift(newComment);
    //     this.newComment = '';
    //     this.isSubmittingComment = false;
    //     this.showSuccessMessage('Comment posted successfully!');
    //     this.cdr.markForCheck();
    //   },
    //   error: (error) => {
    //     console.error('Error posting comment:', error);
    //     this.isSubmittingComment = false;
    //     this.showErrorMessage('Failed to post comment. Please try again.');
    //     this.cdr.markForCheck();
    //   }
    // });
  }
  editComment(comment: Comment): void {
    // Implement edit comment functionality
    const newContent = prompt('Edit your comment:', comment.content);
    if (newContent && newContent.trim() !== comment.content) {
      // this.auth.updateComment(comment.id, { content: newContent.trim() }).subscribe({
      //   next: (updatedComment) => {
      //     const index = this.comments.findIndex(c => c.id === comment.id);
      //     if (index !== -1) {
      //       this.comments[index] = updatedComment;
      //     }
      //     this.showSuccessMessage('Comment updated successfully!');
      //     this.cdr.markForCheck();
      //   },
      //   error: (error) => {
      //     this.showErrorMessage('Failed to update comment. Please try again.');
      //   }
      // });
    }
  }
  deleteComment(comment: Comment): void {
    // if (confirm('Are you sure you want to delete this comment?')) {
    //   this.auth.deleteComment(comment.id).subscribe({
    //     next: () => {
    //       this.comments = this.comments.filter(c => c.id !== comment.id);
    //       this.showSuccessMessage('Comment deleted successfully!');
    //       this.cdr.markForCheck();
    //     },
    //     error: (error) => {
    //       console.error('Failed to delete comment:', error);
    //       this.showErrorMessage('Failed to delete comment. Please try again.');
    //     }
    //   });
    // }
  }

  isImage = isImage;
  isVideo = isVideo;
}



