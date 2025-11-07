import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { Navbar } from '../components/navbar/navbar';
import { Auth } from '../service/auth';
import { User, Post, Report, DashboardStats } from '../model/model';
import { ToastService } from '../service/toast-service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../helper/handleError';


interface Comment {
  id: string;
  content: string;
  createdAt: string;
  post?: {
    title: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    InfiniteScrollModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  // Data
  users: User[] = [];
  posts: Post[] = [];
  reports: Report[] = [];
  stats: DashboardStats = {
    totalUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    bannedUsers: 0,
    activeReports: 0,
  };

  // Loading states
  isLoadingUsers = true;
  isLoadingPosts = false;
  isLoadingReports = true;
  isLoadingStats = true;

  // Filters
  searchTerm = '';
  selectedTab = 0;

  // Modal states
  showDeleteModal = false;
  showBanModal = false;
  isModalOpen = false;
  selectedUser?: User;
  selectedPost?: Post;
  selectedReport?: Report;
  actionType: 'delete' | 'ban' | 'remove' = 'delete';
  showUserDetailsModal = false;
  isUserDetailsModalOpen = false;
  selectedReportedUser?: User;
  userPosts: Post[] = [];
  userComments: Comment[] = [];

  hasMoreUsersResults = true;
  currentUsersPage = 0;
  usersPageSize = 6;

  constructor(
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadUsers();
    this.loadPosts();
    this.loadReports();
    this.loadStats();
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.isLoadingUsers = true;
    this.currentUsersPage++;
    this.auth.getAllUsers(this.currentUsersPage, this.usersPageSize).subscribe({
      next: (response) => {
        // Append new results to existing ones
        this.users.push(...response.content);
        this.hasMoreUsersResults = this.currentUsersPage + 1 < response.totalPages;
        this.isLoadingUsers = false;
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

  showMoreUsers(): void {
    if (!this.hasMoreUsersResults) {
      return;
    }
    this.loadUsers();
  }



  hasMorePosts = true;
  currentPage = 0;
  pageSize = 10;
  scrollDistance = 2;

  loadPosts(): void {
    if (!this.hasMorePosts) return;


    this.auth.getAllPosts(this.currentPage, this.pageSize).subscribe({
      next: (postsPage) => {
        // this.posts = posts;
        if (postsPage && postsPage.content.length > 0) {
          this.posts.push(...postsPage.content);
          this.currentPage++;
          if (this.currentPage >= postsPage.totalPages) {
            this.hasMorePosts = false;
          }
        } else {
          this.hasMorePosts = false;
        }
        console.log("ana hna", postsPage.size);

        this.isLoadingPosts = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load posts:', error);
        this.isLoadingPosts = false;
        this.cdr.markForCheck();
      },
    });
  }
  onScroll(): void {
    this.loadPosts();
  }
  trackByPostId(index: number, post: any): number {
    return post.id;
  }

  loadReports(): void {
    this.isLoadingReports = true;

    this.auth.getAllReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.isLoadingReports = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load reports:', error);
        this.isLoadingReports = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;

    this.auth.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load stats:', error);
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
    });
  }

  // User Actions
  openDeleteUserModal(user: User): void {
    this.selectedUser = user;
    this.actionType = 'delete';
    this.openModal();
  }

  openBanUserModal(user: User): void {
    this.selectedUser = user;
    this.actionType = 'ban';
    this.openModal();
  }

  confirmDeleteUser(): void {
    if (!this.selectedUser) return;

    this.auth.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
        this.closeModal();
        if (this.selectedReport) {
          this.deletReport(this.selectedReport?.id);
        }
        this.toastService.show("delete user successfully", "success")
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.show("Failed to delete user", "error");
        this.cdr.markForCheck();
      },
    });
  }

  confirmBanUser(): void {
    if (!this.selectedUser) return;

    this.auth.banUser(this.selectedUser.id).subscribe({
      next: (userBand) => {
        const user = this.users.find(u => u.id === this.selectedUser!.id);
        if (user) {
          if (this.selectedReport) {
            this.deletReport(this.selectedReport?.id);
          }

          user.isBanned = userBand.isBanned;
          if (this.selectedReportedUser) {
            this.selectedReportedUser.isBanned = userBand.isBanned;
          }
        }
        this.closeModal();
        this.toastService.show("ban user successfully", "success")

        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.show("Failed to ban user", "error");
        this.cdr.markForCheck();
      },
    });
  }

