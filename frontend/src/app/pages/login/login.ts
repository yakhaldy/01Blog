import { Component } from '@angular/core';
import { Api } from '../../services/api';
import { FormsModule } from '@angular/forms';
import { Logo } from '../../shared/logo/logo';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,Logo,RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login {
  email = '';
  password = '';

  // @Output() switchToRegister = new EventEmitter<void>();

  constructor(private api: Api) { }

  onLogin() {
    this.api.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        alert('Login successful!');
      },
      error: (err) => {
        alert('Login failed!');
        console.error(err);
      }
    });
  }
}



