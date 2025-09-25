/**
 * Comprehensive Radio Error Handler for Stream URL Configuration System
 *
 * Provides centralized error handling with specific error types for timeout,
 * network, and validation failures. Includes user-friendly error message mapping
 * and error logging with admin user context.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { DatabaseError } from '@/types/database';
import { logError, logWarning, createPrefixedLogger } from '@/lib/utils/logger';

/**
 * Specific error types for radio configuration operations
 */
export enum RadioErrorType {
  // Network related errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_UNREACHABLE = 'NETWORK_UNREACHABLE',

  // Stream validation errors
  VALIDATION_INVALID_URL = 'VALIDATION_INVALID_URL',
  VALIDATION_INVALID_PROTOCOL = 'VALIDATION_INVALID_PROTOCOL',
  VALIDATION_INVALID_HOSTNAME = 'VALIDATION_INVALID_HOSTNAME',
  VALIDATION_URL_TOO_LONG = 'VALIDATION_URL_TOO_LONG',
  VALIDATION_UNSUPPORTED_FORMAT = 'VALIDATION_UNSUPPORTED_FORMAT',

  // Stream connectivity errors
  STREAM_CONNECTION_TIMEOUT = 'STREAM_CONNECTION_TIMEOUT',
  STREAM_CONNECTION_REFUSED = 'STREAM_CONNECTION_REFUSED',
  STREAM_INVALID_RESPONSE = 'STREAM_INVALID_RESPONSE',
  STREAM_UNSUPPORTED_CONTENT_TYPE = 'STREAM_UNSUPPORTED_CONTENT_TYPE',
  STREAM_SERVER_ERROR = 'STREAM_SERVER_ERROR',

  // Database operation errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',

  // Admin form errors
  FORM_VALIDATION_ERROR = 'FORM_VALIDATION_ERROR',
  FORM_REQUIRED_FIELD_MISSING = 'FORM_REQUIRED_FIELD_MISSING',
  FORM_INVALID_INPUT_FORMAT = 'FORM_INVALID_INPUT_FORMAT',

