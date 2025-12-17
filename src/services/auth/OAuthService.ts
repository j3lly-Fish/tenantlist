import { Pool } from 'pg';
import crypto from 'crypto';
import pool from '../../config/database';
import { UserModel } from '../../database/models/User';
import { OAuthAccountModel } from '../../database/models/OAuthAccount';
import { UserProfileModel } from '../../database/models/UserProfile';
import { JwtService } from './JwtService';
import { RefreshTokenService } from './RefreshTokenService';
import { OAuthProvider, UserRole, User } from '../../types';

/**
 * OAuth profile data from provider
 */
export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

/**
 * OAuth state data stored in session
 */
export interface OAuthState {
  state: string;
  provider: OAuthProvider;
  expiresAt: number;
}

/**
 * OAuth tokens returned to client
 */
export interface OAuthAuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  isNewUser: boolean;
}

/**
 * Service for handling OAuth authentication operations
 */
export class OAuthService {
  private userModel: UserModel;
  private oauthAccountModel: OAuthAccountModel;
  private userProfileModel: UserProfileModel;
  private jwtService: JwtService;
  private refreshTokenService: RefreshTokenService;

  constructor(customPool?: Pool) {
    this.userModel = new UserModel(customPool);
    this.oauthAccountModel = new OAuthAccountModel(customPool);
    this.userProfileModel = new UserProfileModel(customPool);
    this.jwtService = new JwtService();
    this.refreshTokenService = new RefreshTokenService(customPool);
  }

  /**
   * Generate OAuth state parameter for CSRF protection
   *
   * @param provider - OAuth provider
   * @returns State string and expiration timestamp
   */
  generateState(provider: OAuthProvider): OAuthState {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    return {
      state,
      provider,
      expiresAt,
    };
  }

