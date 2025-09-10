import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../auth';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  user = { email: '', password: '' };


  constructor(private auth: Auth, private router: Router) {}

  login() {
    this.auth.login(this.user).subscribe({
      next: (res) => {
        console.log('Login successful', res);
        this.router.navigate(['/']); 
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }
}
