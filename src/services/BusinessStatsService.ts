import { Pool } from 'pg';
import pool from '../config/database';
import { BusinessProfileStatsModel, BusinessProfileStats } from '../database/models/BusinessProfileStats';
import { getDashboardSocket } from '../websocket/dashboardSocket';

/**
 * Service for managing business profile statistics
 * Handles automatic stat updates and WebSocket notifications
 */
export class BusinessStatsService {
  private pool: Pool;
  private statsModel: BusinessProfileStatsModel;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
    this.statsModel = new BusinessProfileStatsModel(this.pool);
  }

  /**
   * Recalculate all stats for a business profile
   * Aggregates counts from related tables
   *
   * @param businessProfileId - Business profile ID
   * @returns Recalculated stats or null if profile not found
   */
  async updateStats(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.recalculate(businessProfileId);

    if (stats) {
      // Emit WebSocket event to notify clients
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Increment office count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async incrementOffices(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.increment(businessProfileId, 'offices_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Increment agent count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async incrementAgents(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.increment(businessProfileId, 'agents_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Increment tenant count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async incrementTenants(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.increment(businessProfileId, 'tenants_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Increment property count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async incrementProperties(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.increment(businessProfileId, 'properties_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Decrement office count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async decrementOffices(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.decrement(businessProfileId, 'offices_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Decrement agent count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async decrementAgents(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.decrement(businessProfileId, 'agents_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Decrement tenant count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async decrementTenants(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.decrement(businessProfileId, 'tenants_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Decrement property count
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if profile not found
   */
  async decrementProperties(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const stats = await this.statsModel.decrement(businessProfileId, 'properties_count', 1);

    if (stats) {
      await this.emitStatsUpdate(businessProfileId, stats);
    }

    return stats;
  }

  /**
   * Get current stats for a business profile
   *
   * @param businessProfileId - Business profile ID
   * @returns Current stats or null if not found
   */
  async getStats(businessProfileId: string): Promise<BusinessProfileStats | null> {
    return this.statsModel.findByBusinessProfileId(businessProfileId);
  }

  /**
   * Emit WebSocket event for stats update
   *
   * @param businessProfileId - Business profile ID
   * @param stats - Updated stats
   */
  private async emitStatsUpdate(
    businessProfileId: string,
    stats: BusinessProfileStats
  ): Promise<void> {
    try {
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        return;
      }

      // Get business profile to find the owner user ID
      // We'll need to query this to emit to the right user
      const result = await this.pool.query(
        'SELECT created_by_user_id FROM business_profiles WHERE id = $1',
        [businessProfileId]
      );

      if (result.rows.length === 0) {
        return;
      }

      const userId = result.rows[0].created_by_user_id;

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        return;
      }

      // Emit event
      socketServer.getNamespace().to(`user:${userId}`).emit('broker:business-stats-updated', {
        businessProfileId,
        stats,
        timestamp: new Date().toISOString(),
      });

      console.log(`Emitted broker:business-stats-updated to user:${userId} for business:${businessProfileId}`);
    } catch (error) {
      console.error('Error emitting business stats update event:', error);
      // Don't throw - stats update succeeded, WebSocket notification is optional
    }
  }
}
