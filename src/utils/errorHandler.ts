import { Response } from 'express';

/**
 * Standard error codes for the application
 */
export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',

  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_ROLE = 'INVALID_ROLE',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_STATE = 'INVALID_STATE',

  // Resource errors (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  OAUTH_ACCOUNT_ALREADY_LINKED = 'OAUTH_ACCOUNT_ALREADY_LINKED',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  OAUTH_ERROR = 'OAUTH_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Application error class with status code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler utility for consistent error responses
 */
export class ErrorHandler {
  /**
   * Handle authentication errors (401)
   */
  static unauthorized(res: Response, code: ErrorCode, message: string): void {
    res.status(401).json({
      error: {
        code,
        message,
      },
    });
  }

  /**
   * Handle authorization errors (403)
   */
  static forbidden(res: Response, message: string = 'Insufficient permissions'): void {
    res.status(403).json({
      error: {
        code: ErrorCode.FORBIDDEN,
        message,
      },
    });
  }

  /**
   * Handle validation errors (400)
   */
  static badRequest(res: Response, code: ErrorCode, message: string, details?: any): void {
    res.status(400).json({
      error: {
        code,
        message,
        ...(details && { details }),
      },
    });
  }

  /**
   * Handle not found errors (404)
   */
  static notFound(res: Response, code: ErrorCode, message: string): void {
    res.status(404).json({
      error: {
        code,
        message,
      },
    });
  }

  /**
   * Handle conflict errors (409)
   */
  static conflict(res: Response, code: ErrorCode, message: string): void {
    res.status(409).json({
      error: {
        code,
        message,
      },
    });
  }

  /**
   * Handle rate limit errors (429)
   */
  static rateLimitExceeded(res: Response, message: string, headers?: Record<string, string>): void {
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    res.status(429).json({
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message,
      },
    });
  }

  /**
   * Handle internal server errors (500)
   */
  static internalError(res: Response, message: string = 'An unexpected error occurred'): void {
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
      },
    });
  }

  /**
   * Handle AppError instances
   */
  static handleAppError(res: Response, error: AppError): void {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  /**
   * Generic error handler that determines error type
   */
  static handle(res: Response, error: Error | AppError, defaultMessage?: string): void {
    // Log error for debugging
    console.error('Error:', error);

    // Handle custom AppError
    if (error instanceof AppError) {
      return ErrorHandler.handleAppError(res, error);
    }

    // Handle known error patterns by message
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('invalid credentials') || errorMessage.includes('incorrect')) {
      return ErrorHandler.unauthorized(res, ErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect');
    }

    if (errorMessage.includes('token expired')) {
      return ErrorHandler.unauthorized(res, ErrorCode.TOKEN_EXPIRED, 'Access token has expired');
    }

    if (errorMessage.includes('invalid token') || errorMessage.includes('malformed')) {
      return ErrorHandler.unauthorized(res, ErrorCode.INVALID_TOKEN, 'Invalid access token');
    }

    if (errorMessage.includes('already exists')) {
      return ErrorHandler.conflict(res, ErrorCode.EMAIL_EXISTS, error.message);
    }

    if (errorMessage.includes('not found')) {
      return ErrorHandler.notFound(res, ErrorCode.NOT_FOUND, error.message);
    }

    if (
      errorMessage.includes('required') ||
      errorMessage.includes('must') ||
      errorMessage.includes('invalid')
    ) {
      return ErrorHandler.badRequest(res, ErrorCode.VALIDATION_ERROR, error.message);
    }

    // Default to internal server error
    return ErrorHandler.internalError(res, defaultMessage);
  }
}

/**
 * Express error handling middleware
 */
export function errorMiddleware(error: Error | AppError, req: any, res: Response, next: any): void {
  ErrorHandler.handle(res, error);
}