  // Post Actions
  openDeletePostModal(post: Post): void {
    this.selectedPost = post;
    this.actionType = 'remove';
    this.openModal();
  }

  confirmDeletePost(): void {
    if (!this.selectedPost) return;

    this.auth.deletePost(this.selectedPost.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== this.selectedPost!.id);
        this.closeModal();
        this.toastService.show("delete post successfully", "success")
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.show("Failed to delete post", "error");
        this.cdr.markForCheck();
      },
    });
  }


  // Report Actions
  openResolveReport(report: Report): void {
    this.selectedReportedUser = report.reportedUser;
    this.userPosts = this.posts.filter(p => p.user.username == report.reportedUser.username);
    this.userComments = [];
    this.selectedReport = report;
    this.openUserDetailsModal();
  }

  openUserDetailsModal(): void {
    this.showUserDetailsModal = true;
    this.isUserDetailsModalOpen = true;
  }

  dismissCurrentReport() {
    console.log("dismiss Current Report");
    if (!this.selectedReport) return;
    this.deletReport(this.selectedReport?.id);

  }
  deletReport(id: string) {
    this.auth.deleteReports(id).subscribe({
      next: () => {
        if (this.selectedReport) {
          this.reports = this.reports.filter(r => r.id !== this.selectedReport?.id)
        }
        this.closeUserDetailsModal()
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to resolve report:', error);
      }
    })
  }

  viewReportedUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.router.navigate(['/profile', user.username]);
    }
  }

  // Modal Controls
  openModal(): void {
    if (this.showUserDetailsModal) {
      this.showDeleteModal = true;
      this.isModalOpen = true;
    } else {
      this.showDeleteModal = true;
      setTimeout(() => {
        this.isModalOpen = true;
      }, 10);
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.showDeleteModal = false;
    this.selectedUser = undefined;
    this.selectedPost = undefined;
    this.selectedReport = undefined;
    this.showUserDetailsModal = false;
  }

  confirmAction(): void {
    if (this.actionType === 'delete' && this.selectedUser) {
      this.confirmDeleteUser();
    } else if (this.actionType === 'ban' && this.selectedUser) {
      this.confirmBanUser();
    } else if (this.actionType === 'remove' && this.selectedPost) {
      this.confirmDeletePost();
    }
  }

  closeUserDetailsModal(): void {
    this.isUserDetailsModalOpen = false;
    this.showUserDetailsModal = false;
    this.selectedReport = undefined;
  }

  // Utility
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path);
  }

  getFilteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(
      u => u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }


  getFilteredReports(): Report[] {
    if (!this.searchTerm) return this.reports;
    const term = this.searchTerm.toLowerCase();
    return this.reports.filter(
      r => r.reportedUser?.username.toLowerCase().includes(term)
    );
  }

  private isLoadingMoreForFilter = false;
  private minFilteredResults = 10;

  getFilteredPosts(): Post[] {
    if (!this.searchTerm) return this.posts;

    const term = this.searchTerm.toLowerCase();
    const filteredPosts = this.posts.filter(
      p =>
        p.user.username.toLowerCase().includes(term)
    );

    if (filteredPosts.length < this.minFilteredResults &&
      this.hasMorePosts &&
      !this.isLoadingPosts &&
      !this.isLoadingMoreForFilter) {
      this.isLoadingMoreForFilter = true;
      this.loadMorePostsForFilter();
    }

    return filteredPosts;
  }

  private loadMorePostsForFilter(): void {
    this.auth.getAllPosts(this.currentPage, this.pageSize).subscribe({
      next: (postsPage) => {
        if (postsPage && postsPage.content.length > 0) {
          this.posts.push(...postsPage.content);
          this.currentPage++;

          if (this.currentPage >= postsPage.totalPages) {
            this.hasMorePosts = false;
          }

          this.isLoadingMoreForFilter = false;
          this.cdr.markForCheck();

          // Check again if we need more posts
          const filteredCount = this.getFilteredPostsCount();
          if (filteredCount < this.minFilteredResults && this.hasMorePosts) {
            this.loadMorePostsForFilter();
          }
        } else {
          this.hasMorePosts = false;
          this.isLoadingMoreForFilter = false;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Failed to load posts for filter:', error);
        this.isLoadingMoreForFilter = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Helper method to count filtered posts without triggering another load
  private getFilteredPostsCount(): number {
    if (!this.searchTerm) return this.posts.length;

    const term = this.searchTerm.toLowerCase();
    return this.posts.filter(
      p =>
        p.user.username.toLowerCase().includes(term)
    ).length;
  }
}