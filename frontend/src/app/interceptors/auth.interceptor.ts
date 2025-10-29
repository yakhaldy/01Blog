// auth.interceptor.ts - محسّن مع معالجة أفضل للأخطاء

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

    private isBrowser: boolean;

    constructor(
        private router: Router, 
        private dialog: MatDialog,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    public getToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem('token');
        }
        return null;
    }

    private removeToken(): void {
        if (this.isBrowser) {
            localStorage.removeItem('token');
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // Skip token for public endpoints
        const publicEndpoints = ['/api/login', '/api/register'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.endsWith(endpoint));
        
        if (isPublicEndpoint) {
            return next.handle(req);
        }

        // Add Authorization header
        const token = this.getToken();
        let authReq = req;
        
        if (token) {
            authReq = req.clone({
                setHeaders: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                // معالجة الأخطاء بشكل مركزي
                this.handleError(error);
                return throwError(() => error);
            })
        );
    }

    /**
     * معالجة مركزية للأخطاء
     */
    private handleError(error: HttpErrorResponse): void {
        if (!this.isBrowser) return;

        switch (error.status) {
            case 401:
                // Unauthorized - Session expired
                this.handleUnauthorized();
                break;

            case 403:
                // Forbidden - Access denied
                this.handleForbidden();
                break;

            case 500:
                // Internal Server Error
                this.handleServerError();
                break;

            default:
                // Other errors - يتم معالجتها في Components
                console.error('HTTP Error:', error);
        }
    }

    /**
     * معالجة 401 - Session Expired
     */
    private handleUnauthorized(): void {
        console.log('Session expired - redirecting to login');
        this.removeToken();
        
        // إغلاق أي dialogs مفتوحة
        this.dialog.closeAll();
        
        // Redirect to login
        this.router.navigate(['/login']);
    }

    /**
     * معالجة 403 - Access Denied
     */
    private handleForbidden(): void {
        // عرض dialog فقط إذا لم يكن هناك dialog مفتوح
        if (this.dialog.openDialogs.length === 0) {
            this.dialog.open(Error403, {
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                panelClass: 'full-screen-dialog',
                disableClose: true
            });
        }
    }

    /**
     * معالجة 500 - Server Error
     */
    private handleServerError(): void {
        // عرض dialog فقط إذا لم يكن هناك dialog مفتوح
        if (this.dialog.openDialogs.length === 0) {
            this.dialog.open(Error500, {
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                panelClass: 'full-screen-dialog',
                disableClose: true
            });
        }
    }
}

export const authInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
};