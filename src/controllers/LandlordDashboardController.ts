import { PropertyKPIService, PropertyKPIData } from '../services/PropertyKPIService';
import { PropertyListingModel } from '../database/models/PropertyListing';
import { PropertyListing } from '../types';

/**
 * Response type for full dashboard data
 */
export interface LandlordDashboardData {
  kpis: PropertyKPIData;
  properties: PropertyListing[];
  total: number;
  hasMore: boolean;
}

/**
 * Controller for landlord dashboard endpoints
 * Handles HTTP request/response logic for landlord dashboard operations
 */
export class LandlordDashboardController {
  private propertyKPIService: PropertyKPIService;
  private propertyListingModel: PropertyListingModel;

  constructor(
    propertyKPIService?: PropertyKPIService,
    propertyListingModel?: PropertyListingModel
  ) {
    this.propertyKPIService = propertyKPIService || new PropertyKPIService();
    this.propertyListingModel = propertyListingModel || new PropertyListingModel();
  }

  /**
   * Handle GET /api/dashboard/landlord
   * Get full dashboard data for authenticated landlord user
   *
   * @param userId - ID of authenticated landlord user
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of properties per page (default: 20)
   * @returns Full dashboard data with KPIs and properties
   */
  async getDashboardData(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<LandlordDashboardData> {
    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Get KPIs (uses cache if available)
    const kpis = await this.propertyKPIService.getKPIs(userId);

    // Get paginated properties for the user
    const result = await this.propertyListingModel.findByUserIdPaginated(
      userId,
      limit,
      offset
    );

    // Determine if there are more properties to load
    const hasMore = offset + result.listings.length < result.total;

    return {
      kpis,
      properties: result.listings,
      total: result.total,
      hasMore,
    };
  }

  /**
   * Handle GET /api/dashboard/landlord/kpis
   * Get only KPIs without properties list
   * Useful for polling updates
   *
   * @param userId - ID of authenticated landlord user
   * @returns Dashboard KPIs with trends
   */
  async getKPIs(userId: string): Promise<PropertyKPIData> {
    return await this.propertyKPIService.getKPIs(userId);
  }
}
