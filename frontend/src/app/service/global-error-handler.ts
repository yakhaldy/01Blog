import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../helper/handleError';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorHandlerService = inject(ErrorHandlerService);
  private router = inject(Router);

  handleError(error: any): void {
    
    // Handle Angular Router errors for invalid URLs with special characters
    // Examples: domain.com/(x), domain.com/%url%, domain.com/test%20space
    if (error?.message && typeof error.message === 'string') {
      const routerErrors = [
        'Cannot match any routes',
        'Invalid URL',
        'Unexpected character',
        'NG04002',  // Angular Router error code for route not found
        'Cannot parse',
        'Malformed URI'
      ];
      
      if (routerErrors.some(errMsg => error.message.includes(errMsg))) {
      
          this.router.navigate(['/404'], { 
            skipLocationChange: false,
            replaceUrl: true 
          });

        
        return;
      }
    }

    if (error instanceof HttpErrorResponse) {
      this.errorHandlerService.handle(error);
    } 
    else if (error?.error instanceof ErrorEvent) {        
      this.errorHandlerService.handle(
        error, 
        error.error.message || 'Client-side error occurred'
      );
    } 
    else {
      const message = error?.message || error?.toString() || 'An unexpected error occurred';
      this.errorHandlerService.handle(error, message);

    }
  }
}
