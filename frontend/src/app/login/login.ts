import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';
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
  user = { email: '', password: '' };
  errorMessage: string | null = null;
  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) { }

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
        this.toastService.show('Login successful!', 'success');
        this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400 || error.status === 401 || error.status === 409) {
          this.errorMessage = getErrorMessage(error);
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
        }
        this.cdr.markForCheck();

      }
    });
  }
  goToRegister() {
    this.router.navigate(["register"]);
  }
}