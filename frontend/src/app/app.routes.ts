import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Home } from './home/home';
import {Profile} from './profile/profile';
import { Notifications} from './notifications/notifications'

export const routes: Routes = [
  { path: '', component: Home},
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {path: 'profile', component: Profile},
  {path: 'notifications', component: Notifications}

];
