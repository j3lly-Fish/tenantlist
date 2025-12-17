import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/auth/JwtService';
import { UserRole } from '../types';

/**
 * Role Guard Middleware
 *
 * Protects routes by requiring specific user roles.
 * Must be used after JWT authentication middleware.
 */
export class RoleGuardMiddleware {
  private jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService();
  }

  /**
   * Require one or more roles to access the route
   */
  requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract token from cookie first, fall back to Authorization header
        let accessToken = (req as any).cookies?.accessToken;

        if (!accessToken) {
          const authHeader = req.headers.authorization;
          accessToken = this.jwtService.extractTokenFromHeader(authHeader);
        }

        if (!accessToken) {
          return res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Access token is required',
            },
          });
        }

        // Verify token and get payload
        const payload = this.jwtService.verifyAccessToken(accessToken);

        if (!payload) {
          return res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired access token',
            },
          });
        }

        // Check if user's role is allowed
        const userRole = payload.role as UserRole;

        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to access this resource',
            },
          });
        }

        // Attach user info to request for downstream handlers
        (req as any).user = {
          userId: payload.userId,
          email: payload.email,
          role: userRole,
        };

        next();
      } catch (error: any) {
        console.error('Role guard error:', error);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during authorization',
          },
        });
      }
    };
  }

  /**
   * Require tenant role
   */
  requireTenant() {
    return this.requireRole(UserRole.TENANT);
  }

  /**
   * Require landlord role
   */
  requireLandlord() {
    return this.requireRole(UserRole.LANDLORD);
  }

  /**
   * Require broker role
   */
  requireBroker() {
    return this.requireRole(UserRole.BROKER);
  }

  /**
   * Require tenant or broker role
   */
  requireTenantOrBroker() {
    return this.requireRole(UserRole.TENANT, UserRole.BROKER);
  }

  /**
   * Require landlord or broker role
   */
  requireLandlordOrBroker() {
    return this.requireRole(UserRole.LANDLORD, UserRole.BROKER);
  }

  /**
   * Authenticate user but don't restrict by role
   */
  authenticate() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract token from cookie first, fall back to Authorization header
        let accessToken = (req as any).cookies?.accessToken;

        if (!accessToken) {
          const authHeader = req.headers.authorization;
          accessToken = this.jwtService.extractTokenFromHeader(authHeader);
        }

        if (!accessToken) {
          return res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Access token is required',
            },
          });
        }

        // Verify token and get payload
        const payload = this.jwtService.verifyAccessToken(accessToken);

        if (!payload) {
          return res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired access token',
            },
          });
        }

        // Attach user info to request for downstream handlers
        (req as any).user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };

        next();
      } catch (error: any) {
        console.error('Authentication error:', error);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during authentication',
          },
        });
      }
    };
  }
}
