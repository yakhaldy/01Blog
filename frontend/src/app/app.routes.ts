import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Home } from './home/home';
import {Profile} from './profile/profile';
import { Notifications} from './notifications/notifications'
import { Error404 } from './components/error-404/error-404'
import { SingalPost } from './singal-post/singal-post'
import { Dashboard } from './dashboard/dashboard'
export const routes: Routes = [
  { path: '', component: Home},
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {path: 'profile', component: Profile},
   { path: 'profile/:username', component: Profile}, 
  {path: 'notifications', component: Notifications},
   { path: 'post/:id', component: SingalPost}, 
  {path: 'dashboard', component: Dashboard},


  { path: '**', component: Error404 }
];
