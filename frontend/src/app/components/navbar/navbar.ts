import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Auth } from '../../auth';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { User } from '../../home/home.model'

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  notificationCount = 3;
  currentUser: User | null = null;
  isDropdownOpen = false;
  isAdmin = false;
  currentRoute: string = '';
  

  constructor(private router: Router, private auth: Auth) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd), // Only listen to NavigationEnd events
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

     this.auth.getCurrentUser().subscribe(user => {      
      this.currentUser = user;
      this.isAdmin = user.role.includes("ADMIN") ; // ✅ Set isAdmin flag
    });
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

  onDashboard(): void {
    console.log('Navigate to Dashboard');
    this.router.navigate(['/dashboard']);
  }

  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}