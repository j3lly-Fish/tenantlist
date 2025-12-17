import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { LoginRateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { JwtService } from '../services/auth/JwtService';
import { RateLimitService, RateLimitType } from '../services/auth/RateLimitService';
import { OAuthProvider, UserRole } from '../types';

const router = Router();
const authController = new AuthController();
const loginRateLimitMiddleware = new LoginRateLimitMiddleware();
const jwtService = new JwtService();
const rateLimitService = new RateLimitService();

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string {
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
 * Set authentication cookies in response
 */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

/**
 * POST /api/auth/signup
 * Create a new user account
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   role: 'tenant' | 'landlord' | 'broker',
 *   firstName: string,
 *   lastName: string,
 *   phone: string,
 *   bio?: string,
 *   photo?: string
 * }
 *
 * Response (201):
 * {
 *   user: { id, email, role },
 *   accessToken: string,
 *   refreshToken: string
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 409: Email already exists
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const ipAddress = getIpAddress(req);
    const result = await authController.signup(req.body, ipAddress);

    // Set authentication cookies
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: error.message,
        },
      });
    } else if (
      error.message.includes('required') ||
      error.message.includes('Password must')
    ) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    } else {
      console.error('Signup error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during signup',
        },
      });
    }
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   rememberMe?: boolean
 * }
 *
 * Response (200):
 * {
 *   user: { id, email, role, emailVerified },
 *   accessToken: string,
 *   refreshToken: string
 * }
 *
 * Errors:
 * - 401: Invalid credentials
 * - 429: Rate limit exceeded
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Check rate limiting
    const rateLimitResult = await loginRateLimitMiddleware.check(req as any);

    if (!rateLimitResult.allowed) {
      // Set rate limit headers
      if (rateLimitResult.headers) {
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      return res.status(429).json({
        error: rateLimitResult.error,
      });
    }

    // Set rate limit headers for successful check
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    const ipAddress = getIpAddress(req);
    const result = await authController.login(req.body, ipAddress);

    // Set authentication cookies
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(200).json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error: any) {
    if (error.message.includes('Invalid credentials') || error.message.includes('inactive')) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    } else if (error.message.includes('required')) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    } else {
      console.error('Login error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      });
    }
  }
});

/**
 * POST /api/auth/logout
 * Revoke user's refresh token and blacklist access token
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   message: 'Logged out successfully'
 * }
 *
 * Errors:
 * - 401: Unauthorized
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Extract access token from cookie first, fall back to Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = jwtService.extractTokenFromHeader(authHeader);
    }

    if (!accessToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    // Extract refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token is required',
        },
      });
    }

    await authController.logout(accessToken, refreshToken);

    // Clear authentication cookies
    clearAuthCookies(res);

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during logout',
      },
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Issue new access and refresh tokens
 *
 * Request cookies:
 * - refreshToken: string
 *
 * Response (200):
 * {
 *   accessToken: string,
 *   refreshToken: string
 * }
 *
 * Errors:
 * - 401: Invalid or expired refresh token
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    // Extract refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token is required',
        },
      });
    }

    const ipAddress = getIpAddress(req);
    const tokens = await authController.refreshToken(refreshToken, ipAddress);

    // Set new authentication cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user data
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   user: {
 *     id: string,
 *     email: string,
 *     role: string,
 *     emailVerified: boolean,
 *     profile: {
 *       first_name: string,
 *       last_name: string,
 *       phone: string,
 *       bio: string | null,
 *       photo_url: string | null
 *     }
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Extract access token from cookie first, fall back to Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = jwtService.extractTokenFromHeader(authHeader);
    }

    if (!accessToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    const user = await authController.getCurrentUser(accessToken);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    console.error('Get current user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred fetching user data',
      },
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Validate verification token and mark email as verified
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const result = await authController.verifyEmail(req.body);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: error.message,
        },
      });
    }

    console.error('Email verification error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during email verification',
      },
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Generate new verification token and send email
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    // Check rate limiting
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      });
    }

    const rateLimitResult = await rateLimitService.checkRateLimit(
      RateLimitType.EMAIL_VERIFICATION,
      email
    );

    if (!rateLimitResult.allowed) {
      const headers = rateLimitService.getRateLimitHeaders(rateLimitResult, RateLimitType.EMAIL_VERIFICATION);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification requests. Please try again later.',
        },
      });
    }

    const result = await authController.resendVerification(req.body);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message,
        },
      });
    } else if (error.message.includes('already verified')) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: error.message,
        },
      });
    }

    console.error('Resend verification error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred resending verification email',
      },
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and send email
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    // Check rate limiting
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      });
    }

    const rateLimitResult = await rateLimitService.checkRateLimit(
      RateLimitType.PASSWORD_RESET,
      email
    );

    if (!rateLimitResult.allowed) {
      const headers = rateLimitService.getRateLimitHeaders(rateLimitResult, RateLimitType.PASSWORD_RESET);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please try again later.',
        },
      });
    }

    const ipAddress = getIpAddress(req);
    const result = await authController.forgotPassword(req.body, ipAddress);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing password reset request',
      },
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Validate token, update password, and auto-login user
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const ipAddress = getIpAddress(req);
    const result = await authController.resetPassword(req.body, ipAddress);

    // Set authentication cookies
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: error.message,
        },
      });
    } else if (error.message.includes('Password must')) {
      return res.status(422).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: error.message,
        },
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred resetting password',
      },
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 *
 * Request body:
 * {
 *   currentPassword: string,
 *   newPassword: string
 * }
 *
 * Response (200):
 * {
 *   message: string
 * }
 *
 * Errors:
 * - 400: Current password incorrect
 * - 401: Unauthorized
 * - 422: Weak password
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    // Extract access token from cookie first, fall back to Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = jwtService.extractTokenFromHeader(authHeader);
    }

    if (!accessToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    // Verify token and get user ID
    const payload = jwtService.verifyAccessToken(accessToken);
    if (!payload) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    const result = await authController.changePassword(payload.userId, req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: error.message,
        },
      });
    } else if (error.message.includes('Password must') || error.message.includes('must be different')) {
      return res.status(422).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: error.message,
        },
      });
    } else if (error.message.includes('Cannot change password for OAuth')) {
      return res.status(400).json({
        error: {
          code: 'OAUTH_ACCOUNT',
          message: error.message,
        },
      });
    } else if (error.message.includes('required')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Change password error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred changing password',
      },
    });
  }
});

/**
 * GET /api/auth/oauth/:provider
 * Initiate OAuth authentication flow
 *
 * Params:
 * - provider: 'google' | 'facebook' | 'twitter'
 *
 * Response (302):
 * Redirects to OAuth provider authorization URL
 *
 * Errors:
 * - 400: Invalid provider
 */
router.get('/oauth/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as OAuthProvider;

    // Validate provider
    if (!Object.values(OAuthProvider).includes(provider)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PROVIDER',
          message: 'Invalid OAuth provider',
        },
      });
    }

    // Generate OAuth URL and state
    const result = authController.generateOAuthUrl(provider);

    // Store state in session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', JSON.stringify({
      state: result.state,
      provider,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }), {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });

    // Redirect to OAuth provider
    res.redirect(result.authUrl);
  } catch (error: any) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({
      error: {
        code: 'OAUTH_ERROR',
        message: 'Failed to initiate OAuth flow',
      },
    });
  }
});

