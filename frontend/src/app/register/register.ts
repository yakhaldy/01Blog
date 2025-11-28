import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../helper/handleError';
import { ToastService } from '../service/toast-service';
import { getErrorMessage } from '../model/error-response.model';
@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})

export class Register implements OnInit {
  user = signal({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private auth: Auth,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(["/"]);
    }
  }
  register() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const currentUser = this.user();
    
    if (currentUser.username == "") {
      this.errorMessage.set('Username is Empty');
      return;
    }
    if (currentUser.email == "") {
      this.errorMessage.set('Email is Empty');
      return;
    }
    if (!this.isValidEmail(currentUser.email)) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }
  
    if (currentUser.password !== currentUser.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (currentUser.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long');
      return;
    }

    if (!/^[A-Za-z_]+$/.test(currentUser.username)) {
      this.errorMessage.set('Username must contain only letters (A–Z) and underscore (_).');
      return;
    }


    this.auth.register(currentUser).subscribe({
      next: (res) => {
        this.successMessage.set('Registration successful! Redirecting to login...');
        this.errorMessage.set(null);
        this.toastService.show('Registration successful!', 'success');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Registration failed');
        this.errorMessage.set(getErrorMessage(error));
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToPath(url: string) {
    this.router.navigate([url]);
  }

  // Helper methods pour ngModel avec signals
  getUsername(): string {
    return this.user().username;
  }

  setUsername(value: string): void {
    this.user.update(u => ({ ...u, username: value }));
  }

  getEmail(): string {
    return this.user().email;
  }

  setEmail(value: string): void {
    this.user.update(u => ({ ...u, email: value }));
  }

  getPassword(): string {
    return this.user().password;
  }

  setPassword(value: string): void {
    this.user.update(u => ({ ...u, password: value }));
  }

  getConfirmPassword(): string {
    return this.user().confirmPassword;
  }

  setConfirmPassword(value: string): void {
    this.user.update(u => ({ ...u, confirmPassword: value }));
  }
}