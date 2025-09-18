// src/app/interceptors/auth.interceptor.ts (Updated)
import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpErrorResponse,
    HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Error500 } from '../components/error-500/error-500';
import { Error403 } from '../components/error-403/error-403';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private router: Router, private dialog: MatDialog) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // Skip token for login/register endpoints
        if (req.url.endsWith('/api/login') || req.url.endsWith('/api/register')) {
            return next.handle(req);
        }

        const token = localStorage.getItem('token');

        let authReq = req;
        if (token) {
            authReq = req.clone({
                setHeaders: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }

        return next.handle(authReq).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401) {
                    localStorage.removeItem('token');
                    this.router.navigate(['/login']);
                } else if (err.status === 403) {
                    if (this.dialog.openDialogs.length === 0) {
                        const dialogRef = this.dialog.open(Error403, {
                            width: '100vw',
                            height: '100vh',
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                            panelClass: 'full-screen-dialog',
                            disableClose: true
                        });
                    }
                } else if (err.status === 500) {
                    if (this.dialog.openDialogs.length === 0) {
                        const dialogRef = this.dialog.open(Error500, {
                            width: '100vw',
                            height: '100vh',
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                            panelClass: 'full-screen-dialog',
                            disableClose: true
                        });

                    }
                }
                return throwError(() => err);
            })
        );
    }
}

export const authInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
};