/**
 * GET /api/auth/oauth/:provider/callback
 * Handle OAuth provider callback
 *
 * Params:
 * - provider: 'google' | 'facebook' | 'twitter'
 *
 * Query params:
 * - code: Authorization code
 * - state: State parameter for CSRF protection
 *
 * Response (302):
 * Redirects to dashboard with tokens in cookies
 *
 * Errors:
 * - 400: Invalid state
 * - 500: OAuth error
 */
router.get('/oauth/:provider/callback', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as OAuthProvider;
    const { code, state } = req.query as { code: string; state: string };

    if (!code || !state) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Code and state parameters are required',
        },
      });
    }

    // Retrieve stored state from cookie
    const storedStateStr = req.cookies?.oauth_state;
    const storedState = storedStateStr ? JSON.parse(storedStateStr) : null;

    // Clear OAuth state cookie
    res.clearCookie('oauth_state', { path: '/' });

    const ipAddress = getIpAddress(req);

    // Handle OAuth callback
    // Note: For new users, role should be passed from frontend
    // For now, we'll default to tenant if not specified
    const role = (req.query.role as UserRole) || UserRole.TENANT;

    const result = await authController.handleOAuthCallback(
      provider,
      code,
      state,
      storedState,
      role,
      ipAddress
    );

    // Set authentication cookies
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    // Redirect to dashboard based on user role
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardPath = `/dashboard/${result.user.role}`;

    // If new user, redirect to profile creation
    if (result.isNewUser) {
      res.redirect(`${frontendUrl}/profile/create?oauth=true`);
    } else {
      res.redirect(`${frontendUrl}${dashboardPath}`);
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE',
          message: 'Invalid or expired state parameter',
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'OAUTH_ERROR',
        message: 'OAuth authentication failed',
      },
    });
  }
});

/**
 * POST /api/users/link-oauth
 * Link OAuth account to existing authenticated user
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   provider: 'google' | 'facebook' | 'twitter',
 *   providerUserId: string,
 *   providerAccessToken: string
 * }
 *
 * Response (200):
 * {
 *   message: 'OAuth account linked successfully'
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 409: OAuth account already linked
 */
router.post('/users/link-oauth', async (req: Request, res: Response) => {
  try {
    // Extract access token from cookie first, fall back to Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      const authHeader = req.headers.authorization;
      accessToken = jwtService.extractTokenFromHeader(authHeader);
    }

    if (!accessToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    // Verify access token and get user ID
    const payload = await jwtService.verifyAccessToken(accessToken);
    if (!payload) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    const { provider, providerUserId } = req.body;

    if (!provider || !providerUserId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Provider and provider user ID are required',
        },
      });
    }

    const result = await authController.linkOAuthAccount(
      payload.userId,
      provider,
      providerUserId
    );

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('already linked')) {
      return res.status(409).json({
        error: {
          code: 'OAUTH_ACCOUNT_ALREADY_LINKED',
          message: 'OAuth account is already linked to another user',
        },
      });
    }

    console.error('Link OAuth error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to link OAuth account',
      },
    });
  }
});

export default router;
