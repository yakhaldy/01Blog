foolw maktb9ash tban mn ktsghar chach => profile 



import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    console.error('Global error captured:', error);
   
  }
}