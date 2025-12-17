import { RoleGuardMiddleware } from '../../middleware/roleGuardMiddleware';
import { JwtService } from '../../services/auth/JwtService';
import { UserRole } from '../../types';
import { Request, Response } from 'express';

// Mock JwtService
jest.mock('../../services/auth/JwtService');

describe('RoleGuardMiddleware', () => {
  let roleGuard: RoleGuardMiddleware;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create middleware instance
    roleGuard = new RoleGuardMiddleware();

    // Get mocked JWT service instance
    mockJwtService = (roleGuard as any).jwtService;

    // Setup mock request
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware with tenant role requirement
      const middleware = roleGuard.requireRole(UserRole.TENANT);

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();

      // Verify user info was attached to request
      expect((mockRequest as any).user).toEqual({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
      });
    });

    it('should deny access when user has wrong role', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware with landlord role requirement
      const middleware = roleGuard.requireRole(UserRole.LANDLORD);

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware with tenant or broker role requirement
      const middleware = roleGuard.requireRole(UserRole.TENANT, UserRole.BROKER);

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no access token provided', async () => {
      // Mock JWT service to return null token
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue(null);

      // Create middleware
      const middleware = roleGuard.requireRole(UserRole.TENANT);

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when access token is invalid', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('invalid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue(null);

      // Create middleware
      const middleware = roleGuard.requireRole(UserRole.TENANT);

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireTenant', () => {
    it('should allow access for tenant users', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware
      const middleware = roleGuard.requireTenant();

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireLandlord', () => {
    it('should allow access for landlord users', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'landlord@example.com',
        role: UserRole.LANDLORD,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware
      const middleware = roleGuard.requireLandlord();

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireBroker', () => {
    it('should allow access for broker users', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware
      const middleware = roleGuard.requireBroker();

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('should authenticate user without role restriction', async () => {
      // Mock JWT service methods
      mockJwtService.extractTokenFromHeader = jest.fn().mockReturnValue('valid-token');
      mockJwtService.verifyAccessToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        role: UserRole.TENANT,
        iat: Date.now(),
        exp: Date.now() + 900000,
      });

      // Create middleware
      const middleware = roleGuard.authenticate();

      // Execute middleware
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify next was called
      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
    });
  });
});
