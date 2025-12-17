import { AuthService, SignupData, LoginData, AuthTokens, UserWithProfile } from '../services/auth/AuthService';
import { OAuthService } from '../services/auth/OAuthService';
// import { LoginRateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { OAuthProvider, UserRole } from '../types';

/**
 * Formatted user response for API
 */
interface UserResponse {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    phone: string;
    bio: string | null;
    photo_url: string | null;
    profile_completed: boolean;
  };
}

/**
 * Controller for authentication endpoints
 * Handles HTTP request/response logic for authentication operations
 */
export class AuthController {
  private authService: AuthService;
  private oauthService: OAuthService;
  // private loginRateLimitMiddleware: LoginRateLimitMiddleware;

  constructor(authService?: AuthService, oauthService?: OAuthService) {
    this.authService = authService || new AuthService();
    this.oauthService = oauthService || new OAuthService();
    // this.loginRateLimitMiddleware = new LoginRateLimitMiddleware();
  }

  /**
   * Format user response for API
   */
  private formatUserResponse(user: UserWithProfile): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
      profile: user.profile ? {
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        phone: user.profile.phone,
        bio: user.profile.bio,
        photo_url: user.profile.photo_url,
        profile_completed: user.profile.profile_completed,
      } : undefined,
    };
  }

  /**
   * Handle POST /api/auth/signup
   * Creates a new user account
   * Profile fields are now optional and can be completed later
   *
   * @param data - Signup data from request body
   * @param ipAddress - Client IP address
   * @returns User data and authentication tokens
   * @throws Error if validation fails or email already exists
   */
  async signup(
    data: SignupData,
    ipAddress?: string
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Validate required fields (only email, password, role)
    if (!data.email || !data.password || !data.role) {
      throw new Error('Email, password, and role are required');
    }

    // Call auth service
    const result = await this.authService.signup(data, ipAddress);

    return {
      user: this.formatUserResponse(result.user),
      tokens: result.tokens,
    };
  }

  /**
   * Handle POST /api/auth/login
   * Authenticates user with email and password
   *
   * @param data - Login data from request body
   * @param ipAddress - Client IP address
   * @returns User data and authentication tokens
   * @throws Error if credentials are invalid or rate limit exceeded
   */
  async login(
    data: LoginData,
    ipAddress?: string
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Validate required fields
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    // Call auth service
    const result = await this.authService.login(data, ipAddress);

    return {
      user: this.formatUserResponse(result.user),
      tokens: result.tokens,
    };
  }

  /**
   * Handle POST /api/auth/logout
   * Revokes user's refresh token and blacklists access token
   *
   * @param accessToken - Access token from Authorization header
   * @param refreshToken - Refresh token from cookie
   * @returns Success message
   * @throws Error if tokens are invalid
   */
  async logout(accessToken: string, refreshToken: string): Promise<{ message: string }> {
    if (!accessToken || !refreshToken) {
      throw new Error('Access token and refresh token are required');
    }

    await this.authService.logout(accessToken, refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Handle POST /api/auth/refresh-token
   * Issues new access and refresh tokens
   *
   * @param refreshToken - Refresh token from cookie
   * @param ipAddress - Client IP address
   * @returns New authentication tokens
   * @throws Error if refresh token is invalid or expired
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const tokens = await this.authService.refreshToken(refreshToken, ipAddress);

    return tokens;
  }

  /**
   * Handle GET /api/auth/me
   * Returns current authenticated user with profile
   *
   * @param accessToken - Access token from Authorization header
   * @returns User data with profile
   * @throws Error if token is invalid or user not found
   */
  async getCurrentUser(accessToken: string): Promise<UserResponse> {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    // Verify access token
    const payload = await this.authService.verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error('Invalid or expired access token');
    }

    // Get user with profile
    const user = await this.authService.getCurrentUser(payload.userId);

    return this.formatUserResponse(user);
  }

  /**
   * Handle POST /api/auth/verify-email
   * Validates verification token and marks email as verified
   *
   * @param data - Request body containing token
   * @returns Success message
   * @throws Error if token is invalid or expired
   */
  async verifyEmail(data: { token: string }): Promise<{ message: string }> {
    if (!data.token) {
      throw new Error('Verification token is required');
    }

    await this.authService.verifyEmail(data.token);

    return {
      message: 'Email verified successfully',
    };
  }

  /**
   * Handle POST /api/auth/resend-verification
   * Generates new verification token and sends email
   *
   * @param data - Request body containing email
   * @returns Success message
   * @throws Error if user not found or email already verified
   */
  async resendVerification(data: { email: string }): Promise<{ message: string }> {
    if (!data.email) {
      throw new Error('Email is required');
    }

    await this.authService.resendVerification(data.email);

    return {
      message: 'Verification email sent',
    };
  }

  /**
   * Handle POST /api/auth/forgot-password
   * Generates password reset token and sends email
   *
   * @param data - Request body containing email
   * @param ipAddress - Client IP address
   * @returns Generic success message (for security)
   * @throws Error if rate limit exceeded
   */
  async forgotPassword(data: { email: string }, ipAddress?: string): Promise<{ message: string }> {
    if (!data.email) {
      throw new Error('Email is required');
    }

    await this.authService.forgotPassword(data.email, ipAddress);

    return {
      message: 'Password reset email sent if account exists',
    };
  }

  /**
   * Handle POST /api/auth/reset-password
   * Validates token, updates password, and auto-logs in user
   *
   * @param data - Request body containing token and new password
   * @param ipAddress - Client IP address
   * @returns Success message and authentication tokens
   * @throws Error if token is invalid or password is weak
   */
  async resetPassword(
    data: { token: string; newPassword: string },
    ipAddress?: string
  ): Promise<{ message: string; tokens: AuthTokens }> {
    if (!data.token || !data.newPassword) {
      throw new Error('Token and new password are required');
    }

    const tokens = await this.authService.resetPassword(data.token, data.newPassword, ipAddress);

    return {
      message: 'Password reset successful',
      tokens,
    };
  }

  /**
   * Handle POST /api/auth/change-password
   * Changes password for authenticated user
   *
   * @param userId - User ID from authenticated session
   * @param data - Request body containing current and new password
   * @returns Success message
   * @throws Error if current password is incorrect or new password is weak
   */
  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<{ message: string }> {
    if (!data.currentPassword || !data.newPassword) {
      throw new Error('Current password and new password are required');
    }

    await this.authService.changePassword(userId, data.currentPassword, data.newPassword);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Handle GET /api/auth/oauth/:provider
   * Initiates OAuth authentication flow
   *
   * @param provider - OAuth provider (google | facebook | twitter)
   * @returns OAuth state and authorization URL
   */
  generateOAuthUrl(provider: OAuthProvider): { state: string; authUrl: string } {
    // Generate state parameter
    const oauthState = this.oauthService.generateState(provider);

    // Build authorization URL
    const authUrl = this.oauthService.buildAuthorizationUrl(provider, oauthState.state);

    return {
      state: oauthState.state,
      authUrl,
    };
  }

  /**
   * Handle GET /api/auth/oauth/:provider/callback
   * Processes OAuth callback and authenticates user
   *
   * @param provider - OAuth provider
   * @param code - Authorization code from OAuth provider
   * @param state - State parameter for CSRF validation
   * @param storedState - Stored state from session
   * @param role - User role (for new signups)
   * @param ipAddress - Client IP address
   * @returns User data and authentication tokens
   * @throws Error if state validation fails or OAuth error occurs
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string,
    storedState: any,
    role?: UserRole,
    ipAddress?: string
  ): Promise<{ user: any; tokens: AuthTokens; isNewUser: boolean }> {
    // Validate state parameter
    const isValidState = this.oauthService.validateState(state, storedState);
    if (!isValidState) {
      throw new Error('Invalid or expired state parameter');
    }

    // Exchange authorization code for access token
    const accessToken = await this.oauthService.exchangeCodeForToken(provider, code);

    // Fetch user profile from OAuth provider
    const profile = await this.oauthService.fetchUserProfile(provider, accessToken);

    // Handle OAuth login/signup
    const result = await this.oauthService.handleOAuthLogin(profile, role, ipAddress);

    return {
      user: result.user,
      tokens: result.tokens,
      isNewUser: result.isNewUser,
    };
  }

  /**
   * Handle POST /api/users/link-oauth
   * Links OAuth account to existing authenticated user
   *
   * @param userId - User ID from authenticated session
   * @param provider - OAuth provider
   * @param providerUserId - Provider user ID
   * @returns Success message
   * @throws Error if OAuth account already linked to another user
   */
  async linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<{ message: string }> {
    if (!userId || !provider || !providerUserId) {
      throw new Error('User ID, provider, and provider user ID are required');
    }

    await this.oauthService.linkOAuthAccount(userId, provider, providerUserId);

    return {
      message: 'OAuth account linked successfully',
    };
  }
}
