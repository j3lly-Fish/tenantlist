import { BrokerKPIService, BrokerKPIData } from '../services/BrokerKPIService';
import { BrokerProfileModel, BrokerProfile } from '../database/models/BrokerProfile';
import { BrokerDealModel } from '../database/models/BrokerDeal';
import { BrokerDeal } from '../services/BrokerDashboardEventService';
import { DemandListingModel } from '../database/models/DemandListing';
import { PropertyListingModel } from '../database/models/PropertyListing';
import { DemandListing, PropertyListing, PropertyType } from '../types';

/**
 * Response type for tenant demands
 */
export interface TenantDemandsResponse {
  demands: DemandListing[];
  total: number;
  hasMore: boolean;
}

/**
 * Response type for properties
 */
export interface PropertiesResponse {
  properties: PropertyListing[];
  total: number;
  hasMore: boolean;
}

/**
 * Response type for broker deals
 */
export interface BrokerDealsResponse {
  deals: BrokerDeal[];
  total: number;
  hasMore: boolean;
}

/**
 * Controller for broker dashboard endpoints
 * Handles HTTP request/response logic for broker dashboard operations
 */
export class BrokerDashboardController {
  private brokerKPIService: BrokerKPIService;
  private brokerProfileModel: BrokerProfileModel;
  private brokerDealModel: BrokerDealModel;
  private demandListingModel: DemandListingModel;
  private propertyListingModel: PropertyListingModel;

  constructor(
    brokerKPIService?: BrokerKPIService,
    brokerProfileModel?: BrokerProfileModel,
    brokerDealModel?: BrokerDealModel,
    demandListingModel?: DemandListingModel,
    propertyListingModel?: PropertyListingModel
  ) {
    this.brokerKPIService = brokerKPIService || new BrokerKPIService();
    this.brokerProfileModel = brokerProfileModel || new BrokerProfileModel();
    this.brokerDealModel = brokerDealModel || new BrokerDealModel();
    this.demandListingModel = demandListingModel || new DemandListingModel();
    this.propertyListingModel = propertyListingModel || new PropertyListingModel();
  }

  /**
   * Handle GET /api/dashboard/broker/kpis
   * Get only KPIs without other dashboard data
   * Useful for polling updates
   *
   * @param userId - ID of authenticated broker user
   * @returns Broker KPIs with trends
   */
  async getKPIs(userId: string): Promise<BrokerKPIData> {
    return await this.brokerKPIService.getKPIs(userId);
  }

  /**
   * Handle GET /api/broker/profile
   * Get broker profile for authenticated user
   *
   * @param userId - ID of authenticated broker user
   * @returns Broker profile or null if not found
   */
  async getBrokerProfile(userId: string): Promise<BrokerProfile | null> {
    return await this.brokerProfileModel.findByUserId(userId);
  }

  /**
   * Handle POST /api/broker/profile
   * Create broker profile for authenticated user
   *
   * @param userId - ID of authenticated broker user
   * @param data - Broker profile data
   * @returns Created broker profile
   */
  async createBrokerProfile(
    userId: string,
    data: {
      company_name: string;
      license_number?: string;
      license_state?: string;
      specialties?: string[];
      bio?: string;
      website_url?: string;
      years_experience?: number;
    }
  ): Promise<BrokerProfile> {
    return await this.brokerProfileModel.create({
      user_id: userId,
      ...data,
    });
  }

  /**
   * Handle PUT /api/broker/profile
   * Update broker profile for authenticated user
   *
   * @param userId - ID of authenticated broker user
   * @param data - Partial broker profile data to update
   * @returns Updated broker profile or null if not found
   */
  async updateBrokerProfile(
    userId: string,
    data: Partial<BrokerProfile>
  ): Promise<BrokerProfile | null> {
    return await this.brokerProfileModel.update(userId, data);
  }

  /**
   * Handle GET /api/broker/demands
   * Get paginated tenant demands/QFPs for broker to browse
   *
   * @param params - Pagination and filter parameters
   * @returns Paginated tenant demands
   */
  async getTenantDemands(params: {
    page?: number;
    limit?: number;
    location?: string;
    propertyType?: string;
    minSqft?: number;
    maxSqft?: number;
  }): Promise<TenantDemandsResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const filters: any = {};
    if (params.location) filters.location = params.location;
    if (params.propertyType) filters.propertyType = params.propertyType;
    if (params.minSqft) filters.minSqft = params.minSqft;
    if (params.maxSqft) filters.maxSqft = params.maxSqft;

    const result = await this.demandListingModel.findPaginated(limit, offset, filters);

    const hasMore = offset + result.listings.length < result.total;

    return {
      demands: result.listings,
      total: result.total,
      hasMore,
    };
  }

  /**
   * Handle GET /api/broker/properties
   * Get paginated property listings for broker to browse
   *
   * @param params - Pagination and filter parameters
   * @returns Paginated property listings
   */
  async getProperties(params: {
    page?: number;
    limit?: number;
    location?: string;
    propertyType?: PropertyType;
    minSqft?: number;
    maxSqft?: number;
  }): Promise<PropertiesResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const filters: any = {};
    if (params.location) filters.location = params.location;
    if (params.propertyType) filters.propertyType = params.propertyType;
    if (params.minSqft) filters.minSqft = params.minSqft;
    if (params.maxSqft) filters.maxSqft = params.maxSqft;

    const result = await this.propertyListingModel.findPaginated(limit, offset, filters);

    const hasMore = offset + result.listings.length < result.total;

    return {
      properties: result.listings,
      total: result.total,
      hasMore,
    };
  }

  /**
   * Handle GET /api/broker/deals
   * Get broker's deals with pagination
   *
   * @param userId - ID of authenticated broker user
   * @param params - Pagination and filter parameters
   * @returns Paginated broker deals
   */
  async getDeals(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      status?: 'prospecting' | 'touring' | 'offer_submitted' | 'signed' | 'lost';
    }
  ): Promise<BrokerDealsResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const result = await this.brokerDealModel.findByBrokerUserId(
      userId,
      limit,
      offset,
      params.status
    );

    const hasMore = offset + result.deals.length < result.total;

    return {
      deals: result.deals,
      total: result.total,
      hasMore,
    };
  }
}
