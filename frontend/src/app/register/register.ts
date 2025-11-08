import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';

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

  constructor(private auth: Auth, private router: Router, private cdr: ChangeDetectorRef) { }

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
    // Basic validation
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

    if (!/^[A-Za-z]+$/.test(this.user.username)) {
      this.errorMessage = 'Username must contain only letters A–Z';
      this.cdr.detectChanges();
      return;
    }


    // Call auth service
    this.auth.register(this.user).subscribe({
      next: (res) => {
        console.log('Registration successful===========>', res);
        this.successMessage = 'Registration successful! Redirecting to login...';
        this.errorMessage = null;
        this.cdr.detectChanges();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        console.log('Error response:', err);

        if (err.status === 400 || err.status === 401 || err.status === 409) {
          let msg = 'Registration failed';

          if (err.error?.errors) {
            const firstError = Object.values(err.error.errors)[0];
            msg = firstError as string;
          } else if (err.error?.message) {
            msg = err.error.message;
          } else if (err.error?.error) {
            msg = err.error.error;
          }

          this.errorMessage = msg;
        } else {
          console.error('Unexpected error:', err);
          this.errorMessage = 'An unexpected error occurred';
        }

        this.cdr.detectChanges();
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