import { Injectable } from '@angular/core';
import { HttpErrorResponse } from "@angular/common/http";
import {
  getErrorMessage,
  HTTP_STATUS
} from '../model/error-response.model';
import { ToastService } from '../service/toast-service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private toastService: ToastService) {}

  handle(error: HttpErrorResponse, defaultMessage = 'An error occurred', showToast = true): void {
    // console.error('Error:', error.error);

    let errorMessage = defaultMessage;

    switch (error.status) {
      case HTTP_STATUS.BAD_REQUEST:
        errorMessage = getErrorMessage(error);
        break;

      case HTTP_STATUS.UNAUTHORIZED:
        errorMessage = 'Your session has expired. Please login again.';
        break;

      case HTTP_STATUS.FORBIDDEN:
        errorMessage = getErrorMessage(error) || 'You do not have permission to perform this action.';
        break;

      case HTTP_STATUS.NOT_FOUND:
        errorMessage = getErrorMessage(error) || 'The requested resource was not found.';
        break;

      case HTTP_STATUS.CONFLICT:
        errorMessage = getErrorMessage(error) || 'This resource already exists.';
        break;

      case HTTP_STATUS.PAYLOAD_TOO_LARGE:
        errorMessage = 'File size is too large. Maximum size is 10MB.';
        break;

      case HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE:
        errorMessage = 'File type is not supported.';
        break;

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        errorMessage = 'Server error. Please try again later.';
        break;

      case 0:
        errorMessage = 'Network error. Please check your connection.';
        break;

      default:
        errorMessage = getErrorMessage(error) || defaultMessage;
    }

    if (showToast) {
      this.toastService.show(errorMessage, 'error');
    }
  }
}
