import { Component, OnInit, signal } from '@angular/core';
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
import { HttpErrorResponse } from '@angular/common/http';

import { EditProfile } from '../components/edit-profile/edit-profile'
import { Navbar } from '../components/navbar/navbar';
import { User, Post, UpdatePostResult, UpdateProfileResult } from '../model/model'
import { Auth } from '../service/auth'
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ToastService } from '../service/toast-service';
import { ErrorHandlerService } from '../helper/handleError';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, Navbar, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatMenuModule, FormsModule,
    MatFormFieldModule,
    MatInputModule, InfiniteScrollModule],
  templateUrl: './profile.html',
  styleUrls: [ '../home/home.css','./profile.css'],
})
export class Profile implements OnInit {
  profileUser = signal<User | null>(null);
  currentUser = signal<User | null>(null);

  isOwnProfile = signal(false);
  postsCount = signal(0);
  isLoading = signal(true);
  isLoadingPost = signal(true);
  PostToDelete = signal<Post | undefined>(undefined);
  posts = signal<Post[]>([]);

  showReportPopup = signal(false);
  reportReason = signal('');
  errorReport = signal('');
  isErrorReport = signal(false);

  hasMorePosts = signal(true);
  currentPage = signal(0);
  pageSize = 10;
  scrollDistance = 2;

  showModal = signal(false);
  isOpen = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private dialog: MatDialog,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramUsername = params.get('username');

