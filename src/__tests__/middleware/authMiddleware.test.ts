import { Request, Response } from 'express';
import { AuthMiddleware, RoleGuard, TokenRefreshMiddleware, AuthenticatedRequest } from '../../middleware/authMiddleware';
import { JwtService } from '../../services/auth/JwtService';
import { RefreshTokenService } from '../../services/auth/RefreshTokenService';
import { TokenBlacklistService } from '../../services/auth/TokenBlacklistService';

// Mock the services
jest.mock('../../services/auth/JwtService');
jest.mock('../../services/auth/RefreshTokenService');
jest.mock('../../services/auth/TokenBlacklistService');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockTokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockJwtService = new JwtService() as jest.Mocked<JwtService>;
    mockTokenBlacklistService = new TokenBlacklistService() as jest.Mocked<TokenBlacklistService>;

    authMiddleware = new AuthMiddleware();
    (authMiddleware as any).jwtService = mockJwtService;
    (authMiddleware as any).tokenBlacklistService = mockTokenBlacklistService;

    // Mock request and response
    mockRequest = {
      headers: {},
      cookies: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'tenant' as any,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
      mockTokenBlacklistService.isBlacklisted = jest.fn().mockResolvedValue(false);
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(mockPayload);

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwtService.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${mockToken}`);
      expect(mockTokenBlacklistService.isBlacklisted).toHaveBeenCalledWith(mockToken);
      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.user).toEqual({
        userId: mockPayload.userId,
        email: mockPayload.email,
        role: mockPayload.role,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      mockRequest.headers = {};
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(null);

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is blacklisted', async () => {
      const mockToken = 'blacklisted.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
      mockTokenBlacklistService.isBlacklisted = jest.fn().mockResolvedValue(true);

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const mockToken = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
      mockTokenBlacklistService.isBlacklisted = jest.fn().mockResolvedValue(false);
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(null);

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token expiration error', async () => {
      const mockToken = 'expired.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
      mockTokenBlacklistService.isBlacklisted = jest.fn().mockResolvedValue(false);

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      mockJwtService.verifyAccessToken = jest.fn().mockImplementation(() => {
        throw expiredError;
      });

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JWT error', async () => {
      const mockToken = 'malformed.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
      mockTokenBlacklistService.isBlacklisted = jest.fn().mockResolvedValue(false);

      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      mockJwtService.verifyAccessToken = jest.fn().mockImplementation(() => {
        throw jwtError;
      });

      await authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('RoleGuard', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  it('should allow user with required role', () => {
    const middleware = RoleGuard.require('tenant', 'landlord');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should block user without required role', () => {
    const middleware = RoleGuard.require('landlord', 'broker');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', () => {
    mockRequest.user = undefined;
    const middleware = RoleGuard.require('tenant');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('TokenRefreshMiddleware', () => {
  let tokenRefreshMiddleware: TokenRefreshMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJwtService = new JwtService() as jest.Mocked<JwtService>;
    mockRefreshTokenService = new RefreshTokenService() as jest.Mocked<RefreshTokenService>;

    tokenRefreshMiddleware = new TokenRefreshMiddleware();
    (tokenRefreshMiddleware as any).jwtService = mockJwtService;
    (tokenRefreshMiddleware as any).refreshTokenService = mockRefreshTokenService;

    mockRequest = {
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  it('should continue when access token is valid', async () => {
    const mockToken = 'valid.jwt.token';
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'tenant' as any,
      iat: Date.now(),
      exp: Date.now() + 900000,
    };

    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`,
    };

    mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockToken);
    mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(mockPayload);

    await tokenRefreshMiddleware.handleTokenRefresh(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should continue when no access token is provided', async () => {
    mockRequest.headers = {};
    mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(null);

    await tokenRefreshMiddleware.handleTokenRefresh(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should automatically refresh expired token', async () => {
    const mockExpiredToken = 'expired.jwt.token';
    const mockRefreshToken = 'valid.refresh.token';
    const mockNewAccessToken = 'new.access.token';
    const mockNewRefreshToken = 'new.refresh.token';
    const mockTokenRecord = {
      user_id: 'user-123',
      token_hash: 'hash123',
      expires_at: new Date(),
      revoked: false,
    };

    mockRequest.headers = {
      authorization: `Bearer ${mockExpiredToken}`,
    };
    mockRequest.cookies = {
      refreshToken: mockRefreshToken,
    };

    mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockExpiredToken);
    mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(null);
    mockRefreshTokenService.validateRefreshToken = jest.fn().mockResolvedValue(true);
    mockRefreshTokenService.getTokenRecord = jest.fn().mockResolvedValue(mockTokenRecord);
    mockJwtService.generateAccessToken = jest.fn().mockReturnValue(mockNewAccessToken);
    mockRefreshTokenService.rotateRefreshToken = jest.fn().mockResolvedValue({
      token: mockNewRefreshToken,
      tokenRecord: mockTokenRecord,
    });

    await tokenRefreshMiddleware.handleTokenRefresh(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRefreshTokenService.validateRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    expect(mockRefreshTokenService.getTokenRecord).toHaveBeenCalledWith(mockRefreshToken);
    expect(mockJwtService.generateAccessToken).toHaveBeenCalledWith(
      mockTokenRecord.user_id,
      '',
      'tenant'
    );
    expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalled();
    expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    expect(mockRequest.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should continue when refresh token is invalid', async () => {
    const mockExpiredToken = 'expired.jwt.token';
    const mockInvalidRefreshToken = 'invalid.refresh.token';

    mockRequest.headers = {
      authorization: `Bearer ${mockExpiredToken}`,
    };
    mockRequest.cookies = {
      refreshToken: mockInvalidRefreshToken,
    };

    mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(mockExpiredToken);
    mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(null);
    mockRefreshTokenService.validateRefreshToken = jest.fn().mockResolvedValue(false);

    await tokenRefreshMiddleware.handleTokenRefresh(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
