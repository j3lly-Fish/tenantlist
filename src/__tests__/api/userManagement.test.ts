import { Pool } from 'pg';
import pool from '../../config/database';
import { UserManagementController } from '../../controllers/UserManagementController';
import { AuthService } from '../../services/auth/AuthService';
import { UserModel } from '../../database/models/User';
import { UserProfileModel } from '../../database/models/UserProfile';
import { PhoneValidationService } from '../../services/validation/PhoneValidationService';
import { S3PhotoService } from '../../services/storage/S3PhotoService';
import { UserRole } from '../../types';

/**
 * User Management Tests
 * Tests for Task Group 7: User Management & Profile Endpoints
 *
 * Test Coverage:
 * - PATCH /api/users/profile updates profile fields
 * - PATCH /api/users/role changes user role
 * - Profile photo upload to S3
 * - Phone number validation (E.164 format)
 */

// Mock S3PhotoService to avoid actual S3 calls
class MockS3PhotoService {
  async uploadProfilePhoto(
    buffer: Buffer,
    mimeType: string,
    size: number,
    originalName?: string
  ) {
    return {
      photoUrl: 'https://example-bucket.s3.us-east-1.amazonaws.com/profile-photos/test-photo.jpg',
      fileName: 'profile-photos/test-photo.jpg',
    };
  }
}

