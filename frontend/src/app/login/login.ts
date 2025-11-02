import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';
import { Token } from '@angular/compiler';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login implements OnInit {
  user = { email: '', password: '' };
  errorMessage: string | null = null;
  constructor(private auth: Auth, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(["/"]);
    }
  }

  login() {
    if (this.user.email === '') {
      this.errorMessage = "Email is required";
      this.cdr.detectChanges();
      return
    }
    if (this.user.password === '') {
      this.errorMessage = "Password is required";
      this.cdr.detectChanges();
      return
    }
    this.auth.login(this.user).subscribe({
      next: (res) => {
        this.errorMessage = null;
        localStorage.setItem('token', res.token);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log(err.error);

        if (err.status === 400 || err.status === 401 || err.status === 403) {
          if (err.error?.errors) {
            const firstError = Object.values(err.error.errors)[0];
            this.errorMessage = firstError as string;
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Invalid credentials';
          }
        } else {
          console.log('Login failed', err);
          this.errorMessage = 'An unexpected error occurred';
        }

        this.cdr.detectChanges();
      }

    });
  }
  goToRegister() {
    this.router.navigate(["register"]);
  }
}