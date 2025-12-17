import { UserProfileModel } from '../database/models/UserProfile';
import { UserModel } from '../database/models/User';
import { UserProfile } from '../types';

/**
 * Controller for user profile operations
 */
export class ProfileController {
  private userProfileModel: UserProfileModel;
  private userModel: UserModel;

  constructor() {
    this.userProfileModel = new UserProfileModel();
    this.userModel = new UserModel();
  }

  /**
   * Handle POST /api/profile/complete
   * Completes user profile after signup
   *
   * @param userId - User ID from authenticated session
   * @param data - Profile data from request body
   * @returns Updated profile data
   * @throws Error if validation fails
   */
  async completeProfile(
    userId: string,
    data: {
      first_name: string;
      last_name: string;
      phone: string;
      bio?: string | null;
      photo_url?: string | null;
    }
  ): Promise<{ profile: UserProfile }> {
    // Validate required fields
    if (!data.first_name || !data.last_name || !data.phone) {
      throw new Error('First name, last name, and phone are required');
    }

    // Validate field lengths
    if (data.first_name.length > 50) {
      throw new Error('First name must be 50 characters or less');
    }

    if (data.last_name.length > 50) {
      throw new Error('Last name must be 50 characters or less');
    }

    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.userProfileModel.findByUserId(userId);

    let profile: UserProfile;

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await this.userProfileModel.update(userId, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        bio: data.bio || null,
        photo_url: data.photo_url || null,
        profile_completed: true,
      });

      if (!updatedProfile) {
        throw new Error('Failed to update profile');
      }

      profile = updatedProfile;
    } else {
      // Create new profile
      profile = await this.userProfileModel.create({
        user_id: userId,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        bio: data.bio || null,
        photo_url: data.photo_url || null,
      });

      // Update profile_completed flag
      await this.userProfileModel.update(userId, {
        profile_completed: true,
      });
    }

    return { profile };
  }

  /**
   * Handle GET /api/profile
   * Get user profile
   *
   * @param userId - User ID from authenticated session
   * @returns User profile data
   * @throws Error if profile not found
   */
  async getProfile(userId: string): Promise<{ profile: UserProfile }> {
    const profile = await this.userProfileModel.findByUserId(userId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return { profile };
  }

  /**
   * Handle PUT /api/profile
   * Update user profile
   *
   * @param userId - User ID from authenticated session
   * @param data - Profile data to update
   * @returns Updated profile data
   * @throws Error if validation fails or profile not found
   */
  async updateProfile(
    userId: string,
    data: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      bio: string | null;
      photo_url: string | null;
    }>
  ): Promise<{ profile: UserProfile }> {
    // Validate field lengths if provided
    if (data.first_name && data.first_name.length > 50) {
      throw new Error('First name must be 50 characters or less');
    }

    if (data.last_name && data.last_name.length > 50) {
      throw new Error('Last name must be 50 characters or less');
    }

    // Check if profile exists
    const existingProfile = await this.userProfileModel.findByUserId(userId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Update profile
    const updatedProfile = await this.userProfileModel.update(userId, data);

    if (!updatedProfile) {
      throw new Error('Failed to update profile');
    }

    return { profile: updatedProfile };
  }
}
