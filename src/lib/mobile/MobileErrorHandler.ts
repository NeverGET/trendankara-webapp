/**
 * Mobile Error Handler
 * Standardized error handling for mobile API endpoints
 */

import { NextResponse } from 'next/server';
import { MobileApiResponse } from '@/types/mobile';

export class MobileErrorHandler {
  /**
   * Handle errors and return standardized mobile API response
   * @param error Error object or unknown error
   * @param defaultMessage Default error message to show to user
   * @returns NextResponse with error structure
   */
  static handle(error: unknown, defaultMessage: string = 'Bir hata oluştu'): NextResponse {
    console.error('Mobile API Error:', error);

    const errorMessage = error instanceof Error ? error.message : defaultMessage;

    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: errorMessage
    };

    return NextResponse.json(response, { status: 500 });
  }

  /**
   * Handle validation errors
   * @param message Validation error message
   * @returns NextResponse with 400 status
   */
  static validationError(message: string): NextResponse {
    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: message
    };

    return NextResponse.json(response, { status: 400 });
  }

  /**
   * Handle not found errors
   * @param message Not found error message
   * @returns NextResponse with 404 status
   */
  static notFound(message: string): NextResponse {
    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: message
    };

    return NextResponse.json(response, { status: 404 });
  }
}