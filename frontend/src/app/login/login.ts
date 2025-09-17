import { Component } from '@angular/core';
import { Router } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../auth';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login {
  user = { email: '', password: '' };
  errorMessage: string | null = null;
  constructor(private auth: Auth, private router: Router, private cdr: ChangeDetectorRef) {}

  login() {
  
    this.auth.login(this.user).subscribe({
      next: (res) => {
        console.log('Login successful===========>', res);
        
        this.errorMessage = null;
        localStorage.setItem('token', res.token);
        this.router.navigate(['/']);
      },
      error: (err) => {
        if (err.status === 401) {          
          this.errorMessage = err.error.error;
           this.cdr.detectChanges();
        } else {
          console.log('Login failed', err);
          this.errorMessage = 'An unexpected error occurred';
          this.cdr.detectChanges();
        }
      }
    });
  }
  goToRegister() {
    this.router.navigate(["register"]);
  }
}