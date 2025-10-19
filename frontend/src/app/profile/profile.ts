import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { isImage, isVideo } from '../helper/postHleper'
import { MatDialog } from '@angular/material/dialog';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { EditProfile } from '../components/edit-profile/edit-profile'
import { Navbar } from '../components/navbar/navbar';
import { User, Post, UpdatePostResult, UpdateProfileResult } from '../model/model'
import { Auth } from '../service/auth'
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ToastService } from '../service/toast-service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, Navbar, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatMenuModule, FormsModule,
    MatFormFieldModule,
    MatInputModule, InfiniteScrollModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css', '../home/home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  profileUser: User | null = null;
  currentUser: User | null = null;

  isOwnProfile: boolean = false;
  postsCount: number = 0;
  isLoading: boolean = true;
  isLoadingPost: boolean = true;
  PostToDelete?: Post;
  posts: Post[] = [];

  showReportPopup = false;
  reportReason = '';
  errorReport = '';
  isErrorReport = false;

  hasMorePosts = true;
  currentPage = 0;
  pageSize = 10;
  scrollDistance = 2;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramUsername = params.get('username');

      if (paramUsername) {
        this.auth.getCurrentUser().subscribe({
          next: (currentUser) => {
            this.currentUser = currentUser;

            if (paramUsername === currentUser.username) {
              this.isOwnProfile = true;
              this.loadCurrentUserProfile();
              this.loadCurrentUserPosts();
            } else {
              // Viewing someone else's profile
              this.isOwnProfile = false;
              this.loadUserProfile(paramUsername);
              this.loadUserPosts(paramUsername);
            }

            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to fetch current user:', err);
          }
        });
      } else {
        // No username param – current user's profile
        this.isOwnProfile = true;
        this.loadCurrentUserProfile();
        this.loadCurrentUserPosts();
      }

    });

  }

  loadUserProfile(username: string) {
    this.isLoading = true;
    this.auth.getInfoUser(username).subscribe({
      next: (user) => {
        this.profileUser = user;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
    this.cdr.markForCheck();
  }
  loadUserPosts(username: string) {
    if (!this.hasMorePosts) return;

    this.auth.getPostsUser(username, this.currentPage, this.pageSize).subscribe({
      next: (postsPage) => {
        // this.posts = posts

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
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.log(error);
        this.isLoadingPost = false;
        this.cdr.markForCheck();
      },
    });
    this.cdr.markForCheck();
  }
  loadCurrentUserProfile() {
    this.isLoading = true;

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileUser = user;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
  loadCurrentUserPosts() {
    if (!this.hasMorePosts) return;

    this.auth.getMyPosts(this.currentPage, this.pageSize).subscribe({
      next: (postsPage) => {
        // this.posts = posts
        console.log("<=====>", postsPage);

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
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.log(error);
        this.isLoadingPost = false;
        this.cdr.markForCheck();
      },
    });
    this.cdr.markForCheck();
  }

  trackByPostId(index: number, post: any): number {
    return post.id;
  }


  onScroll(): void {
    console.log(".............................onScroll.......................");
    if (this.isOwnProfile) {
      this.loadCurrentUserPosts();
    } else {
      if (this.profileUser)
        this.loadUserPosts(this.profileUser.username)
    }
  }

  followUser() {
    this.auth.follow(this.profileUser?.id as string).subscribe({
      next: (res) => {
        if (this.profileUser) {
          this.profileUser.isfollowing = !this.profileUser.isfollowing;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {

      }
    });
  }

  editProfile() {
    const dialogRef = this.dialog.open(EditProfile, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        username: this.currentUser?.username,
        bio: this.currentUser?.bio,
        AvatarUrl: this.currentUser?.avatar,
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result: UpdateProfileResult) => {
      console.log("***", result);
      if (result?.error) {
        this.toastService.show("Failed to edit profile", "error");
        this.cdr.markForCheck();
        return;
      }
      if (this.profileUser) {
        this.profileUser.avatar = result.user.avatar;
        this.profileUser.bio = result.user.bio;
        this.profileUser.username = result.user.username
        this.cdr.markForCheck();
      }
      this.toastService.show("edit profile successfully", "success")

    });
  }

  commentPoste(id: number): void {
    console.log('Comment on post', id);
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

      this.auth.likePost(id).subscribe({
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
          this.cdr.markForCheck();
        }
      });
    }
  }

  showModal = false;
  isOpen = false;


  deletePost(post: Post): void {
    this.PostToDelete = post;
    this.open();
  }

  open() {
    this.showModal = true;
    this.isOpen = false;

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

    this.auth.deletePost(this.PostToDelete.id).subscribe({
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

        this.auth.updatePost(post.id!, updateData).subscribe({
          next: (updatedPost) => {
            console.log("updatePost :", updatedPost);

            const index = this.posts.findIndex(p => p.id === post.id);
            if (index !== -1) {
              this.posts[index] = updatedPost;
            }
            this.toastService.show("Post update successfully", "success")
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.toastService.show("Failed to update Post", "error")
          }
        });
      }
    });
  }

  isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser?.username;
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
  goToPost(id: number): void {
    this.router.navigate([`post/${id}`]);
  }

  openReportPopup() {
    this.showReportPopup = true;
  }

  cancelReport() {
    this.showReportPopup = false;
    this.reportReason = '';
  }

  submitReport() {
    console.log('Report submitted:', this.reportReason, this.profileUser?.id);
    this.auth.Report({
      reportedUserId: this.profileUser?.id,
      reportReason: this.reportReason
    }).subscribe({
      next: () => {
        console.log('Report successfully sent');
        this.isErrorReport = false;

        this.showReportPopup = false;
        this.reportReason = '';
        this.toastService.show("Report submitted successfully", "success")
        this.cdr.markForCheck();

      },
      error: (error) => {
        console.error('Report failed:', error);
        this.errorReport = error.error.error;
        this.isErrorReport = true;
        this.toastService.show("Failed to Report Profile", "error")
        this.cdr.markForCheck();
      }
    });
    //  this.showReportPopup = false;
    //   this.reportReason = '';
  }


  isImage = isImage;
  isVideo = isVideo;
}