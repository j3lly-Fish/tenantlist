import { Pool } from 'pg';
import { UserModel } from '../../database/models/User';
import { UserProfileModel } from '../../database/models/UserProfile';
import { OAuthAccountModel } from '../../database/models/OAuthAccount';
import { RefreshTokenModel } from '../../database/models/RefreshToken';
import { PasswordResetTokenModel } from '../../database/models/PasswordResetToken';
import { UserRole, OAuthProvider } from '../../types';
import { MigrationRunner } from '../../database/migrations/migration-runner';
import { migrations } from '../../database/migrations';

// Test database configuration
const testPool = new Pool({
  host: process.env.TEST_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.TEST_DATABASE_PORT || '5432', 10),
  database: process.env.TEST_DATABASE_NAME || 'zyx_test',
  user: process.env.TEST_DATABASE_USER || 'postgres',
  password: process.env.TEST_DATABASE_PASSWORD || 'postgres',
});

describe('Database Models', () => {
  let userModel: UserModel;
  let userProfileModel: UserProfileModel;
  let oauthAccountModel: OAuthAccountModel;
  let refreshTokenModel: RefreshTokenModel;
  let passwordResetTokenModel: PasswordResetTokenModel;

  beforeAll(async () => {
    // Run migrations on test database
    const migrationRunner = new MigrationRunner(testPool);
    await migrationRunner.createMigrationsTable();
    await migrationRunner.runMigrations(migrations);

    // Initialize models
    userModel = new UserModel(testPool);
    userProfileModel = new UserProfileModel(testPool);
    oauthAccountModel = new OAuthAccountModel(testPool);
    refreshTokenModel = new RefreshTokenModel(testPool);
    passwordResetTokenModel = new PasswordResetTokenModel(testPool);
  });

  afterAll(async () => {
    // Clean up test database
    await testPool.query('DROP SCHEMA public CASCADE');
    await testPool.query('CREATE SCHEMA public');
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up data before each test - delete in reverse order of foreign key dependencies
    await testPool.query('DELETE FROM refresh_tokens');
    await testPool.query('DELETE FROM password_reset_tokens');
    await testPool.query('DELETE FROM oauth_accounts');
    await testPool.query('DELETE FROM user_profiles');
    await testPool.query('DELETE FROM mfa_settings');
    await testPool.query('DELETE FROM users');
  });

  describe('Test 1: User model creation with valid email/password', () => {
    it('should create a user with valid email and password', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: UserRole.TENANT,
      };

      const user = await userModel.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).toBe(userData.password_hash);
      expect(user.role).toBe(UserRole.TENANT);
      expect(user.email_verified).toBe(false);
      expect(user.is_active).toBe(true);
      expect(user.created_at).toBeDefined();
    });

    it('should create a user without password for OAuth-only accounts', async () => {
      const userData = {
        email: 'oauth@example.com',
        password_hash: null,
        role: UserRole.LANDLORD,
        email_verified: true,
      };

      const user = await userModel.create(userData);

      expect(user).toBeDefined();
      expect(user.password_hash).toBeNull();
      expect(user.email_verified).toBe(true);
    });
  });

  describe('Test 2: Role enum validation (tenant/landlord/broker)', () => {
    it('should accept tenant role', async () => {
      const user = await userModel.create({
        email: 'tenant@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      expect(user.role).toBe(UserRole.TENANT);
    });

    it('should accept landlord role', async () => {
      const user = await userModel.create({
        email: 'landlord@example.com',
        password_hash: 'hash',
        role: UserRole.LANDLORD,
      });

      expect(user.role).toBe(UserRole.LANDLORD);
    });

    it('should accept broker role', async () => {
      const user = await userModel.create({
        email: 'broker@example.com',
        password_hash: 'hash',
        role: UserRole.BROKER,
      });

      expect(user.role).toBe(UserRole.BROKER);
    });
  });

  describe('Test 3: User profile association (one-to-one relationship)', () => {
    it('should create a profile linked to a user', async () => {
      const user = await userModel.create({
        email: 'profile@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const profile = await userProfileModel.create({
        user_id: user.id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
      });

      expect(profile).toBeDefined();
      expect(profile.user_id).toBe(user.id);
      expect(profile.first_name).toBe('John');
      expect(profile.last_name).toBe('Doe');

      const foundProfile = await userProfileModel.findByUserId(user.id);
      expect(foundProfile).toBeDefined();
      expect(foundProfile?.id).toBe(profile.id);
    });

    it('should cascade delete profile when user is deleted', async () => {
      const user = await userModel.create({
        email: 'cascade@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      await userProfileModel.create({
        user_id: user.id,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890',
      });

      await userModel.delete(user.id);

      const profile = await userProfileModel.findByUserId(user.id);
      expect(profile).toBeNull();
    });
  });

  describe('Test 4: OAuth account linking (one-to-many relationship)', () => {
    it('should allow multiple OAuth providers per user', async () => {
      const user = await userModel.create({
        email: 'oauth-multi@example.com',
        password_hash: null,
        role: UserRole.TENANT,
        email_verified: true,
      });

      const googleAccount = await oauthAccountModel.create({
        user_id: user.id,
        provider: OAuthProvider.GOOGLE,
        provider_user_id: 'google-123',
      });

      const facebookAccount = await oauthAccountModel.create({
        user_id: user.id,
        provider: OAuthProvider.FACEBOOK,
        provider_user_id: 'facebook-456',
      });

      const accounts = await oauthAccountModel.findByUserId(user.id);
      expect(accounts).toHaveLength(2);
      expect(accounts.map(a => a.provider)).toContain(OAuthProvider.GOOGLE);
      expect(accounts.map(a => a.provider)).toContain(OAuthProvider.FACEBOOK);
    });

    it('should prevent duplicate provider accounts', async () => {
      const user = await userModel.create({
        email: 'oauth-dup@example.com',
        password_hash: null,
        role: UserRole.TENANT,
      });

      await oauthAccountModel.create({
        user_id: user.id,
        provider: OAuthProvider.GOOGLE,
        provider_user_id: 'google-unique',
      });

      // Attempting to create duplicate should fail
      await expect(
        oauthAccountModel.create({
          user_id: user.id,
          provider: OAuthProvider.GOOGLE,
          provider_user_id: 'google-unique',
        })
      ).rejects.toThrow();
    });
  });

  describe('Test 5: Refresh token expiration logic', () => {
    it('should identify valid unexpired tokens', async () => {
      const user = await userModel.create({
        email: 'token@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const token = await refreshTokenModel.create({
        user_id: user.id,
        token_hash: 'validtokenhash',
        expires_at: futureDate,
      });

      const isValid = await refreshTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(true);
    });

    it('should identify expired tokens as invalid', async () => {
      const user = await userModel.create({
        email: 'token-expired@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const token = await refreshTokenModel.create({
        user_id: user.id,
        token_hash: 'expiredtokenhash',
        expires_at: pastDate,
      });

      const isValid = await refreshTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(false);
    });

    it('should identify revoked tokens as invalid', async () => {
      const user = await userModel.create({
        email: 'token-revoked@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const token = await refreshTokenModel.create({
        user_id: user.id,
        token_hash: 'revokedtokenhash',
        expires_at: futureDate,
      });

      await refreshTokenModel.revoke(token.token_hash);

      const isValid = await refreshTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Test 6: Password reset token invalidation after use', () => {
    it('should mark valid unused tokens as valid', async () => {
      const user = await userModel.create({
        email: 'reset@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const token = await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: 'resettoken123',
        expires_at: futureDate,
      });

      const isValid = await passwordResetTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(true);
    });

    it('should invalidate token after being marked as used', async () => {
      const user = await userModel.create({
        email: 'reset-used@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const token = await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: 'usedtoken456',
        expires_at: futureDate,
      });

      await passwordResetTokenModel.markAsUsed(token.token_hash);

      const isValid = await passwordResetTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(false);
    });

    it('should invalidate expired reset tokens', async () => {
      const user = await userModel.create({
        email: 'reset-expired@example.com',
        password_hash: 'hash',
        role: UserRole.TENANT,
      });

      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);

      const token = await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: 'expiredresettoken',
        expires_at: pastDate,
      });

      const isValid = await passwordResetTokenModel.isValid(token.token_hash);
      expect(isValid).toBe(false);
    });
  });
});
