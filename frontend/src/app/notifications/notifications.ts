import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../components/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { Notification } from '../home/home.model'
import { Auth } from '../auth'
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [Navbar, MatCardModule, MatIconModule, CommonModule, RouterModule,MatProgressSpinnerModule],
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
  ) { }
  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.auth.getNotifications().subscribe({
      next: (notifications) => {
        
        this.notifications = notifications;
        this.loading = false;
        console.log("*******************************\n", notifications);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
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
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}
