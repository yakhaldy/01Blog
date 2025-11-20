import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../helper/handleError';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorHandlerService = inject(ErrorHandlerService);

  handleError(error: any): void {
    //console.error('Global error captured:', error);

    // Handle HTTP errors using existing ErrorHandlerService
    if (error instanceof HttpErrorResponse) {
      this.errorHandlerService.handle(error);
    } 
    // Handle client-side/JavaScript errors
    else if (error?.error instanceof ErrorEvent) {
      this.errorHandlerService.handle(
        error, 
        error.error.message || 'Client-side error occurred'
      );
    } 
    // Handle other errors
    else {
      const message = error?.message || error?.toString() || 'An unexpected error occurred';
      console.error('Unhandled error:', message);
      // Optionally show toast for non-HTTP errors
      // this.errorHandlerService.handle(error, message);
    }
  }
}
