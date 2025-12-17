import jwt from 'jsonwebtoken';
import { UserRole } from '../../types';

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Service for handling JWT token generation and validation
 */
export class JwtService {
  private readonly JWT_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes

  constructor() {
    // In production, use RS256 with private/public key pair
    // For MVP, using HS256 with secret key from environment
    this.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key';

    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Generate an access token for a user
   * @param userId - User's unique identifier
   * @param email - User's email address
   * @param role - User's role (tenant, landlord, broker)
   * @returns JWT access token string
   */
  generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload = {
      userId,
      email,
      role,
    };

    // Using HS256 for MVP, should migrate to RS256 in production
    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });

    return token;
  }

  /**
   * Verify and decode an access token
   * @param token - JWT token to verify
   * @returns Decoded payload if valid, null if invalid
   */
  verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Decode token without verifying (useful for debugging)
   * WARNING: Do not use for authentication, only for inspection
   * @param token - JWT token to decode
   * @returns Decoded payload or null
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }
}
