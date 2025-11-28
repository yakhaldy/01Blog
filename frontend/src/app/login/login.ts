import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../service/toast-service';
import { getErrorMessage } from '../model/error-response.model';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login implements OnInit {
  user = signal({ email: '', password: '' });
  errorMessage = signal<string | null>(null);
  
  constructor(
    private auth: Auth,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(["/"]);
    }
  }

  login() {
    const currentUser = this.user();
    if (currentUser.email === '') {
      this.errorMessage.set("Email is required");
      return
    }
    if (currentUser.password === '') {
      this.errorMessage.set("Password is required");
      return
    }
    this.auth.login(currentUser).subscribe({
      next: (res) => {
        this.errorMessage.set(null);
        localStorage.setItem('token', res.token);
        this.toastService.show('Login successful!', 'success');
        this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400 || error.status === 401 || error.status === 409) {
          this.errorMessage.set(getErrorMessage(error));
        } else {
          this.errorMessage.set('An unexpected error occurred. Please try again later.');
        }
      }
    });
  }
  goToRegister() {
    this.router.navigate(["register"]);
  }

  // Helper methods pour ngModel avec signals
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
}