import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../components/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Notification } from '../model/model'
import { Auth } from '../service/auth'
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../helper/handleError';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../service/toast-service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [Navbar, MatCardModule, MatIconModule, CommonModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
  loading = false;
  notifications: Notification[] = [];


  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ErrorHandlerService: ErrorHandlerService,
    private toastService: ToastService
  ) { }
  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.auth.getNotifications().subscribe({
      next: (notifications) => {
        console.log("==================>", notifications);

        this.notifications = notifications;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.ErrorHandlerService.handle(error, 'Failed to load notifications');
        this.cdr.markForCheck();
      }
    });
  }
  formatNotificationType(type: string): string {
    switch (type) {
      case 'LIKE': return 'Like';
      case 'COMMENT': return 'Comment';
      case 'FOLLOW': return 'Follow';
      case 'POST': return 'New Post';
      default: return type;
    }
  }
  onClik(link: string, id: number): void {

    this.auth.markNotificationAsRead([id]).subscribe({
      next: () => {
        this.toastService.show('Notification marked as read', 'success');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.ErrorHandlerService.handle(error, 'Failed to mark notification as read');
        this.cdr.markForCheck();
      }
    });
    this.router.navigate([link]);
  }
  markAllAsRead(): void {
    const unreadNotificationIds = this.notifications
      .filter(notification => !notification.read)
      .map(notification => notification.id);

    if (unreadNotificationIds.length === 0) {
      this.toastService.show('All notifications are already read', 'info');
      return;
    }

    this.auth.markNotificationAsRead(unreadNotificationIds).subscribe({
      next: () => {
        this.notifications.forEach(notification => {
          notification.read = true;
        });
        this.toastService.show('All notifications marked as read', 'success');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.ErrorHandlerService.handle(error, 'Failed to mark all notifications as read');
        this.cdr.markForCheck();
      }
    });
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}
