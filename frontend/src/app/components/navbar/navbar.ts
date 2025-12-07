import { Component, OnInit, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Auth } from '../../service/auth';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Notifications } from '../../service/notifications';


import { User } from '../../model/model'

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  notificationCount = signal(0);
  currentUser = signal<User | null>(null);
  isDropdownOpen = signal(false);
  isAdmin = signal(false);
  currentRoute = signal('');
  isMobileMenuOpen = signal(false);

  constructor(private router: Router, private auth: Auth, private notifications: Notifications){}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);    
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.url);
    });

    this.auth.getCurrentUser().subscribe(user => {
      this.currentUser.set(user);
      this.isAdmin.set(user.role.includes("ADMIN"));
    });

    this.notifications.getNotificationCountStream().subscribe(count => {
      this.notificationCount.set(count);
    });
  }


  toggleDropdown(): void {
    this.isDropdownOpen.update(value => !value);
  }


  isRouteActive(route: string): boolean {
    const current = this.currentRoute();
    if (route === '/') {
      return current === '/';
    }
    return current.startsWith(route);
  }

  onHome(): void {
    this.router.navigate(['/']);
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  onNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  onDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}