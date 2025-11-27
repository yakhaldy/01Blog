import { Component, OnInit, signal, computed } from '@angular/core';
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
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  // Data signals
  users = signal<User[]>([]);
  posts = signal<Post[]>([]);
  reports = signal<Report[]>([]);
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    bannedUsers: 0,
    activeReports: 0,
  });

  // Loading states
  isLoadingUsers = signal(true);
  isLoadingPosts = signal(false);
  isLoadingReports = signal(true);
  isLoadingStats = signal(true);

  // Filters
  searchTerm = signal('');
  selectedTab = signal(0);

  // Helper methods for ngModel
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateSelectedTab(value: number): void {
    this.selectedTab.set(value);
  }

  // Modal states
  showDeleteModal = signal(false);
  showBanModal = signal(false);
  isModalOpen = signal(false);
  selectedUser = signal<User | undefined>(undefined);
  selectedPost = signal<Post | undefined>(undefined);
  selectedReport = signal<Report | undefined>(undefined);
  actionType = signal<'delete' | 'ban' | 'remove'>('delete');
  showUserDetailsModal = signal(false);
  isUserDetailsModalOpen = signal(false);
  selectedReportedUser = signal<User | undefined>(undefined);
  userPosts = signal<Post[]>([]);
  userComments = signal<Comment[]>([]);

  hasMoreUsersResults = signal(true);
  currentUsersPage = signal(0);
  usersPageSize = 6;

  constructor(
    private auth: Auth,
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
    this.isLoadingUsers.set(true);
    this.auth.getAllUsers(this.currentUsersPage(), this.usersPageSize).subscribe({
      next: (response) => {
        // Append new results to existing ones
        console.log("User ==========>",response);
        
        this.users.update(users => [...users, ...response.content]);
        this.hasMoreUsersResults.set(this.currentUsersPage() + 1 < response.totalPages);
        this.isLoadingUsers.set(false);
        this.currentUsersPage.update(page => page + 1);
        // console.table(this.users());
        // console.log(this.isLoadingUsers());
      },
      error: (error: HttpErrorResponse) => {
        this.currentUsersPage.update(page => page - 1);
        this.isLoadingUsers.set(false);
        this.errorHandler.handle(error, 'Failed to load more results', false);
      }
    });
  }

  showMoreUsers(): void {
    if (!this.hasMoreUsersResults()) {
      return;
    }
    this.loadUsers();
  }



  hasMorePosts = signal(true);
  currentPage = signal(0);
  pageSize = 10;
  scrollDistance = 2;
  isLoadingMoreForFilter = signal(false);
  minFilteredResults = 10;

  loadPosts(): void {
    if (!this.hasMorePosts()) return;

    this.auth.getAllPosts(this.currentPage(), this.pageSize).subscribe({
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
        console.log("ana hna", postsPage.size);

        this.isLoadingPosts.set(false);
      },
      error: (error) => {
        console.error('Failed to load posts:', error);
        this.isLoadingPosts.set(false);
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
    this.isLoadingReports.set(true);

    this.auth.getAllReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.isLoadingReports.set(false);
      },
      error: (error) => {
        console.error('Failed to load reports:', error);
        this.isLoadingReports.set(false);
      },
    });
  }

  loadStats(): void {
    this.isLoadingStats.set(true);

    this.auth.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoadingStats.set(false);
      },
      error: (error) => {
        console.error('Failed to load stats:', error);
        this.isLoadingStats.set(false);
      },
    });
  }

  // User Actions
  openDeleteUserModal(user: User): void {
    this.selectedUser.set(user);
    this.actionType.set('delete');
    this.openModal();
  }

  openBanUserModal(user: User): void {
    this.selectedUser.set(user);
    this.actionType.set('ban');
    this.openModal();
  }

  confirmDeleteUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.auth.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.closeModal();
        const report = this.selectedReport();
        if (report) {
          this.deletReport(report.id);
        }
        this.toastService.show("delete user successfully", "success");
      },
      error: (error) => {
        this.toastService.show("Failed to delete user", "error");
      },
    });
  }

  confirmBanUser(): void {
    const selectedU = this.selectedUser();
    if (!selectedU) return;

    this.auth.banUser(selectedU.id).subscribe({
      next: (userBand) => {
        this.users.update(users => {
          const user = users.find(u => u.id === selectedU.id);
          if (user) {
            const report = this.selectedReport();
            if (report) {
              this.deletReport(report.id);
            }
            user.isBanned = userBand.isBanned;
            
            const reportedUser = this.selectedReportedUser();
            if (reportedUser) {
              reportedUser.isBanned = userBand.isBanned;
            }
          }
          return users;
        });
        this.closeModal();
        this.toastService.show("ban user successfully", "success");
      },
      error: (error) => {
        this.toastService.show("Failed to ban user", "error");
      },
    });
  }

  // Post Actions
  openDeletePostModal(post: Post): void {
    this.selectedPost.set(post);
    this.actionType.set('remove');
    this.openModal();
  }

  confirmDeletePost(): void {
    const post = this.selectedPost();
    if (!post) return;

    this.auth.deletePost(post.id).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p.id !== post.id));
        this.closeModal();
        this.toastService.show("delete post successfully", "success");
      },
      error: (error) => {
        this.toastService.show("Failed to delete post", "error");
      },
    });
  }


  // Report Actions
  openResolveReport(report: Report): void {
    this.selectedReportedUser.set(report.reportedUser);
    this.userPosts.set(this.posts().filter(p => p.user.username == report.reportedUser.username));
    this.userComments.set([]);
    this.selectedReport.set(report);
    this.openUserDetailsModal();
  }

  openUserDetailsModal(): void {
    this.showUserDetailsModal.set(true);
    this.isUserDetailsModalOpen.set(true);
  }

  dismissCurrentReport() {
    console.log("dismiss Current Report");
    const report = this.selectedReport();
    if (!report) return;
    this.deletReport(report.id);
  }
  deletReport(id: string) {
    this.auth.deleteReports(id).subscribe({
      next: () => {
        const report = this.selectedReport();
        if (report) {
          this.reports.update(reports => reports.filter(r => r.id !== report.id));
        }
        this.closeUserDetailsModal();
      },
      error: (error) => {
        console.error('Failed to resolve report:', error);
      }
    })
  }

  viewReportedUser(userId: string): void {
    const user = this.users().find(u => u.id === userId);
    if (user) {
      this.router.navigate(['/profile', user.username]);
    }
  }

  // Modal Controls
  openModal(): void {
    if (this.showUserDetailsModal()) {
      this.showDeleteModal.set(true);
      this.isModalOpen.set(true);
    } else {
      this.showDeleteModal.set(true);
      setTimeout(() => {
        this.isModalOpen.set(true);
      }, 10);
    }
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.showDeleteModal.set(false);
    this.selectedUser.set(undefined);
    this.selectedPost.set(undefined);
    this.selectedReport.set(undefined);
    this.showUserDetailsModal.set(false);
  }

  confirmAction(): void {
    if (this.actionType() === 'delete' && this.selectedUser()) {
      this.confirmDeleteUser();
    } else if (this.actionType() === 'ban' && this.selectedUser()) {
      this.confirmBanUser();
    } else if (this.actionType() === 'remove' && this.selectedPost()) {
      this.confirmDeletePost();
    }
  }

  closeUserDetailsModal(): void {
    this.isUserDetailsModalOpen.set(false);
    this.showUserDetailsModal.set(false);
    this.selectedReport.set(undefined);
  }

  // Utility
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path);
  }

  getFilteredUsers(): User[] {
    if (!this.searchTerm()) return this.users();
    const term = this.searchTerm().toLowerCase();
    return this.users().filter(
      u => u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }

  getFilteredReports(): Report[] {
    if (!this.searchTerm()) return this.reports();
    const term = this.searchTerm().toLowerCase();
    return this.reports().filter(
      r => r.reportedUser?.username.toLowerCase().includes(term)
    );
  }

  getFilteredPosts(): Post[] {
    if (!this.searchTerm()) return this.posts();

    const term = this.searchTerm().toLowerCase();
    const filteredPosts = this.posts().filter(
      p => p.user.username.toLowerCase().includes(term)
    );

    if (filteredPosts.length < this.minFilteredResults &&
      this.hasMorePosts() &&
      !this.isLoadingPosts() &&
      !this.isLoadingMoreForFilter()) {
      this.isLoadingMoreForFilter.set(true);
      this.loadMorePostsForFilter();
    }

    return filteredPosts;
  }

  private loadMorePostsForFilter(): void {
    this.auth.getAllPosts(this.currentPage(), this.pageSize).subscribe({
      next: (postsPage) => {
        if (postsPage && postsPage.content.length > 0) {
          this.posts.update(posts => [...posts, ...postsPage.content]);
          this.currentPage.update(page => page + 1);

          if (this.currentPage() >= postsPage.totalPages) {
            this.hasMorePosts.set(false);
          }

          this.isLoadingMoreForFilter.set(false);

          // Check again if we need more posts
          const filteredCount = this.getFilteredPostsCount();
          if (filteredCount < this.minFilteredResults && this.hasMorePosts()) {
            this.loadMorePostsForFilter();
          }
        } else {
          this.hasMorePosts.set(false);
          this.isLoadingMoreForFilter.set(false);
        }
      },
      error: (error) => {
        console.error('Failed to load posts for filter:', error);
        this.isLoadingMoreForFilter.set(false);
      },
    });
  }

  // Helper method to count filtered posts without triggering another load
  private getFilteredPostsCount(): number {
    if (!this.searchTerm()) return this.posts().length;

    const term = this.searchTerm().toLowerCase();
    return this.posts().filter(
      p => p.user.username.toLowerCase().includes(term)
    ).length;
  }
}