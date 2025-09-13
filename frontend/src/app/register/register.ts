import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../auth';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})

export class Register {
  user = { 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  };
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private auth: Auth, private router: Router, private cdr: ChangeDetectorRef) {}

  register() {
    this.errorMessage = null;
    this.successMessage = null;
    if (this.user.username == "" ){
       this.errorMessage = '"Username is Empty';
      this.cdr.detectChanges();
      return;
    }
    if (this.user.email == "" ){
       this.errorMessage = '"Email is Empty';
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
        if (err.status === 400 ) {          
          this.errorMessage = err.error.error || 'Registration failed';
          this.cdr.detectChanges();
        } else {
          this.errorMessage = 'An unexpected error occurred';
          console.log('Registration failed', err);
          this.cdr.detectChanges();
        }
      }
    });
  }

  goToPath(url: string) {
    this.router.navigate([url]);
  }
}