  // Authentication and authorization errors
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_INVALID_USER = 'AUTH_INVALID_USER',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Error severity levels for different error types
 */
export enum RadioErrorSeverity {
  LOW = 'low',        // Minor issues that don't prevent operation
  MEDIUM = 'medium',  // Issues that may impact functionality
  HIGH = 'high',      // Critical issues that prevent operation
  CRITICAL = 'critical' // System-level issues requiring immediate attention
}

/**
 * Comprehensive error details interface
 */
export interface RadioError {
  /** Error type classification */
  type: RadioErrorType;
  /** Error severity level */
  severity: RadioErrorSeverity;
  /** User-friendly error message in Turkish */
  userMessage: string;
  /** Technical error message for debugging */
  technicalMessage: string;
  /** Original error object if available */
  originalError?: Error | unknown;
  /** Additional context information */
  context: {
    /** Admin user ID for audit trail */
    adminUserId?: number;
    /** Admin user email for logging */
    adminUserEmail?: string;
    /** Timestamp when error occurred */
    timestamp: Date;
    /** Operation that caused the error */
    operation: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
  };
  /** Error code for API responses */
  httpStatusCode: number;
  /** Suggested recovery actions */
  recoveryActions?: string[];
  /** Whether the operation can be retried */
  isRetryable: boolean;
}

/**
 * User-friendly error message mapping in Turkish
 * Maps technical error types to user-friendly messages
 */
const ERROR_MESSAGES: Record<RadioErrorType, string> = {
  // Network related errors
  [RadioErrorType.NETWORK_TIMEOUT]: 'Ağ bağlantısı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.',
  [RadioErrorType.NETWORK_CONNECTION_FAILED]: 'Ağ bağlantısı başarısız. Lütfen internet bağlantınızı kontrol edin.',
  [RadioErrorType.NETWORK_UNREACHABLE]: 'Stream sunucusuna ulaşılamıyor. URL\'yi kontrol edin veya daha sonra tekrar deneyin.',

  // Stream validation errors
  [RadioErrorType.VALIDATION_INVALID_URL]: 'Geçersiz URL formatı. Lütfen doğru bir stream URL\'si girin.',
  [RadioErrorType.VALIDATION_INVALID_PROTOCOL]: 'Geçersiz protokol. Sadece HTTP ve HTTPS desteklenir.',
  [RadioErrorType.VALIDATION_INVALID_HOSTNAME]: 'Geçersiz sunucu adresi. Geçerli bir domain adı girin.',
  [RadioErrorType.VALIDATION_URL_TOO_LONG]: 'URL çok uzun. Maksimum 500 karakter desteklenir.',
  [RadioErrorType.VALIDATION_UNSUPPORTED_FORMAT]: 'Desteklenmeyen audio format. MP3, AAC, OGG veya FLAC kullanın.',

  // Stream connectivity errors
  [RadioErrorType.STREAM_CONNECTION_TIMEOUT]: 'Stream bağlantısı zaman aşımına uğradı. Sunucu yanıt vermiyor.',
  [RadioErrorType.STREAM_CONNECTION_REFUSED]: 'Stream sunucusu bağlantıyı reddetti. URL\'yi kontrol edin.',
  [RadioErrorType.STREAM_INVALID_RESPONSE]: 'Stream sunucusundan geçersiz yanıt alındı.',
  [RadioErrorType.STREAM_UNSUPPORTED_CONTENT_TYPE]: 'Desteklenmeyen stream formatı. Audio stream gerekli.',
  [RadioErrorType.STREAM_SERVER_ERROR]: 'Stream sunucusunda hata oluştu. Daha sonra tekrar deneyin.',

  // Database operation errors
  [RadioErrorType.DATABASE_CONNECTION_ERROR]: 'Veritabanı bağlantısı başarısız. Sistem yöneticisi ile iletişime geçin.',
  [RadioErrorType.DATABASE_QUERY_FAILED]: 'Veritabanı sorgusu başarısız. Lütfen tekrar deneyin.',
  [RadioErrorType.DATABASE_CONSTRAINT_VIOLATION]: 'Veritabanı kısıtlaması ihlali. Girdiğiniz verileri kontrol edin.',
  [RadioErrorType.DATABASE_TRANSACTION_FAILED]: 'Veritabanı işlemi başarısız. Lütfen tekrar deneyin.',

  // Admin form errors
  [RadioErrorType.FORM_VALIDATION_ERROR]: 'Form doğrulama hatası. Lütfen girdiğiniz bilgileri kontrol edin.',
  [RadioErrorType.FORM_REQUIRED_FIELD_MISSING]: 'Zorunlu alanlar eksik. Lütfen tüm gerekli alanları doldurun.',
  [RadioErrorType.FORM_INVALID_INPUT_FORMAT]: 'Geçersiz veri formatı. Lütfen doğru format kullanın.',

  // Authentication and authorization errors
  [RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS]: 'Yetersiz yetki. Bu işlem için admin yetkisi gerekli.',
  [RadioErrorType.AUTH_SESSION_EXPIRED]: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
  [RadioErrorType.AUTH_INVALID_USER]: 'Geçersiz kullanıcı. Lütfen tekrar giriş yapın.',

  // Rate limiting errors
  [RadioErrorType.RATE_LIMIT_EXCEEDED]: 'İstek sınırı aşıldı. Lütfen bir süre bekleyip tekrar deneyin.',

  // Generic errors
  [RadioErrorType.UNKNOWN_ERROR]: 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  [RadioErrorType.INTERNAL_SERVER_ERROR]: 'Sunucu hatası oluştu. Sistem yöneticisi ile iletişime geçin.'
};

/**
 * Error severity mapping for different error types
 */
const ERROR_SEVERITY: Record<RadioErrorType, RadioErrorSeverity> = {
  // Network errors - generally medium severity
  [RadioErrorType.NETWORK_TIMEOUT]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.NETWORK_CONNECTION_FAILED]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.NETWORK_UNREACHABLE]: RadioErrorSeverity.MEDIUM,

  // Validation errors - low severity as they're user fixable
  [RadioErrorType.VALIDATION_INVALID_URL]: RadioErrorSeverity.LOW,
  [RadioErrorType.VALIDATION_INVALID_PROTOCOL]: RadioErrorSeverity.LOW,
  [RadioErrorType.VALIDATION_INVALID_HOSTNAME]: RadioErrorSeverity.LOW,
  [RadioErrorType.VALIDATION_URL_TOO_LONG]: RadioErrorSeverity.LOW,
  [RadioErrorType.VALIDATION_UNSUPPORTED_FORMAT]: RadioErrorSeverity.LOW,

  // Stream errors - medium to high severity
  [RadioErrorType.STREAM_CONNECTION_TIMEOUT]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.STREAM_CONNECTION_REFUSED]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.STREAM_INVALID_RESPONSE]: RadioErrorSeverity.HIGH,
  [RadioErrorType.STREAM_UNSUPPORTED_CONTENT_TYPE]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.STREAM_SERVER_ERROR]: RadioErrorSeverity.HIGH,

  // Database errors - high to critical severity
  [RadioErrorType.DATABASE_CONNECTION_ERROR]: RadioErrorSeverity.CRITICAL,
  [RadioErrorType.DATABASE_QUERY_FAILED]: RadioErrorSeverity.HIGH,
  [RadioErrorType.DATABASE_CONSTRAINT_VIOLATION]: RadioErrorSeverity.HIGH,
  [RadioErrorType.DATABASE_TRANSACTION_FAILED]: RadioErrorSeverity.HIGH,

  // Form errors - low severity as they're user fixable
  [RadioErrorType.FORM_VALIDATION_ERROR]: RadioErrorSeverity.LOW,
  [RadioErrorType.FORM_REQUIRED_FIELD_MISSING]: RadioErrorSeverity.LOW,
  [RadioErrorType.FORM_INVALID_INPUT_FORMAT]: RadioErrorSeverity.LOW,

  // Auth errors - medium to high severity
  [RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.AUTH_SESSION_EXPIRED]: RadioErrorSeverity.MEDIUM,
  [RadioErrorType.AUTH_INVALID_USER]: RadioErrorSeverity.HIGH,

  // Rate limiting - low severity
  [RadioErrorType.RATE_LIMIT_EXCEEDED]: RadioErrorSeverity.LOW,

  // Generic errors - high to critical
  [RadioErrorType.UNKNOWN_ERROR]: RadioErrorSeverity.HIGH,
  [RadioErrorType.INTERNAL_SERVER_ERROR]: RadioErrorSeverity.CRITICAL
};

