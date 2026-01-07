import { BusinessProfileService, BusinessProfileWithDetails } from '../services/BusinessProfileService';
import { BusinessStatsService } from '../services/BusinessStatsService';
import { BusinessProfile } from '../database/models/BusinessProfile';
import { BusinessTeamMember } from '../database/models/BusinessTeamMember';
import { BusinessProfileStats } from '../database/models/BusinessProfileStats';

/**
 * Response type for business profile search
 */
export interface BusinessProfileSearchResult {
  profiles: BusinessProfileWithDetails[];
  total: number;
}

/**
 * Controller for business profile endpoints
 * Handles HTTP request/response logic for business profile operations
 * Follows pattern from BrokerDashboardController
 */
export class BusinessProfileController {
  private businessProfileService: BusinessProfileService;
  private businessStatsService: BusinessStatsService;

  constructor(
    businessProfileService?: BusinessProfileService,
    businessStatsService?: BusinessStatsService
  ) {
    this.businessProfileService = businessProfileService || new BusinessProfileService();
    this.businessStatsService = businessStatsService || new BusinessStatsService();
  }

  /**
   * Handle POST /api/broker/business-profiles
   * Create a new brokerage profile
   *
   * @param userId - ID of authenticated user
   * @param profileData - Business profile data
   * @returns Created business profile with stats
   */
  async createBusinessProfile(
    userId: string,
    profileData: {
      company_name: string;
      logo_url?: string;
      cover_image_url?: string;
      established_year?: number;
      location_city?: string;
      location_state?: string;
      about?: string;
      website_url?: string;
      instagram_url?: string;
      linkedin_url?: string;
    }
  ): Promise<BusinessProfileWithDetails> {
    // Validate required fields
    if (!profileData.company_name) {
      throw new Error('company_name is required');
    }

    // Validate established_year if provided
    if (profileData.established_year) {
      const currentYear = new Date().getFullYear();
      if (profileData.established_year < 1800 || profileData.established_year > currentYear) {
        throw new Error(`established_year must be between 1800 and ${currentYear}`);
      }
    }

    return await this.businessProfileService.create(userId, profileData);
  }

  /**
   * Handle GET /api/broker/business-profiles
   * List user's business profiles with stats
   *
   * @param userId - ID of authenticated user
   * @returns Array of business profiles with stats
   */
  async getBusinessProfiles(userId: string): Promise<BusinessProfileSearchResult> {
    const profiles = await this.businessProfileService.getByUser(userId);

    return {
      profiles,
      total: profiles.length,
    };
  }

  /**
   * Handle GET /api/broker/business-profiles/:id
   * Get specific profile with team members
   *
   * @param profileId - Business profile ID
   * @param userId - ID of authenticated user (for authorization)
   * @returns Business profile with team members array
   * @throws Error if profile not found or unauthorized
   */
  async getBusinessProfileById(
    profileId: string,
    userId: string
  ): Promise<BusinessProfileWithDetails> {
    const profile = await this.businessProfileService.getById(profileId);

    if (!profile) {
      throw new Error('Business profile not found');
    }

    // Verify user owns this profile
    if (profile.created_by_user_id !== userId) {
      throw new Error('Unauthorized to access this business profile');
    }

    return profile;
  }

  /**
   * Handle PUT /api/broker/business-profiles/:id
   * Update profile fields
   *
   * @param profileId - Business profile ID
   * @param userId - ID of authenticated user (for authorization)
   * @param data - Partial business profile data to update
   * @returns Updated business profile
   * @throws Error if profile not found or unauthorized
   */
  async updateBusinessProfile(
    profileId: string,
    userId: string,
    data: Partial<BusinessProfile>
  ): Promise<BusinessProfile> {
    // First verify ownership
    const existing = await this.businessProfileService.getById(profileId);
    if (!existing) {
      throw new Error('Business profile not found');
    }

    if (existing.created_by_user_id !== userId) {
      throw new Error('Unauthorized to update this business profile');
    }

    // Validate established_year if being updated
    if (data.established_year) {
      const currentYear = new Date().getFullYear();
      if (data.established_year < 1800 || data.established_year > currentYear) {
        throw new Error(`established_year must be between 1800 and ${currentYear}`);
      }
    }

    const updated = await this.businessProfileService.update(profileId, data);
    if (!updated) {
      throw new Error('Failed to update business profile');
    }

    return updated;
  }

