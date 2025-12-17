import crypto from 'crypto';

/**
 * Service for CSRF protection using double-submit cookie pattern
 */
export class CsrfService {
  private readonly TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

  /**
   * Generate a cryptographically random CSRF token
   * @returns Random token as hex string
   */
  generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate CSRF token using double-submit cookie pattern
   * @param tokenFromHeader - Token from X-CSRF-Token header
   * @param tokenFromCookie - Token from CSRF cookie
   * @returns True if tokens match, false otherwise
   */
  validateToken(tokenFromHeader: string | undefined, tokenFromCookie: string | undefined): boolean {
    if (!tokenFromHeader || !tokenFromCookie) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(tokenFromHeader, tokenFromCookie);
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal, false otherwise
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      // Convert strings to buffers for timing-safe comparison
      const bufferA = Buffer.from(a);
      const bufferB = Buffer.from(b);

      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      // If conversion fails, strings are not equal
      return false;
    }
  }

  /**
   * Check if HTTP method requires CSRF protection
   * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
   * @returns True if method requires CSRF protection
   */
  requiresCsrfProtection(method: string): boolean {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return protectedMethods.includes(method.toUpperCase());
  }

  /**
   * Generate cookie options for CSRF token
   * @param isProduction - Whether in production environment
   * @returns Cookie options object
   */
  getCookieOptions(isProduction: boolean = false): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  } {
    return {
      httpOnly: false, // Must be false so JavaScript can read it
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    };
  }
}
