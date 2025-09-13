import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Auth } from '../../auth';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  notificationCount = 3;
  userName = 'User';
  isDropdownOpen = false;
  
  currentRoute: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private auth: Auth) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd), // Only listen to NavigationEnd events
      takeUntil(this.destroy$) // Automatically unsubscribe when component is destroyed
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      console.log('Route changed to:', this.currentRoute);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }


  isRouteActive(route: string): boolean {
    if (route === '/') {
      return this.currentRoute === '/';
    }
    return this.currentRoute.startsWith(route);
  }

  onHome(): void {
    console.log('Navigate to home');
    this.router.navigate(['/']);
  }

  onProfile(): void {
    console.log('Navigate to profile');
    this.router.navigate(['/profile']);
  }

  onNotifications(): void {
    console.log('Navigate to notifications');
    this.router.navigate(['/notifications']);
  }

  onLogout(): void {
    console.log('Logout clicked');
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  onSettings(): void {
    console.log('Navigate to settings');
    this.router.navigate(['/settings']);
  }
}