      if (paramUsername) {
        this.auth.getCurrentUser().subscribe({
          next: (currentUser) => {
            this.currentUser.set(currentUser);

            if (paramUsername === currentUser.username) {
              this.isOwnProfile.set(true);
              this.loadCurrentUserProfile();
              this.loadCurrentUserPosts();
            } else {
              // Viewing someone else's profile
              this.isOwnProfile.set(false);
              this.loadUserProfile(paramUsername);
              this.loadUserPosts(paramUsername);
            }
          },
          error: (err) => {
            console.error('Failed to fetch current user:', err);
          }
        });
      } else {
        // No username param – current user's profile
        this.isOwnProfile.set(true);
        this.loadCurrentUserProfile();
        this.loadCurrentUserPosts();
      }

    });

  }

  loadUserProfile(username: string) {
    this.isLoading.set(true);
    this.auth.getInfoUser(username).subscribe({
      next: (user) => {
        this.profileUser.set(user);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorHandler.handle(error, 'Failed to load user profile');
      },
    });
  }
  loadUserPosts(username: string) {
    if (!this.hasMorePosts()) return;

    this.auth.getPostsUser(username, this.currentPage(), this.pageSize).subscribe({
      next: (postsPage) => {
        if (postsPage && postsPage.content.length > 0) {
          this.posts.update(posts => [...posts, ...postsPage.content]);
          this.currentPage.update(page => page + 1);
          if (this.currentPage() >= postsPage.totalPages) {
            this.hasMorePosts.set(false);
          }
        } else {
          this.hasMorePosts.set(false);
        }
        this.isLoadingPost.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPost.set(false);
        this.errorHandler.handle(error, 'Failed to load user posts', false);
      },
    });
  }
  loadCurrentUserProfile() {
    this.isLoading.set(true);

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.profileUser.set(user);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorHandler.handle(error, 'Failed to load current user profile');
      },
    });
  }
  loadCurrentUserPosts() {
    if (!this.hasMorePosts()) return;

    this.auth.getMyPosts(this.currentPage(), this.pageSize).subscribe({
      next: (postsPage) => {
        if (postsPage && postsPage.content.length > 0) {
          this.posts.update(posts => [...posts, ...postsPage.content]);
          this.currentPage.update(page => page + 1);
          if (this.currentPage() >= postsPage.totalPages) {
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
      },
    });
  }

  trackByPostId(index: number, post: any): number {
    return post.id;
  }


  onScroll(): void {
    if (this.isOwnProfile()) {
      this.loadCurrentUserPosts();
    } else {
      const profile = this.profileUser();
      if (profile)
        this.loadUserPosts(profile.username)
    }
  }

  followUser() {
    const profile = this.profileUser();
    this.auth.follow(profile?.id as string).subscribe({
      next: (res) => {
        this.profileUser.update(user => {
          if (user) {
            return { ...user, isfollowing: !user.isfollowing };
          }
          return user;
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to follow user', false);
      }
    });
  }

  editProfile() {
    const currentUserData = this.currentUser();
    const dialogRef = this.dialog.open(EditProfile, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        username: currentUserData?.username,
        bio: currentUserData?.bio,
        AvatarUrl: currentUserData?.avatar,
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result: UpdateProfileResult) => {
     if (result == undefined) return;
      if (result?.error) {   
        this.toastService.show("Failed to edit profile", "error");
        return;
      }
      this.profileUser.update(user => {
        if (user) {
          return {
            ...user,
            avatar: result.user.avatar,
            bio: result.user.bio,
            username: result.user.username
          };
        }
        return user;
      });
      this.toastService.show("edit profile successfully", "success")

    });
  }

  commentPoste(id: number): void {
    console.log('Comment on post', id);
  }

  likePoste(id: number): void {
    const post = this.posts().find(p => p.id === id);
    if (post) {
      // Optimistic update
      const originalIsLiked = post.isLiked;
      const originalLikesCount = post.likesCount;

      this.posts.update(posts => 
        posts.map(p => 
          p.id === id 
            ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
            : p
        )
      );

      this.auth.likePost(id).subscribe({
        next: (updatedPost) => {
          this.posts.update(posts => 
            posts.map(p => 
              p.id === id ? { ...p, likesCount: updatedPost.likesCount } : p
            )
          );
        },
        error: (error: HttpErrorResponse) => {
          // Revert optimistic update on error
          this.posts.update(posts => 
            posts.map(p => 
              p.id === id 
                ? { ...p, isLiked: originalIsLiked, likesCount: originalLikesCount }
                : p
            )
          );
          this.errorHandler.handle(error, 'Failed to like post', false);
        }
      });
    }
  }

  deletePost(post: Post): void {
    this.PostToDelete.set(post);
    this.open();
  }

  open() {
    this.showModal.set(true);
    this.isOpen.set(false);

    setTimeout(() => {
      this.isOpen.set(true);
    }, 10);

  }

  close() {
    this.isOpen.set(false);
    this.showModal.set(false);
    this.PostToDelete.set(undefined);
  }


  confirm() {
    const postToDelete = this.PostToDelete();
    if (!postToDelete) return;
    this.isOpen.set(false);
    this.showModal.set(false);

    this.auth.deletePost(postToDelete.id).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => postToDelete.id !== p.id));
        this.toastService.show("Post deleted successfully", "success")
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Failed to delete post');
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

            this.posts.update(posts => 
              posts.map(p => p.id === post.id ? updatedPost : p)
            );
            this.toastService.show("Post update successfully", "success")
          },
          error: (error: HttpErrorResponse) => {
            this.errorHandler.handle(error, 'Failed to update post');
          }
        });
      }
    });
  }

  isMyPost(post: Post): boolean {
    return post.user?.username === this.currentUser()?.username;
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
  goToPost(post: Post): void {
    if (!post.id || post.statue === "hidden") return;
    this.router.navigate([`post/${post.id}`]);
  }

  openReportPopup() {
    this.showReportPopup.set(true);
  }

  cancelReport() {
    this.showReportPopup.set(false);
    this.reportReason.set('');
  }

  submitReport() {
    const profile = this.profileUser();
    const reason = this.reportReason();
    console.log('Report submitted:', reason, profile?.id);
    this.auth.Report({
      reportedUserId: profile?.id,
      reportReason: reason
    }).subscribe({
      next: () => {
        console.log('Report successfully sent');
        this.isErrorReport.set(false);
        this.showReportPopup.set(false);
        this.reportReason.set('');
        this.toastService.show("Report submitted successfully", "success")
      },
      error: (error: HttpErrorResponse) => {
        this.isErrorReport.set(true);
        this.errorHandler.handle(error, 'Failed to submit report');
      }
    });
  }


  isImage = isImage;
  isVideo = isVideo;
}