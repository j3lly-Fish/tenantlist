import { RateLimitService, RateLimitType } from '../services/auth/RateLimitService';

/**
 * Request-like interface for middleware
 */
export interface Request {
  ip?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  path?: string;
}

/**
 * Response-like interface for middleware
 */
export interface Response {
  status: (code: number) => Response;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
}

/**
 * Next function type
 */
export type NextFunction = () => void;

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
}

/**
 * Extract IP address from request
 * @param req - Request object
 * @returns IP address
 */
function getIpAddress(req: Request): string {
  // Check X-Forwarded-For header (for proxies/load balancers)
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to req.ip
  return req.ip || '127.0.0.1';
}

/**
 * IP-based rate limiting middleware
 * Limits login attempts per IP address
 */
export class IpRateLimitMiddleware {
  private rateLimitService: RateLimitService;

  constructor(rateLimitService?: RateLimitService) {
    this.rateLimitService = rateLimitService || new RateLimitService();
  }

  /**
   * Check IP-based rate limit
   * @param req - Request object
   * @returns Middleware result
   */
  async check(req: Request): Promise<MiddlewareResult> {
    const ip = getIpAddress(req);
    const result = await this.rateLimitService.checkRateLimit(RateLimitType.LOGIN_IP, ip);

    if (!result.allowed) {
      return {
        allowed: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
        },
        headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.LOGIN_IP),
      };
    }

    return {
      allowed: true,
      headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.LOGIN_IP),
    };
  }
}

/**
 * Email-based rate limiting middleware
 * Limits login attempts per email address
 */
export class EmailRateLimitMiddleware {
  private rateLimitService: RateLimitService;

  constructor(rateLimitService?: RateLimitService) {
    this.rateLimitService = rateLimitService || new RateLimitService();
  }

  /**
   * Check email-based rate limit
   * @param email - Email address from request body
   * @returns Middleware result
   */
  async check(email: string): Promise<MiddlewareResult> {
    if (!email || typeof email !== 'string') {
      return {
        allowed: true,
        headers: {},
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await this.rateLimitService.checkRateLimit(
      RateLimitType.LOGIN_EMAIL,
      normalizedEmail
    );

    if (!result.allowed) {
      return {
        allowed: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts for this email. Please try again in 15 minutes.',
        },
        headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.LOGIN_EMAIL),
      };
    }

    return {
      allowed: true,
      headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.LOGIN_EMAIL),
    };
  }
}

/**
 * Password reset rate limiting middleware
 * Limits password reset requests per email address
 */
export class PasswordResetRateLimitMiddleware {
  private rateLimitService: RateLimitService;

  constructor(rateLimitService?: RateLimitService) {
    this.rateLimitService = rateLimitService || new RateLimitService();
  }

  /**
   * Check password reset rate limit
   * @param email - Email address from request body
   * @returns Middleware result
   */
  async check(email: string): Promise<MiddlewareResult> {
    if (!email) {
      return {
        allowed: true,
        headers: {},
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await this.rateLimitService.checkRateLimit(
      RateLimitType.PASSWORD_RESET,
      normalizedEmail
    );

    if (!result.allowed) {
      return {
        allowed: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please try again in 1 hour.',
        },
        headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.PASSWORD_RESET),
      };
    }

    return {
      allowed: true,
      headers: this.rateLimitService.getRateLimitHeaders(result, RateLimitType.PASSWORD_RESET),
    };
  }
}

/**
 * Combined login rate limiting middleware
 * Checks both IP and email-based rate limits
 */
export class LoginRateLimitMiddleware {
  private ipRateLimitMiddleware: IpRateLimitMiddleware;
  private emailRateLimitMiddleware: EmailRateLimitMiddleware;

  constructor(rateLimitService?: RateLimitService) {
    this.ipRateLimitMiddleware = new IpRateLimitMiddleware(rateLimitService);
    this.emailRateLimitMiddleware = new EmailRateLimitMiddleware(rateLimitService);
  }

  /**
   * Check both IP and email rate limits
   * @param req - Request object
   * @returns Middleware result (fails if either limit exceeded)
   */
  async check(req: Request): Promise<MiddlewareResult> {
    // Check IP-based rate limit first
    const ipResult = await this.ipRateLimitMiddleware.check(req);
    if (!ipResult.allowed) {
      return ipResult;
    }

    // Check email-based rate limit
    const email = req.body?.email;
    if (email) {
      const emailResult = await this.emailRateLimitMiddleware.check(email);
      if (!emailResult.allowed) {
        return emailResult;
      }

      // Merge headers from both checks
      return {
        allowed: true,
        headers: {
          ...ipResult.headers,
          ...emailResult.headers,
        },
      };
    }

    return ipResult;
  }
}