  /**
   * Handle DELETE /api/broker/business-profiles/:id
   * Delete profile (soft delete with cascades)
   *
   * @param profileId - Business profile ID
   * @param userId - ID of authenticated user (for authorization)
   * @returns Success status
   * @throws Error if profile not found or unauthorized
   */
  async deleteBusinessProfile(profileId: string, userId: string): Promise<{ success: boolean }> {
    // First verify ownership
    const existing = await this.businessProfileService.getById(profileId);
    if (!existing) {
      throw new Error('Business profile not found');
    }

    if (existing.created_by_user_id !== userId) {
      throw new Error('Unauthorized to delete this business profile');
    }

    const success = await this.businessProfileService.delete(profileId);
    return { success };
  }

  /**
   * Handle POST /api/broker/business-profiles/:id/team
   * Add team member to business profile
   *
   * @param profileId - Business profile ID
   * @param userId - ID of authenticated user (for authorization)
   * @param memberData - Team member data (user_id or email, role)
   * @returns Created team member
   * @throws Error if profile not found or unauthorized
   */
  async addTeamMember(
    profileId: string,
    userId: string,
    memberData: {
      user_id?: string;
      email?: string;
      role: 'broker' | 'manager' | 'admin' | 'viewer';
    }
  ): Promise<BusinessTeamMember> {
    // First verify ownership
    const existing = await this.businessProfileService.getById(profileId);
    if (!existing) {
      throw new Error('Business profile not found');
    }

    if (existing.created_by_user_id !== userId) {
      throw new Error('Unauthorized to add team members to this business profile');
    }

    // Validate required fields
    if (!memberData.user_id && !memberData.email) {
      throw new Error('Either user_id or email is required');
    }

    if (!memberData.role) {
      throw new Error('role is required');
    }

    // Validate role
    const validRoles = ['broker', 'manager', 'admin', 'viewer'];
    if (!validRoles.includes(memberData.role)) {
      throw new Error('Invalid role. Must be one of: broker, manager, admin, viewer');
    }

    return await this.businessProfileService.addTeamMember(profileId, memberData);
  }

  /**
   * Handle DELETE /api/broker/business-profiles/:id/team/:memberId
   * Remove team member from business profile
   *
   * @param profileId - Business profile ID
   * @param memberId - Team member ID
   * @param userId - ID of authenticated user (for authorization)
   * @returns Success status
   * @throws Error if profile not found or unauthorized
   */
  async removeTeamMember(
    profileId: string,
    memberId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    // First verify ownership
    const existing = await this.businessProfileService.getById(profileId);
    if (!existing) {
      throw new Error('Business profile not found');
    }

    if (existing.created_by_user_id !== userId) {
      throw new Error('Unauthorized to remove team members from this business profile');
    }

    const success = await this.businessProfileService.removeTeamMember(profileId, memberId);
    return { success };
  }

  /**
   * Handle GET /api/broker/business-profiles/:id/stats
   * Get calculated stats for business profile
   *
   * @param profileId - Business profile ID
   * @param userId - ID of authenticated user (for authorization)
   * @returns Business profile stats
   * @throws Error if profile not found or unauthorized
   */
  async getBusinessProfileStats(
    profileId: string,
    userId: string
  ): Promise<BusinessProfileStats> {
    // First verify ownership
    const existing = await this.businessProfileService.getById(profileId);
    if (!existing) {
      throw new Error('Business profile not found');
    }

    if (existing.created_by_user_id !== userId) {
      throw new Error('Unauthorized to access stats for this business profile');
    }

    // Recalculate stats to ensure they're current
    await this.businessStatsService.updateStats(profileId);

    const stats = await this.businessProfileService.calculateStats(profileId);
    if (!stats) {
      throw new Error('Failed to calculate business profile stats');
    }

    return stats;
  }

  /**
   * Handle GET /api/broker/business-profiles/search
   * Search business profiles by name
   *
   * @param searchQuery - Search query string
   * @param page - Page number (for future pagination)
   * @param limit - Items per page (for future pagination)
   * @returns Array of matching business profiles
   */
  async searchBusinessProfiles(
    searchQuery: string,
    page: number = 1,
    limit: number = 20
  ): Promise<BusinessProfileSearchResult> {
    const profiles = await this.businessProfileService.search(searchQuery);

    return {
      profiles,
      total: profiles.length,
    };
  }
}
