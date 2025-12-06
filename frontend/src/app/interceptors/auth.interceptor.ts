
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
                this.handleError(error);
                return throwError(() => error);
            })
        );
    }

    private handleError(error: HttpErrorResponse): void {
        if (!this.isBrowser) return;

        switch (error.status) {
            case 401:
                this.handleUnauthorized();
                break;

            case 403:
                this.handleForbidden();
                break;

            case 500:
                console.log("intercepter ====error", error);
                this.handleServerError();
                break;
            case 0:
                this.handleServerError();
                break;
            default:
                // console.error('HTTP Error:', error);
        }
    }

    private handleUnauthorized(): void {
        console.log('Session expired - redirecting to login');
        this.removeToken();
        
        this.dialog.closeAll();
        
        this.router.navigate(['/login']);
    }

 
    private handleForbidden(): void {
        this.removeToken();
        //dialog
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

    private handleServerError(): void {
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