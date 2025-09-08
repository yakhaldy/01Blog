import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../auth';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  user = { username: '', password: '', email : '' };


  constructor(private auth: Auth, private router: Router) {}

  register() {
    this.auth.register(this.user).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        console.error('Registration failed', err);
      }
    });
  }
}
