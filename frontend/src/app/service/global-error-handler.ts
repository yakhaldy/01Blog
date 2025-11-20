import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../helper/handleError';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorHandlerService = inject(ErrorHandlerService);

  handleError(error: any): void {

    if (error instanceof HttpErrorResponse) {
      this.errorHandlerService.handle(error);
    } 
    else if (error?.error instanceof ErrorEvent) {
        console.error('Client-side error event captured:', error.error);
        
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
