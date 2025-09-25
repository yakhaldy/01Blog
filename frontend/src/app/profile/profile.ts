import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { isImage, isVideo } from '../home/home.helpers'
import { MatDialog } from '@angular/material/dialog';
import { UpdatePostDialog } from '../update-post-dialog/update-post-dialog';
import { MatMenuModule } from '@angular/material/menu';
import { EditProfile } from '../components/edit-profile/edit-profile'
import { Navbar } from '../components/navbar/navbar';
import { User, Post, UpdatePostResult, UpdateProfileResult } from '../home/home.model'
import { Auth } from '../auth'


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, Navbar, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatMenuModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css', '..//home/home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  profileUser: User | null = null;
  currentUser: User | null = null;

  isOwnProfile: boolean = false;
  postsCount: number = 0;
  isLoading: boolean = true;
  isLoadingPost: boolean = true;
  posts: Post[] = [];


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramUsername = params.get('username');

      if (paramUsername) {
        this.loadUserProfile(paramUsername);
        this.loadUserPosts(paramUsername);
        this.isOwnProfile = false;
      } else {
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
    this.auth.getPostsUser(username).subscribe({
      next: (posts) => {
        this.posts = posts
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
    this.auth.getMyPosts().subscribe({
      next: (posts) => {
        this.posts = posts
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

    // dialogRef.afterClosed().subscribe((result: UpdateProfileResult) => {

    // });
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
  deletePost(post: Post): void {
    this.auth.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => post.id !== p.id);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to delete Post:', error);
        this.cdr.markForCheck();
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

        this.auth.updatePost(post.id!, updateData).subscribe({
          next: (updatedPost) => {
            const index = this.posts.findIndex(p => p.id === post.id);
            if (index !== -1) {
              this.posts[index] = updatedPost;
            }
            this.cdr.markForCheck();
          },
          error: (error) => {

            this.cdr.markForCheck();
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

  isImage = isImage;
  isVideo = isVideo;
}