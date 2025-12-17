import { CsrfService } from '../services/auth/CsrfService';

/**
 * Request-like interface for middleware
 */
export interface Request {
  method?: string;
  path?: string;
  protocol?: string;
  hostname?: string;
  originalUrl?: string;
  headers?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

/**
 * Middleware result
 */
export interface MiddlewareResult {
  allowed: boolean;
  statusCode?: number;
  error?: {
    code: string;
    message: string;
  };
  headers?: Record<string, string>;
  redirect?: string;
}

/**
 * CSRF validation middleware
 * Validates CSRF tokens on state-changing requests
 */
export class CsrfValidationMiddleware {
  private csrfService: CsrfService;

  constructor(csrfService?: CsrfService) {
    this.csrfService = csrfService || new CsrfService();
  }

  /**
   * Check CSRF token validity
   * @param req - Request object
   * @returns Middleware result
   */
  async check(req: Request): Promise<MiddlewareResult> {
    const method = req.method?.toUpperCase() || 'GET';
    const path = req.path || '';

    // Skip CSRF check for safe methods
    if (!this.csrfService.requiresCsrfProtection(method)) {
      return {
        allowed: true,
      };
    }

    // Skip CSRF check for OAuth callback (uses state parameter instead)
    if (path.includes('/oauth/') && path.includes('/callback')) {
      return {
        allowed: true,
      };
    }

    // Get CSRF token from header and cookie
    const tokenFromHeader = this.getHeader(req.headers, 'x-csrf-token');
    const tokenFromCookie = req.cookies?.csrfToken;

    // Validate CSRF token
    const isValid = this.csrfService.validateToken(tokenFromHeader, tokenFromCookie);

    if (!isValid) {
      return {
        allowed: false,
        statusCode: 403,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'Invalid CSRF token',
        },
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Extract header value (handles string or string[] types)
   */
  private getHeader(
    headers: Record<string, string | string[] | undefined> | undefined,
    name: string
  ): string | undefined {
    if (!headers) return undefined;
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}

/**
 * HTTPS enforcement middleware
 * Redirects HTTP requests to HTTPS in production
 */
export class HttpsEnforcementMiddleware {
  /**
   * Check if request should be redirected to HTTPS
   * @param req - Request object
   * @param environment - Environment (production, development, test)
   * @returns Middleware result
   */
  async check(req: Request, environment?: string): Promise<MiddlewareResult> {
    const env = environment || process.env.NODE_ENV || 'development';
    const protocol = req.protocol || 'http';

    // Allow HTTP in development and test environments
    if (env !== 'production') {
      return {
        allowed: true,
      };
    }

    // Allow HTTP when HTTPS redirect is explicitly disabled (e.g., local Docker without SSL)
    if (process.env.DISABLE_HTTPS_REDIRECT === 'true') {
      return {
        allowed: true,
      };
    }

    // Redirect HTTP to HTTPS in production
    if (protocol === 'http') {
      const hostname = req.hostname || 'localhost';
      const originalUrl = req.originalUrl || '/';
      const redirectUrl = `https://${hostname}${originalUrl}`;

      return {
        allowed: false,
        statusCode: 301, // Permanent redirect
        redirect: redirectUrl,
        error: {
          code: 'HTTPS_REQUIRED',
          message: 'HTTPS is required',
        },
      };
    }

    // Set HSTS header for HTTPS requests
    return {
      allowed: true,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    };
  }
}

/**
 * Secure cookie configuration
 * Returns cookie options based on environment
 */
export interface SecureCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
}

/**
 * Get secure cookie options for authentication cookies
 * @param isProduction - Whether in production environment
 * @param maxAge - Maximum age in milliseconds (optional)
 * @returns Cookie options
 */
export function getSecureCookieOptions(
  isProduction: boolean = false,
  maxAge?: number
): SecureCookieOptions {
  return {
    httpOnly: true, // Prevents JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // Prevents CSRF attacks
    path: '/', // Available across all routes
    ...(maxAge ? { maxAge } : {}),
  };
}

/**
 * Get cookie options for access token
 * @param isProduction - Whether in production environment
 * @returns Cookie options with 15-minute expiry
 */
export function getAccessTokenCookieOptions(isProduction: boolean = false): SecureCookieOptions {
  return getSecureCookieOptions(isProduction, 15 * 60 * 1000); // 15 minutes
}

/**
 * Get cookie options for refresh token
 * @param isProduction - Whether in production environment
 * @param rememberMe - Whether "Remember Me" was enabled
 * @returns Cookie options with appropriate expiry
 */
export function getRefreshTokenCookieOptions(
  isProduction: boolean = false,
  rememberMe: boolean = false
): SecureCookieOptions {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 24 * 60 * 60 * 1000; // 24 hours

  return getSecureCookieOptions(isProduction, maxAge);
}

/**
 * Get cookie options for CSRF token
 * @param isProduction - Whether in production environment
 * @returns Cookie options (not HttpOnly so JavaScript can read it)
 */
export function getCsrfTokenCookieOptions(isProduction: boolean = false): SecureCookieOptions {
  return {
    httpOnly: false, // Must be false so JavaScript can read it
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
}
