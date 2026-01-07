import { Pool } from 'pg';
import pool from '../config/database';
import { BusinessProfileModel, BusinessProfile } from '../database/models/BusinessProfile';
import { BusinessTeamMemberModel, BusinessTeamMember } from '../database/models/BusinessTeamMember';
import { BusinessProfileStatsModel, BusinessProfileStats } from '../database/models/BusinessProfileStats';

/**
 * Business profile with stats and team members
 */
export interface BusinessProfileWithDetails extends BusinessProfile {
  stats?: BusinessProfileStats;
  team_members?: BusinessTeamMember[];
}

/**
 * Service for managing business profiles and related operations
 * Follows pattern from BrokerKPIService
 */
export class BusinessProfileService {
  private pool: Pool;
  private businessProfileModel: BusinessProfileModel;
  private teamMemberModel: BusinessTeamMemberModel;
  private statsModel: BusinessProfileStatsModel;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
    this.businessProfileModel = new BusinessProfileModel(this.pool);
    this.teamMemberModel = new BusinessTeamMemberModel(this.pool);
    this.statsModel = new BusinessProfileStatsModel(this.pool);
  }

  /**
   * Create a new business profile with stats initialization
   *
   * @param userId - User ID creating the profile
   * @param profileData - Business profile data
   * @returns Created business profile with stats
   */
  async create(
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
    // Create business profile
    const profile = await this.businessProfileModel.create({
      created_by_user_id: userId,
      ...profileData,
    });

    // Stats are auto-initialized by database trigger
    // Fetch the stats to include in response
    const stats = await this.statsModel.findByBusinessProfileId(profile.id);

    return {
      ...profile,
      stats: stats || undefined,
    };
  }

  /**
   * Get user's business profiles with stats
   *
   * @param userId - User ID
   * @returns Array of business profiles with stats
   */
  async getByUser(userId: string): Promise<BusinessProfileWithDetails[]> {
    const profiles = await this.businessProfileModel.findByUserId(userId);

    // Fetch stats for each profile
    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await this.statsModel.findByBusinessProfileId(profile.id);
        return {
          ...profile,
          stats: stats || undefined,
        };
      })
    );

    return profilesWithStats;
  }

  /**
   * Get business profile by ID with team members
   *
   * @param profileId - Business profile ID
   * @returns Business profile with team members array or null
   */
  async getById(profileId: string): Promise<BusinessProfileWithDetails | null> {
    const profile = await this.businessProfileModel.findById(profileId);
    if (!profile) {
      return null;
    }

    // Fetch team members and stats
    const [teamMembers, stats] = await Promise.all([
      this.teamMemberModel.findByBusinessProfileId(profileId),
      this.statsModel.findByBusinessProfileId(profileId),
    ]);

    return {
      ...profile,
      team_members: teamMembers,
      stats: stats || undefined,
    };
  }

  /**
   * Update business profile fields
   *
   * @param profileId - Business profile ID
   * @param data - Partial profile data to update
   * @returns Updated profile or null if not found
   */
  async update(
    profileId: string,
    data: Partial<BusinessProfile>
  ): Promise<BusinessProfile | null> {
    return this.businessProfileModel.update(profileId, data);
  }

  /**
   * Delete business profile (cascade deletes handled by database)
   *
   * @param profileId - Business profile ID
   * @returns True if deleted, false otherwise
   */
  async delete(profileId: string): Promise<boolean> {
    return this.businessProfileModel.delete(profileId);
  }

  /**
   * Add team member to business profile
   *
   * @param profileId - Business profile ID
   * @param userData - User data (user_id or email) and role
   * @returns Created team member
   */
  async addTeamMember(
    profileId: string,
    userData: {
      user_id?: string;
      email?: string;
      role: 'broker' | 'manager' | 'admin' | 'viewer';
    }
  ): Promise<BusinessTeamMember> {
    // Verify business profile exists
    const profile = await this.businessProfileModel.findById(profileId);
    if (!profile) {
      throw new Error('Business profile not found');
    }

    // Create team member
    const teamMember = await this.teamMemberModel.create({
      business_profile_id: profileId,
      user_id: userData.user_id || null,
      email: userData.email || null,
      role: userData.role,
      status: 'invited',
    });

    // Increment agents count if status is active or invited
    await this.statsModel.increment(profileId, 'agents_count', 1);

    return teamMember;
  }

  /**
   * Remove team member from business profile
   *
   * @param profileId - Business profile ID
   * @param memberId - Team member ID
   * @returns True if removed, false otherwise
   */
  async removeTeamMember(profileId: string, memberId: string): Promise<boolean> {
    const deleted = await this.teamMemberModel.delete(memberId);

    if (deleted) {
      // Decrement agents count
      await this.statsModel.decrement(profileId, 'agents_count', 1);
    }

    return deleted;
  }

  /**
   * Calculate stats by aggregating counts from related tables
   *
   * @param profileId - Business profile ID
   * @returns Recalculated stats or null if profile not found
   */
  async calculateStats(profileId: string): Promise<BusinessProfileStats | null> {
    // Verify business profile exists
    const profile = await this.businessProfileModel.findById(profileId);
    if (!profile) {
      return null;
    }

    // Recalculate stats using model method
    return this.statsModel.recalculate(profileId);
  }

  /**
   * Search business profiles by name
   *
   * @param searchQuery - Search query string
   * @param limit - Number of results to return
   * @returns Array of matching business profiles
   */
  async search(searchQuery: string, limit: number = 20): Promise<BusinessProfile[]> {
    return this.businessProfileModel.searchByName(searchQuery, limit);
  }
}
