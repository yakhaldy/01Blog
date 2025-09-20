import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [Navbar],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramUsername = params.get('username');

      if (paramUsername) {
        this.loadUserProfile(paramUsername);
      } else {
        this.loadCurrentUserProfile();
      }
    });
  }

  loadUserProfile(username: string) {
    console.log("Load profile for user:", username);
  }

  loadCurrentUserProfile() {
    console.log("Load profile for current user");
  }

}