  /**
   * Validate OAuth state parameter
   *
   * @param state - State parameter from OAuth callback
   * @param storedState - Stored state from session
   * @returns True if valid, false otherwise
   */
  validateState(state: string, storedState: OAuthState | null): boolean {
    if (!storedState) {
      return false;
    }

    // Check if state matches
    if (state !== storedState.state) {
      return false;
    }

    // Check if state is expired
    if (Date.now() > storedState.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Build OAuth authorization URL
   *
   * @param provider - OAuth provider
   * @param state - State parameter for CSRF protection
   * @returns Authorization URL
   */
  buildAuthorizationUrl(provider: OAuthProvider, state: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUri = `${frontendUrl}/api/auth/oauth/${provider}/callback`;

    switch (provider) {
      case OAuthProvider.GOOGLE:
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleScopes = [
          'openid',
          'profile',
          'email',
        ].join(' ');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(googleScopes)}&state=${state}`;

      case OAuthProvider.FACEBOOK:
        const facebookAppId = process.env.FACEBOOK_APP_ID;
        const facebookScopes = ['email', 'public_profile'].join(',');
        return `https://www.facebook.com/v12.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${facebookScopes}&state=${state}`;

      case OAuthProvider.TWITTER:
        const twitterClientId = process.env.TWITTER_CLIENT_ID;
        const twitterScopes = ['tweet.read', 'users.read'].join(' ');
        return `https://twitter.com/i/oauth2/authorize?client_id=${twitterClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(twitterScopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

      default:
        throw new Error('Unsupported OAuth provider');
    }
  }

  /**
   * Exchange authorization code for access token
   *
   * @param provider - OAuth provider
   * @param code - Authorization code from callback
   * @returns Access token
   */
  async exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUri = `${frontendUrl}/api/auth/oauth/${provider}/callback`;

    let tokenUrl: string;
    let clientId: string;
    let clientSecret: string;
    let body: any;

    switch (provider) {
      case OAuthProvider.GOOGLE:
        tokenUrl = 'https://oauth2.googleapis.com/token';
        clientId = process.env.GOOGLE_CLIENT_ID || '';
        clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        body = {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        };
        break;

      case OAuthProvider.FACEBOOK:
        tokenUrl = 'https://graph.facebook.com/v12.0/oauth/access_token';
        clientId = process.env.FACEBOOK_APP_ID || '';
        clientSecret = process.env.FACEBOOK_APP_SECRET || '';
        body = {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        };
        break;

      case OAuthProvider.TWITTER:
        tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        clientId = process.env.TWITTER_CLIENT_ID || '';
        clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
        body = {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: 'challenge',
        };
        break;

      default:
        throw new Error('Unsupported OAuth provider');
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  /**
   * Fetch user profile from OAuth provider
   *
   * @param provider - OAuth provider
   * @param accessToken - OAuth access token
   * @returns User profile data
   */
  async fetchUserProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
    let profileUrl: string;

    switch (provider) {
      case OAuthProvider.GOOGLE:
        profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
        break;

      case OAuthProvider.FACEBOOK:
        profileUrl = 'https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture';
        break;

      case OAuthProvider.TWITTER:
        profileUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url';
        break;

      default:
        throw new Error('Unsupported OAuth provider');
    }

    const response = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data: any = await response.json();

    // Parse provider-specific response
    let profile: OAuthProfile;

    switch (provider) {
      case OAuthProvider.GOOGLE:
        profile = {
          provider,
          providerId: data.id,
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          photoUrl: data.picture,
        };
        break;

      case OAuthProvider.FACEBOOK:
        profile = {
          provider,
          providerId: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          photoUrl: data.picture?.data?.url,
        };
        break;

      case OAuthProvider.TWITTER:
        profile = {
          provider,
          providerId: data.data.id,
          email: data.data.email || '',
          firstName: data.data.name?.split(' ')[0],
          lastName: data.data.name?.split(' ').slice(1).join(' '),
          photoUrl: data.data.profile_image_url,
        };
        break;

      default:
        throw new Error('Unsupported OAuth provider');
    }

    return profile;
  }

  /**
   * Handle OAuth login/signup flow
   *
   * @param profile - OAuth profile data
   * @param role - User role (for new accounts)
   * @param ipAddress - Client IP address
   * @returns User and authentication tokens
   */
  async handleOAuthLogin(
    profile: OAuthProfile,
    role?: UserRole,
    ipAddress?: string
  ): Promise<OAuthAuthResult> {
    // Check if OAuth account already exists
    const existingOAuthAccount = await this.oauthAccountModel.findByProvider(
      profile.provider,
      profile.providerId
    );

    if (existingOAuthAccount) {
      // Existing OAuth account - log in user
      const user = await this.userModel.findById(existingOAuthAccount.user_id);
      if (!user) {
        throw new Error('User not found for OAuth account');
      }

      // Update last login
      await this.userModel.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
      const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
        user.id,
        true,
        ipAddress
      );

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
        isNewUser: false,
      };
    }

    // Check if user with email already exists
    const existingUser = await this.userModel.findByEmail(profile.email);

    if (existingUser) {
      // Email exists - link OAuth account to existing user
      await this.oauthAccountModel.create({
        user_id: existingUser.id,
        provider: profile.provider,
        provider_user_id: profile.providerId,
      });

      // Update last login
      await this.userModel.updateLastLogin(existingUser.id);

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(
        existingUser.id,
        existingUser.email,
        existingUser.role
      );
      const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
        existingUser.id,
        true,
        ipAddress
      );

      return {
        user: existingUser,
        tokens: {
          accessToken,
          refreshToken,
        },
        isNewUser: false,
      };
    }

    // New user - create account
    if (!role) {
      throw new Error('Role is required for new OAuth signup');
    }

    // Create user with email verified (OAuth providers verify email)
    const newUser = await this.userModel.create({
      email: profile.email,
      password_hash: null, // OAuth-only account
      role,
      email_verified: true,
    });

    // Create OAuth account link
    await this.oauthAccountModel.create({
      user_id: newUser.id,
      provider: profile.provider,
      provider_user_id: profile.providerId,
    });

    // Create basic profile if name is available
    if (profile.firstName || profile.lastName) {
      await this.userProfileModel.create({
        user_id: newUser.id,
        first_name: profile.firstName || '',
        last_name: profile.lastName || '',
        phone: '', // Will be filled later
        bio: null,
        photo_url: profile.photoUrl || null,
      });
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(newUser.id, newUser.email, newUser.role);
    const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
      newUser.id,
      true,
      ipAddress
    );

    return {
      user: newUser,
      tokens: {
        accessToken,
        refreshToken,
      },
      isNewUser: true,
    };
  }

  /**
   * Link OAuth account to existing authenticated user
   *
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerUserId - Provider user ID
   * @returns Success status
   */
  async linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<boolean> {
    // Check if OAuth account is already linked to another user
    const existingOAuthAccount = await this.oauthAccountModel.findByProvider(
      provider,
      providerUserId
    );

    if (existingOAuthAccount && existingOAuthAccount.user_id !== userId) {
      throw new Error('OAuth account already linked to another user');
    }

    if (existingOAuthAccount && existingOAuthAccount.user_id === userId) {
      // Already linked to this user
      return true;
    }

    // Create OAuth account link
    await this.oauthAccountModel.create({
      user_id: userId,
      provider,
      provider_user_id: providerUserId,
    });

    return true;
  }
}
