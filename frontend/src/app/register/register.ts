import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';
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
  user = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
    this.errorMessage = null;
    this.successMessage = null;
    if (this.user.username == "") {
      this.errorMessage = '"Username is Empty';
      this.cdr.detectChanges();
      return;
    }
    if (this.user.email == "") {
      this.errorMessage = 'Email is Empty';
      this.cdr.detectChanges();
      return;
    }
    if (!this.isValidEmail(this.user.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.cdr.detectChanges();
      return;
    }
  
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.cdr.detectChanges();
      return;
    }

    if (this.user.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      this.cdr.detectChanges();
      return;
    }

    if (!/^[A-Za-z_]+$/.test(this.user.username)) {
      this.errorMessage = 'Username must contain only letters (A–Z) and underscore (_).';
      this.cdr.detectChanges();
      return;
    }


    this.auth.register(this.user).subscribe({
      next: (res) => {
        this.successMessage = 'Registration successful! Redirecting to login...';
        this.errorMessage = null;
        this.toastService.show('Registration successful!', 'success');
        this.cdr.detectChanges();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandler.handle(error, 'Registration failed');
        this.errorMessage = getErrorMessage(error);
        this.cdr.markForCheck();
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
}