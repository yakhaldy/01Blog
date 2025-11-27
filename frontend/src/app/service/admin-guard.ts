import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Auth } from './auth';
import { Error403 } from '../components/error-403/error-403';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const AdminGuard: CanActivateFn = (route, state) => {

  const auth = inject(Auth);
  const dialog = inject(MatDialog);
  const router = inject(Router);

  return auth.getCurrentUser().pipe(
    map(user => {

      if (user && user.role === 'ROLE_ADMIN') {
        return true;
      }
      if (dialog.openDialogs.length === 0) {
        dialog.open(Error403, {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          disableClose: true,
          panelClass: 'full-screen-dialog'
        });
      }

      return false;
    }),

    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
