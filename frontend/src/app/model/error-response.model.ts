
import { HttpErrorResponse } from '@angular/common/http';


export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}


export interface ValidationErrorResponse {
  status: number;
  errors: {
    [fieldName: string]: string;  // { "email": "Email must be valid" }
  };
  timestamp: string;
}


export interface SuccessResponse {
  message: string;
}


export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500
} as const;

export function isValidationError(error: any): error is ValidationErrorResponse {
  return error && 
         error.status === HTTP_STATUS.BAD_REQUEST && 
         error.errors && 
         typeof error.errors === 'object' &&
         !error.message;
}

export function isErrorResponse(error: any): error is ErrorResponse {
  return error && 
         error.status && 
         error.message && 
         typeof error.message === 'string';
}


export function getErrorMessage(error: HttpErrorResponse): string {
  if (!error) return 'An unexpected error occurred';

  
  if (error.error) {
    
    if (isValidationError(error.error)) {
      const errors = error.error.errors;
      const firstErrorKey = Object.keys(errors)[0];
      return errors[firstErrorKey] || 'Validation error';
    }

  
    if (isErrorResponse(error.error)) {
      return error.error.message;
    }

    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        if (parsed.message) return parsed.message;
      } catch {
        return error.error;
      }
    }

    if (error.error.message) {
      return error.error.message;
    }
  }

  if (error.message) {
    return error.message;
  }

  if (error.status === 0) {
    return 'Network error. Please check your connection.';
  }

  return 'An unexpected error occurred';
}

/**
 * Validation Errors Array
 */
export function getAllValidationErrors(error: HttpErrorResponse): string[] {
  if (error?.error && isValidationError(error.error)) {
    return Object.entries(error.error.errors).map(
      ([field, message]) => `${field}: ${message}`
    );
  }
  return [];
}

/**
 * validation error 
 */
export function getFirstValidationError(error: HttpErrorResponse): string | null {
  if (error?.error && isValidationError(error.error)) {
    const errors = error.error.errors;
    const firstKey = Object.keys(errors)[0];
    return errors[firstKey] || null;
  }
  return null;
}