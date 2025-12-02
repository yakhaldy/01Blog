import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';


export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  
  if (token) {
    router.navigate(['/']);
    return false;
  }
  
  return true;
};
