import { BusinessModel } from '../database/models/Business';
import { KPIService } from '../services/KPIService';
import { DashboardKPIs, DashboardData } from '../types';

/**
 * Controller for dashboard endpoints
 * Handles HTTP request/response logic for dashboard operations
 */
export class DashboardController {
  private businessModel: BusinessModel;
  private kpiService: KPIService;

  constructor(businessModel?: BusinessModel, kpiService?: KPIService) {
    this.businessModel = businessModel || new BusinessModel();
    this.kpiService = kpiService || new KPIService();
  }

  /**
   * Handle GET /api/dashboard/tenant
   * Get dashboard data for authenticated tenant user
   *
   * @param userId - ID of authenticated user
   * @returns Dashboard data with KPIs and businesses
   */
  async getTenantDashboard(userId: string): Promise<DashboardData> {
    // Calculate KPIs (uses cache if available)
    const kpis = await this.kpiService.calculateDashboardKPIs(userId);

    // Get first 20 businesses for the user
    const result = await this.businessModel.findByUserIdPaginated(userId, 20, 0);

    return {
      kpis,
      businesses: result.businesses,
      total: result.total,
    };
  }

  /**
   * Get only KPIs without businesses list
   * Useful for polling updates
   *
   * @param userId - ID of authenticated user
   * @returns Dashboard KPIs
   */
  async getKPIsOnly(userId: string): Promise<DashboardKPIs> {
    return await this.kpiService.calculateDashboardKPIs(userId);
  }

  /**
   * Invalidate cached dashboard data for a user
   * Called when user's business or metrics data changes
   *
   * @param userId - ID of the user
   */
  async invalidateDashboardCache(userId: string): Promise<void> {
    await this.kpiService.invalidateCache(userId);
  }
}
