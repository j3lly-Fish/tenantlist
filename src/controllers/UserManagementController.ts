import { UserModel } from '../database/models/User';
import { UserProfileModel } from '../database/models/UserProfile';
import { JwtService } from '../services/auth/JwtService';
import { PhoneValidationService } from '../services/validation/PhoneValidationService';
import { S3PhotoService } from '../services/storage/S3PhotoService';
import { UserRole } from '../types';
import { Pool } from 'pg';

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  photo?: {
    buffer: Buffer;
    mimeType: string;
    size: number;
    originalName?: string;
  };
}

/**
 * Role update data
 */
export interface RoleUpdateData {
  role: UserRole;
}

/**
 * Controller for user management endpoints
 * Handles profile updates and role changes
 */
export class UserManagementController {
  private userModel: UserModel;
  private userProfileModel: UserProfileModel;
  private jwtService: JwtService;
  private phoneValidationService: PhoneValidationService;
  private s3PhotoService: S3PhotoService | null = null;
  private providedS3Service?: S3PhotoService;

  constructor(pool?: Pool, s3PhotoService?: S3PhotoService) {
    this.userModel = new UserModel(pool);
    this.userProfileModel = new UserProfileModel(pool);
    this.jwtService = new JwtService();
    this.phoneValidationService = new PhoneValidationService();
    this.providedS3Service = s3PhotoService;
  }

  private getS3PhotoService(): S3PhotoService {
    if (this.providedS3Service) {
      return this.providedS3Service;
    }
    if (!this.s3PhotoService) {
      this.s3PhotoService = new S3PhotoService();
    }
    return this.s3PhotoService;
  }

  /**
   * Update user profile
   * Handles PATCH /api/users/profile
   *
   * @param accessToken - Access token from Authorization header
   * @param data - Profile update data
   * @returns Updated profile
   * @throws Error if validation fails or user not found
   */
  async updateProfile(accessToken: string, data: ProfileUpdateData) {
    // Verify access token
    const payload = this.jwtService.verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error('Invalid or expired access token');
    }

    // Get user
    const user = await this.userModel.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Build update data
    const updateData: any = {};

    if (data.firstName !== undefined) {
      if (!data.firstName || data.firstName.trim().length === 0) {
        throw new Error('First name cannot be empty');
      }
      if (data.firstName.length > 50) {
        throw new Error('First name must not exceed 50 characters');
      }
      updateData.first_name = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName || data.lastName.trim().length === 0) {
        throw new Error('Last name cannot be empty');
      }
      if (data.lastName.length > 50) {
        throw new Error('Last name must not exceed 50 characters');
      }
      updateData.last_name = data.lastName.trim();
    }

    if (data.bio !== undefined) {
      if (data.bio && data.bio.length > 500) {
        throw new Error('Bio must not exceed 500 characters');
      }
      updateData.bio = data.bio ? data.bio.trim() : null;
    }

    if (data.phone !== undefined) {
      // Validate phone number format
      const formattedPhone = this.phoneValidationService.validateAndFormat(data.phone);
      updateData.phone = formattedPhone;
    }

    if (data.photo) {
      // Upload photo to S3 (lazily initializes S3 service)
      const uploadResult = await this.getS3PhotoService().uploadProfilePhoto(
        data.photo.buffer,
        data.photo.mimeType,
        data.photo.size,
        data.photo.originalName
      );
      updateData.photo_url = uploadResult.photoUrl;
    }

    // Update profile
    const updatedProfile = await this.userProfileModel.update(payload.userId, updateData);

    if (!updatedProfile) {
      throw new Error('Failed to update profile');
    }

    return {
      profile: {
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        bio: updatedProfile.bio,
        phone: updatedProfile.phone,
        photo_url: updatedProfile.photo_url,
      },
    };
  }

  /**
   * Update user role
   * Handles PATCH /api/users/role
   *
   * @param accessToken - Access token from Authorization header
   * @param data - Role update data
   * @returns Updated user data
   * @throws Error if validation fails or user not found
   */
  async updateRole(accessToken: string, data: RoleUpdateData) {
    // Verify access token
    const payload = this.jwtService.verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error('Invalid or expired access token');
    }

    // Validate role
    const validRoles = [UserRole.TENANT, UserRole.LANDLORD, UserRole.BROKER];
    if (!validRoles.includes(data.role)) {
      throw new Error('Role must be one of: tenant, landlord, broker');
    }

    // Get user
    const user = await this.userModel.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if role is already set to this value
    if (user.role === data.role) {
      // No change needed, return current user data
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }

    // Update role
    const updatedUser = await this.userModel.update(payload.userId, {
      role: data.role,
    });

    if (!updatedUser) {
      throw new Error('Failed to update role');
    }

    // Log role change event for audit trail
    console.log('Role change event:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      previousRole: user.role,
      newRole: updatedUser.role,
      timestamp: new Date().toISOString(),
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }
}
