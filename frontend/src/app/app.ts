import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Logo } from './shared/logo/logo';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, Login, Register, Logo],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  name = '';
  message = '';
  loggedIn = false;
  // showRegister = false; // <-- new flag

  constructor(private router: Router) { }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.loggedIn = !!localStorage.getItem('token');
      console.log("======>",this.loggedIn)
      if (!this.loggedIn) {
        this.router.navigate(['/login']);
      }

    }
  }

  // sendName() {
  //   this.message = `Hello, ${this.name}!`;
  // }

  // toggleRegister() {
  //   this.showRegister = !this.showRegister;
  // }
}