/**
 * HTTP status code mapping for different error types
 */
const ERROR_HTTP_STATUS: Record<RadioErrorType, number> = {
  // Network and stream errors - 500s for server issues, 400s for client issues
  [RadioErrorType.NETWORK_TIMEOUT]: 408,
  [RadioErrorType.NETWORK_CONNECTION_FAILED]: 503,
  [RadioErrorType.NETWORK_UNREACHABLE]: 503,
  [RadioErrorType.STREAM_CONNECTION_TIMEOUT]: 408,
  [RadioErrorType.STREAM_CONNECTION_REFUSED]: 503,
  [RadioErrorType.STREAM_INVALID_RESPONSE]: 502,
  [RadioErrorType.STREAM_UNSUPPORTED_CONTENT_TYPE]: 415,
  [RadioErrorType.STREAM_SERVER_ERROR]: 502,

  // Validation errors - 400 Bad Request
  [RadioErrorType.VALIDATION_INVALID_URL]: 400,
  [RadioErrorType.VALIDATION_INVALID_PROTOCOL]: 400,
  [RadioErrorType.VALIDATION_INVALID_HOSTNAME]: 400,
  [RadioErrorType.VALIDATION_URL_TOO_LONG]: 400,
  [RadioErrorType.VALIDATION_UNSUPPORTED_FORMAT]: 400,

  // Database errors - 500 Internal Server Error
  [RadioErrorType.DATABASE_CONNECTION_ERROR]: 500,
  [RadioErrorType.DATABASE_QUERY_FAILED]: 500,
  [RadioErrorType.DATABASE_CONSTRAINT_VIOLATION]: 409,
  [RadioErrorType.DATABASE_TRANSACTION_FAILED]: 500,

  // Form errors - 400 Bad Request
  [RadioErrorType.FORM_VALIDATION_ERROR]: 400,
  [RadioErrorType.FORM_REQUIRED_FIELD_MISSING]: 400,
  [RadioErrorType.FORM_INVALID_INPUT_FORMAT]: 400,

  // Auth errors
  [RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
  [RadioErrorType.AUTH_SESSION_EXPIRED]: 401,
  [RadioErrorType.AUTH_INVALID_USER]: 401,

  // Rate limiting
  [RadioErrorType.RATE_LIMIT_EXCEEDED]: 429,

  // Generic errors
  [RadioErrorType.UNKNOWN_ERROR]: 500,
  [RadioErrorType.INTERNAL_SERVER_ERROR]: 500
};

/**
 * Recovery actions for different error types
 */
const RECOVERY_ACTIONS: Partial<Record<RadioErrorType, string[]>> = {
  [RadioErrorType.NETWORK_TIMEOUT]: [
    'İnternet bağlantınızı kontrol edin',
    'Biraz bekleyip tekrar deneyin',
    'VPN kullanıyorsanız kapatmayı deneyin'
  ],
  [RadioErrorType.VALIDATION_INVALID_URL]: [
    'URL formatını kontrol edin (http:// veya https:// ile başlamalı)',
    'Domain adının doğru yazıldığından emin olun',
    'Port numarasını kontrol edin'
  ],
  [RadioErrorType.STREAM_CONNECTION_TIMEOUT]: [
    'Stream sunucusunun çalıştığını kontrol edin',
    'URL\'nin doğru olduğundan emin olun',
    'Farklı bir stream URL\'si deneyin'
  ],
  [RadioErrorType.DATABASE_CONNECTION_ERROR]: [
    'Sistem yöneticisi ile iletişime geçin',
    'Birkaç dakika sonra tekrar deneyin'
  ],
  [RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS]: [
    'Admin kullanıcısı ile giriş yapmayı deneyin',
    'Sistem yöneticisinden yetki talep edin'
  ],
  [RadioErrorType.RATE_LIMIT_EXCEEDED]: [
    '1-2 dakika bekleyip tekrar deneyin',
    'Çok fazla istek göndermeyin'
  ]
};

/**
 * Determine if an error type is retryable
 */
const RETRYABLE_ERRORS = new Set<RadioErrorType>([
  RadioErrorType.NETWORK_TIMEOUT,
  RadioErrorType.NETWORK_CONNECTION_FAILED,
  RadioErrorType.STREAM_CONNECTION_TIMEOUT,
  RadioErrorType.DATABASE_QUERY_FAILED,
  RadioErrorType.DATABASE_TRANSACTION_FAILED,
  RadioErrorType.RATE_LIMIT_EXCEEDED,
  RadioErrorType.UNKNOWN_ERROR
]);

/**
 * Prefixed logger for radio error handling
 */
const radioLogger = createPrefixedLogger('RadioError');

/**
 * RadioErrorHandler class for comprehensive error handling
 */
export class RadioErrorHandler {
  /**
   * Create a standardized radio error from an error type and context
   */
  static createError(
    type: RadioErrorType,
    operation: string,
    originalError?: Error | unknown,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      metadata?: Record<string, any>;
    } = {}
  ): RadioError {
    const timestamp = new Date();

    const radioError: RadioError = {
      type,
      severity: ERROR_SEVERITY[type],
      userMessage: ERROR_MESSAGES[type],
      technicalMessage: originalError instanceof Error
        ? originalError.message
        : String(originalError || 'Unknown technical error'),
      originalError,
      context: {
        ...context,
        timestamp,
        operation
      },
      httpStatusCode: ERROR_HTTP_STATUS[type],
      recoveryActions: RECOVERY_ACTIONS[type] || [],
      isRetryable: RETRYABLE_ERRORS.has(type)
    };

    // Log the error with appropriate severity
    RadioErrorHandler.logError(radioError);

    return radioError;
  }

  /**
   * Analyze and categorize an unknown error
   */
  static analyzeError(
    error: Error | unknown,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      metadata?: Record<string, any>;
    } = {}
  ): RadioError {
    if (error instanceof Error) {
      // Check for network related errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return this.createError(RadioErrorType.NETWORK_TIMEOUT, operation, error, context);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return this.createError(RadioErrorType.NETWORK_CONNECTION_FAILED, operation, error, context);
      }

      // Check for database errors
      const dbError = error as DatabaseError;
      if (dbError.code) {
        if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
          return this.createError(RadioErrorType.DATABASE_CONNECTION_ERROR, operation, error, context);
        }

        if (dbError.code === 'ER_DUP_ENTRY') {
          return this.createError(RadioErrorType.DATABASE_CONSTRAINT_VIOLATION, operation, error, context);
        }
      }

      // Check for validation errors
      if (error.message.includes('Invalid URL') || error.message.includes('invalid url')) {
        return this.createError(RadioErrorType.VALIDATION_INVALID_URL, operation, error, context);
      }

      if (error.message.includes('protocol') || error.message.includes('https')) {
        return this.createError(RadioErrorType.VALIDATION_INVALID_PROTOCOL, operation, error, context);
      }

      // Check for auth errors
      if (error.message.includes('Unauthorized') || error.message.includes('Insufficient permissions')) {
        return this.createError(RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS, operation, error, context);
      }

      // Check for rate limiting
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return this.createError(RadioErrorType.RATE_LIMIT_EXCEEDED, operation, error, context);
      }
    }

    // Default to unknown error
    return this.createError(RadioErrorType.UNKNOWN_ERROR, operation, error, context);
  }

  /**
   * Handle stream validation errors
   */
  static handleStreamValidationError(
    validationError: string,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      streamUrl?: string;
    } = {}
  ): RadioError {
    let errorType = RadioErrorType.VALIDATION_INVALID_URL;

    if (validationError.includes('protocol')) {
      errorType = RadioErrorType.VALIDATION_INVALID_PROTOCOL;
    } else if (validationError.includes('hostname')) {
      errorType = RadioErrorType.VALIDATION_INVALID_HOSTNAME;
    } else if (validationError.includes('too long') || validationError.includes('exceed')) {
      errorType = RadioErrorType.VALIDATION_URL_TOO_LONG;
    } else if (validationError.includes('content type') || validationError.includes('format')) {
      errorType = RadioErrorType.VALIDATION_UNSUPPORTED_FORMAT;
    }

    return this.createError(errorType, operation, new Error(validationError), {
      ...context,
      metadata: { streamUrl: context.streamUrl }
    });
  }

  /**
   * Handle stream connectivity errors
   */
  static handleStreamConnectionError(
    connectionError: Error | unknown,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      streamUrl?: string;
      statusCode?: number;
      responseTime?: number;
    } = {}
  ): RadioError {
    if (connectionError instanceof Error) {
      if (connectionError.name === 'AbortError' || connectionError.message.includes('timeout')) {
        return this.createError(RadioErrorType.STREAM_CONNECTION_TIMEOUT, operation, connectionError, {
          ...context,
          metadata: { streamUrl: context.streamUrl, statusCode: context.statusCode }
        });
      }

      if (connectionError.message.includes('refused') || connectionError.message.includes('ECONNREFUSED')) {
        return this.createError(RadioErrorType.STREAM_CONNECTION_REFUSED, operation, connectionError, {
          ...context,
          metadata: { streamUrl: context.streamUrl }
        });
      }

      if (connectionError.message.includes('content type') || connectionError.message.includes('unexpected content')) {
        return this.createError(RadioErrorType.STREAM_UNSUPPORTED_CONTENT_TYPE, operation, connectionError, {
          ...context,
          metadata: { streamUrl: context.streamUrl, statusCode: context.statusCode }
        });
      }
    }

    // Check status code if available
    if (context.statusCode) {
      if (context.statusCode >= 500) {
        return this.createError(RadioErrorType.STREAM_SERVER_ERROR, operation, connectionError, {
          ...context,
          metadata: { streamUrl: context.streamUrl, statusCode: context.statusCode }
        });
      }

      if (context.statusCode === 404 || context.statusCode === 403) {
        return this.createError(RadioErrorType.STREAM_CONNECTION_REFUSED, operation, connectionError, {
          ...context,
          metadata: { streamUrl: context.streamUrl, statusCode: context.statusCode }
        });
      }
    }

    return this.createError(RadioErrorType.STREAM_INVALID_RESPONSE, operation, connectionError, {
      ...context,
      metadata: { streamUrl: context.streamUrl, statusCode: context.statusCode }
    });
  }

  /**
   * Handle database operation errors
   */
  static handleDatabaseError(
    dbError: DatabaseError | Error,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      query?: string;
      table?: string;
    } = {}
  ): RadioError {
    const error = dbError as DatabaseError;

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return this.createError(RadioErrorType.DATABASE_CONNECTION_ERROR, operation, dbError, {
        ...context,
        metadata: { errorCode: error.code, table: context.table }
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return this.createError(RadioErrorType.DATABASE_CONSTRAINT_VIOLATION, operation, dbError, {
        ...context,
        metadata: { errorCode: error.code, table: context.table }
      });
    }

    if (error.message.includes('transaction') || error.message.includes('rollback')) {
      return this.createError(RadioErrorType.DATABASE_TRANSACTION_FAILED, operation, dbError, {
        ...context,
        metadata: { errorCode: error.code, table: context.table }
      });
    }

    return this.createError(RadioErrorType.DATABASE_QUERY_FAILED, operation, dbError, {
      ...context,
      metadata: { errorCode: error.code, table: context.table }
    });
  }

  /**
   * Handle form validation errors
   */
  static handleFormValidationError(
    validationMessage: string,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      fieldName?: string;
      fieldValue?: any;
    } = {}
  ): RadioError {
    let errorType = RadioErrorType.FORM_VALIDATION_ERROR;

    if (validationMessage.includes('required') || validationMessage.includes('gerekli')) {
      errorType = RadioErrorType.FORM_REQUIRED_FIELD_MISSING;
    } else if (validationMessage.includes('format') || validationMessage.includes('invalid')) {
      errorType = RadioErrorType.FORM_INVALID_INPUT_FORMAT;
    }

    return this.createError(errorType, operation, new Error(validationMessage), {
      ...context,
      metadata: { fieldName: context.fieldName, fieldValue: context.fieldValue }
    });
  }

  /**
   * Handle authentication and authorization errors
   */
  static handleAuthError(
    authMessage: string,
    operation: string,
    context: {
      adminUserId?: number;
      adminUserEmail?: string;
      requiredRole?: string;
    } = {}
  ): RadioError {
    let errorType = RadioErrorType.AUTH_INSUFFICIENT_PERMISSIONS;

    if (authMessage.includes('session') || authMessage.includes('expired')) {
      errorType = RadioErrorType.AUTH_SESSION_EXPIRED;
    } else if (authMessage.includes('invalid user') || authMessage.includes('user not found')) {
      errorType = RadioErrorType.AUTH_INVALID_USER;
    }

    return this.createError(errorType, operation, new Error(authMessage), {
      ...context,
      metadata: { requiredRole: context.requiredRole }
    });
  }

  /**
   * Log error with admin user context and appropriate severity
   */
  private static logError(radioError: RadioError): void {
    const logContext = {
      type: radioError.type,
      severity: radioError.severity,
      operation: radioError.context.operation,
      adminUser: radioError.context.adminUserEmail || `ID:${radioError.context.adminUserId}`,
      timestamp: radioError.context.timestamp.toISOString()
    };

    const logMessage = `${radioError.technicalMessage} | Context: ${JSON.stringify(logContext)}`;

    switch (radioError.severity) {
      case RadioErrorSeverity.CRITICAL:
        radioLogger.error(`CRITICAL: ${logMessage}`);
        break;
      case RadioErrorSeverity.HIGH:
        radioLogger.error(`HIGH: ${logMessage}`);
        break;
      case RadioErrorSeverity.MEDIUM:
        radioLogger.warning(`MEDIUM: ${logMessage}`);
        break;
      case RadioErrorSeverity.LOW:
        radioLogger.info(`LOW: ${logMessage}`);
        break;
    }
  }

  /**
   * Convert RadioError to API response format
   */
  static toApiResponse(radioError: RadioError) {
    return {
      success: false,
      error: {
        type: radioError.type,
        message: radioError.userMessage,
        code: radioError.type,
        details: {
          severity: radioError.severity,
          timestamp: radioError.context.timestamp.toISOString(),
          operation: radioError.context.operation,
          recoveryActions: radioError.recoveryActions,
          isRetryable: radioError.isRetryable
        }
      }
    };
  }

  /**
   * Convert RadioError to user-friendly display format
   */
  static toUserDisplay(radioError: RadioError) {
    return {
      title: radioError.severity === RadioErrorSeverity.CRITICAL
        ? 'Kritik Hata'
        : radioError.severity === RadioErrorSeverity.HIGH
        ? 'Önemli Hata'
        : 'Uyarı',
      message: radioError.userMessage,
      type: radioError.severity === RadioErrorSeverity.LOW ? 'warning' : 'error',
      recoveryActions: radioError.recoveryActions,
      isRetryable: radioError.isRetryable,
      timestamp: radioError.context.timestamp
    };
  }
}

