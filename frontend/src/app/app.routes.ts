import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Home } from './home/home';
import {Profile} from './profile/profile';
import { Notifications} from './notifications/notifications'
import { Error404 } from './components/error-404/error-404'
import { SingalPost } from './singal-post/singal-post'
import { Dashboard } from './dashboard/dashboard'
import { authGuard } from './service/auth-guard';
import { AdminGuard } from './service/admin-guard';
import { guestGuard } from './service/guest-guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  {path: 'profile', component: Profile, canActivate: [authGuard]},
   { path: 'profile/:username', component: Profile, canActivate: [authGuard] }, 
  {path: 'notifications', component: Notifications, canActivate: [authGuard]},
   { path: 'post/:id', component: SingalPost, canActivate: [authGuard] }, 
  {path: 'dashboard', component: Dashboard, canActivate: [AdminGuard]},

  { path: '404', component: Error404 },
  
  // Wildcard must be last
  { path: '**', component: Error404 }
];
