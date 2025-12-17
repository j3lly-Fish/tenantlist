import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/auth/JwtService';
import { RefreshTokenService } from '../services/auth/RefreshTokenService';
import { TokenBlacklistService } from '../services/auth/TokenBlacklistService';

/**
 * Extended Request interface with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware to protect routes
 *
 * This middleware:
 * 1. Extracts access token from Authorization header
 * 2. Verifies the token is valid and not blacklisted
 * 3. Attaches user data to request object
 * 4. Returns 401 if authentication fails
 */
export class AuthMiddleware {
  private jwtService: JwtService;
  private tokenBlacklistService: TokenBlacklistService;

  constructor() {
    this.jwtService = new JwtService();
    this.tokenBlacklistService = new TokenBlacklistService();
  }

  /**
   * Middleware function to authenticate requests
   */
  async authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract token from cookie first (preferred for httpOnly security)
      // Fall back to Authorization header for backward compatibility
      let accessToken = req.cookies?.accessToken;

      if (!accessToken) {
        const authHeader = req.headers.authorization;
        accessToken = this.jwtService.extractTokenFromHeader(authHeader);
      }

      if (!accessToken) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Access token is required',
          },
        });
        return;
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(accessToken);
      if (isBlacklisted) {
        res.status(401).json({
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Token has been revoked',
          },
        });
        return;
      }

      // Verify access token
      const payload = this.jwtService.verifyAccessToken(accessToken);
      if (!payload) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired access token',
          },
        });
        return;
      }

      // Attach user data to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (error: any) {
      // Handle token expiration
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        });
        return;
      }

      // Handle invalid token
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          },
        });
        return;
      }

      // Handle other errors
      console.error('Authentication error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during authentication',
        },
      });
    }
  }

  /**
   * Create middleware function bound to this instance
   */
  getMiddleware() {
    return this.authenticate.bind(this);
  }
}

/**
 * Role-based authorization middleware
 *
 * This middleware checks if the authenticated user has the required role(s)
 */
export class RoleGuard {
  /**
   * Create middleware to check for required roles
   *
   * @param allowedRoles - Array of allowed roles
   */
  static require(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
      }

      next();
    };
  }
}

/**
 * Automatic token refresh middleware
 *
 * This middleware automatically refreshes expired access tokens using refresh token
 */
export class TokenRefreshMiddleware {
  private jwtService: JwtService;
  private refreshTokenService: RefreshTokenService;

  constructor() {
    this.jwtService = new JwtService();
    this.refreshTokenService = new RefreshTokenService();
  }

  /**
   * Middleware to handle automatic token refresh
   */
  async handleTokenRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract access token from Authorization header
      const authHeader = req.headers.authorization;
      const accessToken = this.jwtService.extractTokenFromHeader(authHeader);

      // If no access token, continue (will be caught by auth middleware)
      if (!accessToken) {
        next();
        return;
      }

      // Try to verify access token
      const payload = this.jwtService.verifyAccessToken(accessToken);
      if (payload) {
        // Token is valid, continue
        next();
        return;
      }

      // Token is invalid or expired, try to refresh
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        // No refresh token available, let auth middleware handle it
        next();
        return;
      }

      try {
        // Validate refresh token
        const isValid = await this.refreshTokenService.validateRefreshToken(refreshToken);

        if (!isValid) {
          // Refresh token is invalid, let auth middleware handle it
          next();
          return;
        }

        // Get token data
        const tokenRecord = await this.refreshTokenService.getTokenRecord(refreshToken);

        if (!tokenRecord || !tokenRecord.user_id) {
          next();
          return;
        }

        // Generate new access token
        const newAccessToken = this.jwtService.generateAccessToken(
          tokenRecord.user_id,
          '', // Email not stored in refresh token record
          tokenRecord.role || 'tenant'
        );

        // Rotate refresh token
        const ipAddress = this.getIpAddress(req);
        const { token: newRefreshToken } = await this.refreshTokenService.rotateRefreshToken(
          refreshToken,
          tokenRecord.user_id,
          false,
          ipAddress
        );

        // Set new tokens in response cookies
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/',
        });

        // Update Authorization header for downstream middleware
        req.headers.authorization = `Bearer ${newAccessToken}`;

        next();
        return;
      } catch (refreshError: any) {
        // Refresh failed, let auth middleware handle it
        next();
        return;
      }
    } catch (error: any) {
      // Any error during refresh, continue to let auth middleware handle it
      console.error('Token refresh error:', error);
      next();
    }
  }

  /**
   * Extract IP address from request
   */
  private getIpAddress(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    return req.ip || '127.0.0.1';
  }

  /**
   * Create middleware function bound to this instance
   */
  getMiddleware() {
    return this.handleTokenRefresh.bind(this);
  }
}