/**
 * Convenience functions for common error scenarios
 */

/**
 * Create and return a stream validation error
 */
export function createStreamValidationError(
  validationMessage: string,
  streamUrl: string,
  adminUserId?: number,
  adminUserEmail?: string
): RadioError {
  return RadioErrorHandler.handleStreamValidationError(
    validationMessage,
    'stream_url_validation',
    { adminUserId, adminUserEmail, streamUrl }
  );
}

/**
 * Create and return a stream connection error
 */
export function createStreamConnectionError(
  connectionError: Error | unknown,
  streamUrl: string,
  adminUserId?: number,
  adminUserEmail?: string,
  statusCode?: number,
  responseTime?: number
): RadioError {
  return RadioErrorHandler.handleStreamConnectionError(
    connectionError,
    'stream_connection_test',
    { adminUserId, adminUserEmail, streamUrl, statusCode, responseTime }
  );
}

/**
 * Create and return a database operation error
 */
export function createDatabaseError(
  dbError: DatabaseError | Error,
  operation: string,
  adminUserId?: number,
  adminUserEmail?: string,
  table?: string
): RadioError {
  return RadioErrorHandler.handleDatabaseError(
    dbError,
    operation,
    { adminUserId, adminUserEmail, table }
  );
}

/**
 * Create and return a form validation error
 */
export function createFormValidationError(
  validationMessage: string,
  fieldName: string,
  fieldValue: any,
  adminUserId?: number,
  adminUserEmail?: string
): RadioError {
  return RadioErrorHandler.handleFormValidationError(
    validationMessage,
    'form_validation',
    { adminUserId, adminUserEmail, fieldName, fieldValue }
  );
}

/**
 * Create and return an authentication error
 */
export function createAuthError(
  authMessage: string,
  operation: string,
  adminUserId?: number,
  adminUserEmail?: string,
  requiredRole?: string
): RadioError {
  return RadioErrorHandler.handleAuthError(
    authMessage,
    operation,
    { adminUserId, adminUserEmail, requiredRole }
  );
}

/**
 * Analyze and handle any unknown error
 */
export function handleUnknownError(
  error: Error | unknown,
  operation: string,
  adminUserId?: number,
  adminUserEmail?: string,
  metadata?: Record<string, any>
): RadioError {
  return RadioErrorHandler.analyzeError(
    error,
    operation,
    { adminUserId, adminUserEmail, metadata }
  );
}

// Export the main class for advanced usage