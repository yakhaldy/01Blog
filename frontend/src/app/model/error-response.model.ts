// ============================================
// File: src/app/model/error-response.model.ts
// ============================================

import { HttpErrorResponse } from '@angular/common/http';

/**
 * Standard Error Response من Backend
 * يطابق ErrorResponse في GlobalExceptionHandler
 */
export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

/**
 * Validation Error Response من Backend
 * يأتي عند فشل @Valid validation
 */
export interface ValidationErrorResponse {
  status: number;
  errors: {
    [fieldName: string]: string;  // { "email": "Email must be valid" }
  };
  timestamp: string;
}

/**
 * Success Response من Backend
 */
export interface SuccessResponse {
  message: string;
}

/**
 * HTTP Status Code Constants
 */
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

/**
 * Type Guards
 */
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

/**
 * استخراج رسالة الخطأ من HttpErrorResponse
 */
export function getErrorMessage(error: HttpErrorResponse): string {
  if (!error) return 'An unexpected error occurred';

  // إذا كان error.error موجود
  if (error.error) {
    // Validation Error (400 مع errors object)
    if (isValidationError(error.error)) {
      const errors = error.error.errors;
      const firstErrorKey = Object.keys(errors)[0];
      return errors[firstErrorKey] || 'Validation error';
    }

    // Standard Error Response
    if (isErrorResponse(error.error)) {
      return error.error.message;
    }

    // إذا كان error.error نفسه رسالة string
    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        if (parsed.message) return parsed.message;
      } catch {
        return error.error;
      }
    }

    // إذا كان error.error.message موجود مباشرة
    if (error.error.message) {
      return error.error.message;
    }
  }

  // إذا كان error.message موجود
  if (error.message) {
    return error.message;
  }

  // Network error
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