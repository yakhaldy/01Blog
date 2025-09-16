// src/app/interceptors/auth.interceptor.ts
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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private router: Router) { }

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
                    console.log('🚫 Forbidden - check token validity');
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