describe('User Management Endpoints', () => {
  let userManagementController: UserManagementController;
  let authService: AuthService;
  let userModel: UserModel;
  let userProfileModel: UserProfileModel;
  let phoneValidationService: PhoneValidationService;
  let testUserId: string;
  let testAccessToken: string;

  beforeAll(async () => {
    // Initialize services
    authService = new AuthService(pool);
    userModel = new UserModel(pool);
    userProfileModel = new UserProfileModel(pool);
    phoneValidationService = new PhoneValidationService();

    // Use mock S3 service to avoid actual S3 calls
    const mockS3Service = new MockS3PhotoService() as any;
    userManagementController = new UserManagementController(pool, mockS3Service);
  });

  beforeEach(async () => {
    // Create a test user for each test
    const signupData = {
      email: 'testuser@example.com',
      password: 'TestPass123!',
      role: UserRole.TENANT,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+12125551234',
      bio: 'Test bio',
    };

    const result = await authService.signup(signupData, '192.168.1.1');
    testUserId = result.user.id;
    testAccessToken = result.tokens.accessToken;
  });

  afterEach(async () => {
    // Clean up after each test
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('PATCH /api/users/profile', () => {
    it('should update first and last name', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const result = await userManagementController.updateProfile(
        testAccessToken,
        updateData
      );

      expect(result.profile.first_name).toBe('Jane');
      expect(result.profile.last_name).toBe('Smith');

      // Verify in database
      const profile = await userProfileModel.findByUserId(testUserId);
      expect(profile?.first_name).toBe('Jane');
      expect(profile?.last_name).toBe('Smith');
    });

    it('should update bio', async () => {
      const updateData = {
        bio: 'Updated bio text for the profile',
      };

      const result = await userManagementController.updateProfile(
        testAccessToken,
        updateData
      );

      expect(result.profile.bio).toBe('Updated bio text for the profile');

      // Verify in database
      const profile = await userProfileModel.findByUserId(testUserId);
      expect(profile?.bio).toBe('Updated bio text for the profile');
    });

    it('should update phone number with E.164 validation', async () => {
      const updateData = {
        phone: '+14155552345',
      };

      const result = await userManagementController.updateProfile(
        testAccessToken,
        updateData
      );

      expect(result.profile.phone).toBe('+14155552345');

      // Verify in database
      const profile = await userProfileModel.findByUserId(testUserId);
      expect(profile?.phone).toBe('+14155552345');
    });

    it('should reject invalid phone number format', async () => {
      const updateData = {
        phone: '123-456-7890', // Invalid E.164 format
      };

      await expect(
        userManagementController.updateProfile(testAccessToken, updateData)
      ).rejects.toThrow('Phone number must be in E.164 format');
    });

    it('should upload and update profile photo', async () => {
      const photoBuffer = Buffer.from('fake-image-data');
      const updateData = {
        photo: {
          buffer: photoBuffer,
          mimeType: 'image/jpeg',
          size: photoBuffer.length,
          originalName: 'profile.jpg',
        },
      };

      const result = await userManagementController.updateProfile(
        testAccessToken,
        updateData
      );

      expect(result.profile.photo_url).toBeTruthy();
      expect(result.profile.photo_url).toContain('s3');

      // Verify in database
      const profile = await userProfileModel.findByUserId(testUserId);
      expect(profile?.photo_url).toBeTruthy();
    });

    it('should reject empty first name', async () => {
      const updateData = {
        firstName: '',
      };

      await expect(
        userManagementController.updateProfile(testAccessToken, updateData)
      ).rejects.toThrow('First name cannot be empty');
    });

    it('should reject bio longer than 500 characters', async () => {
      const updateData = {
        bio: 'a'.repeat(501),
      };

      await expect(
        userManagementController.updateProfile(testAccessToken, updateData)
      ).rejects.toThrow('Bio must not exceed 500 characters');
    });

    it('should reject invalid access token', async () => {
      const updateData = {
        firstName: 'Jane',
      };

      await expect(
        userManagementController.updateProfile('invalid-token', updateData)
      ).rejects.toThrow('Invalid or expired access token');
    });
  });

  describe('PATCH /api/users/role', () => {
    it('should change user role from tenant to landlord', async () => {
      const updateData = {
        role: UserRole.LANDLORD,
      };

      const result = await userManagementController.updateRole(
        testAccessToken,
        updateData
      );

      expect(result.user.role).toBe(UserRole.LANDLORD);

      // Verify in database
      const user = await userModel.findById(testUserId);
      expect(user?.role).toBe(UserRole.LANDLORD);
    });

    it('should change user role to broker', async () => {
      const updateData = {
        role: UserRole.BROKER,
      };

      const result = await userManagementController.updateRole(
        testAccessToken,
        updateData
      );

      expect(result.user.role).toBe(UserRole.BROKER);

      // Verify in database
      const user = await userModel.findById(testUserId);
      expect(user?.role).toBe(UserRole.BROKER);
    });

    it('should reject invalid role', async () => {
      const updateData = {
        role: 'invalid-role' as UserRole,
      };

      await expect(
        userManagementController.updateRole(testAccessToken, updateData)
      ).rejects.toThrow('Role must be one of: tenant, landlord, broker');
    });

    it('should return same data if role is unchanged', async () => {
      const updateData = {
        role: UserRole.TENANT, // Same as current role
      };

      const result = await userManagementController.updateRole(
        testAccessToken,
        updateData
      );

      expect(result.user.role).toBe(UserRole.TENANT);
    });

    it('should reject invalid access token', async () => {
      const updateData = {
        role: UserRole.LANDLORD,
      };

      await expect(
        userManagementController.updateRole('invalid-token', updateData)
      ).rejects.toThrow('Invalid or expired access token');
    });
  });

  describe('Phone Number Validation Service', () => {
    it('should validate correct E.164 format', () => {
      const phoneNumbers = [
        '+12125551234',
        '+14155552345',
        '+442071234567',
      ];

      phoneNumbers.forEach((phone) => {
        const isValid = phoneValidationService.isValidPhoneNumber(phone);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid phone number formats', () => {
      const phoneNumbers = [
        '123-456-7890',
        '(212) 555-1234',
        '12125551234', // Missing +
        'not-a-phone',
      ];

      phoneNumbers.forEach((phone) => {
        const isValid = phoneValidationService.isValidPhoneNumber(phone);
        expect(isValid).toBe(false);
      });
    });

    it('should format phone number to E.164', () => {
      const formatted = phoneValidationService.formatPhoneNumber('+1 (212) 555-1234');
      expect(formatted).toBe('+12125551234');
    });
  });
});
