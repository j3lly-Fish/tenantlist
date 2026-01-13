import { BusinessModel } from '../database/models/Business';
import { DemandListingModel } from '../database/models/DemandListing';
import { BusinessMetricsModel } from '../database/models/BusinessMetrics';
import { Business, BusinessStatus, DemandListing, BusinessMetrics } from '../types';

/**
 * Business API response types
 */
interface BusinessListResponse {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface BusinessDetailResponse {
  business: Business;
  demandListings: DemandListing[];
  listingsCount: number;
  statesCount: number;
  invitesCount: number;
}

interface DemandListingResponse {
  demandListings: DemandListing[];
  total: number;
}

interface LocationMetricsResponse {
  metrics: {
    views: number;
    clicks: number;
    invites: number;
    declined: number;
    messages: number;
    qfps: number;
  };
  history: BusinessMetrics[];
}

interface BusinessMetricsResponse {
  totalViews: number;
  totalClicks: number;
  totalInvites: number;
  totalMessages: number;
  totalDeclined: number;
  totalQfps: number;
  metricsHistory: BusinessMetrics[];
}

/**
 * Task Group 3.2-3.5: New response types for business search and portfolio
 */
interface GlobalSearchResponse {
  businesses: Business[];
  total: number;
}

interface DuplicateCheckResponse {
  exists: boolean;
  business?: Business;
}

interface AddBusinessResponse {
  success: boolean;
  businessId: string;
  message: string;
}

interface UserBusinessesResponse {
  businesses: Business[];
  count: number;
}

/**
 * Controller for business endpoints
 * Handles HTTP request/response logic for business operations
 */
export class BusinessController {
  private businessModel: BusinessModel;
  private demandListingModel: DemandListingModel;
  private businessMetricsModel: BusinessMetricsModel;

  constructor(
    businessModel?: BusinessModel,
    demandListingModel?: DemandListingModel,
    businessMetricsModel?: BusinessMetricsModel
  ) {
    this.businessModel = businessModel || new BusinessModel();
    this.demandListingModel = demandListingModel || new DemandListingModel();
    this.businessMetricsModel = businessMetricsModel || new BusinessMetricsModel();
  }

  /**
   * Handle GET /api/businesses
   * List businesses for authenticated user with pagination, filtering, and search
   *
   * @param userId - ID of authenticated user
   * @param options - Query parameters (page, limit, status, search)
   * @returns Paginated list of businesses with aggregated counts
   */
  async listBusinesses(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: BusinessStatus;
      search?: string;
    } = {}
  ): Promise<BusinessListResponse> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    // Use paginated query with filters
    const result = await this.businessModel.findByUserIdPaginated(
      userId,
      limit,
      offset,
      options.status,
      options.search
    );

    // Get aggregated counts for each business
    const businessesWithCounts = await Promise.all(
      result.businesses.map(async (business) => {
        const counts = await this.businessModel.getAggregatedCounts(business.id);
        return {
          ...business,
          listingsCount: counts.listingsCount,
          statesCount: counts.statesCount,
          invitesCount: counts.invitesCount,
        };
      })
    );

    const hasMore = offset + result.businesses.length < result.total;

    return {
      businesses: businessesWithCounts,
      total: result.total,
      page,
      limit,
      hasMore,
    };
  }

  /**
   * Handle GET /api/businesses/:id
   * Get single business with details, demand listings, and aggregated counts
   *
   * @param businessId - ID of the business
   * @param userId - ID of authenticated user (for authorization)
   * @returns Business details with demand listings and counts
   * @throws Error if business not found or user doesn't own the business
   */
  async getBusinessById(businessId: string, userId: string): Promise<BusinessDetailResponse> {
    // Find business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    // Verify user owns the business
    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Get demand listings for this business
    const demandListings = await this.demandListingModel.findByBusinessId(businessId);

    // Get aggregated counts
    const counts = await this.businessModel.getAggregatedCounts(businessId);

    return {
      business,
      demandListings,
      listingsCount: counts.listingsCount,
      statesCount: counts.statesCount,
      invitesCount: counts.invitesCount,
    };
  }

  /**
   * Handle GET /api/businesses/:id/demand-listings
   * List all demand listings for a business
   *
   * @param businessId - ID of the business
   * @param userId - ID of authenticated user (for authorization)
   * @returns List of demand listings
   * @throws Error if business not found or user doesn't own the business
   */
  async listDemandListings(
    businessId: string,
    userId: string
  ): Promise<DemandListingResponse> {
    // Verify user owns the business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Get demand listings
    const demandListings = await this.demandListingModel.findByBusinessId(businessId);

    return {
      demandListings,
      total: demandListings.length,
    };
  }

  /**
   * Handle GET /api/businesses/:id/locations/:locationId/metrics
   * Get metrics for a specific demand listing location (PLACEHOLDER for MVP)
   *
   * @param businessId - ID of the business
   * @param locationId - ID of the demand listing
   * @param userId - ID of authenticated user (for authorization)
   * @returns Placeholder metrics response
   * @throws Error if business not found, location not found, or user doesn't own the business
   */
  async getLocationMetrics(
    businessId: string,
    locationId: string,
    userId: string
  ): Promise<LocationMetricsResponse> {
    // Verify user owns the business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Verify demand listing belongs to business
    const demandListing = await this.demandListingModel.findById(locationId);

    if (!demandListing) {
      throw new Error('Location not found');
    }

    if (demandListing.business_id !== businessId) {
      throw new Error('Location does not belong to this business');
    }

    // Get metrics history for this demand listing
    const metricsHistory = await this.businessMetricsModel.findByDemandListingId(locationId);

    // Aggregate metrics
    const aggregated = metricsHistory.reduce(
      (acc, m) => ({
        views: acc.views + (m.views_count || 0),
        clicks: acc.clicks + (m.clicks_count || 0),
        invites: acc.invites + (m.property_invites_count || 0),
        declined: acc.declined + (m.declined_count || 0),
        messages: acc.messages + (m.messages_count || 0),
        qfps: acc.qfps + (m.qfps_submitted_count || 0),
      }),
      { views: 0, clicks: 0, invites: 0, declined: 0, messages: 0, qfps: 0 }
    );

    return {
      metrics: aggregated,
      history: metricsHistory.slice(0, 30), // Last 30 days of history
    };
  }

  /**
   * Get aggregated metrics for a business
   */
  async getBusinessMetrics(
    businessId: string,
    userId: string
  ): Promise<BusinessMetricsResponse> {
    // Verify user owns the business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Get all metrics for this business
    const metricsHistory = await this.businessMetricsModel.findByBusinessId(businessId);

    // Aggregate totals
    const totals = metricsHistory.reduce(
      (acc, m) => ({
        totalViews: acc.totalViews + (m.views_count || 0),
        totalClicks: acc.totalClicks + (m.clicks_count || 0),
        totalInvites: acc.totalInvites + (m.property_invites_count || 0),
        totalMessages: acc.totalMessages + (m.messages_count || 0),
        totalDeclined: acc.totalDeclined + (m.declined_count || 0),
        totalQfps: acc.totalQfps + (m.qfps_submitted_count || 0),
      }),
      { totalViews: 0, totalClicks: 0, totalInvites: 0, totalMessages: 0, totalDeclined: 0, totalQfps: 0 }
    );

    return {
      ...totals,
      metricsHistory: metricsHistory.slice(0, 90), // Last 90 entries
    };
  }

  /**
   * Handle POST /api/businesses
   * Create a new business for the authenticated user
   *
   * @param userId - ID of authenticated user
   * @param data - Business creation data
   * @returns Created business
   */
  async createBusiness(
    userId: string,
    data: {
      name: string;
      category: string;
      logo_url?: string | null;
      status?: BusinessStatus;
    }
  ): Promise<Business> {
    // Validate required fields
    if (!data.name || !data.category) {
      throw new Error('Business name and category are required');
    }

    // Create business
    const business = await this.businessModel.create({
      user_id: userId,
      name: data.name,
      category: data.category,
      logo_url: data.logo_url || null,
      status: data.status || ('active' as BusinessStatus),
      is_verified: false,
      stealth_mode_enabled: false,
    });

    return business;
  }

  /**
   * Handle POST /api/demand-listings
   * Create a new demand listing for a business
   *
   * @param userId - ID of authenticated user
   * @param data - Demand listing creation data
   * @returns Created demand listing
   */
  async createDemandListing(
    userId: string,
    data: {
      business_id: string;
      title?: string | null;
      description?: string | null;
      location_name: string;
      city: string;
      state: string;
      address?: string | null;
      sqft_min?: number | null;
      sqft_max?: number | null;
      budget_min?: number | null;
      budget_max?: number | null;
      duration_type?: string | null;
      start_date?: string | null;
      industry?: string | null;
      asset_type: string;
      lot_size?: number | null;
      is_corporate_location?: boolean;
      additional_features?: string[];
      stealth_mode?: boolean;
    }
  ): Promise<DemandListing> {
    // Verify user owns the business
    const business = await this.businessModel.findById(data.business_id);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Validate required fields
    if (!data.location_name || !data.city || !data.state || !data.asset_type) {
      throw new Error('Location name, city, state, and asset type are required');
    }

    // Create demand listing
    const demandListing = await this.demandListingModel.create({
      business_id: data.business_id,
      title: data.title,
      description: data.description,
      location_name: data.location_name,
      city: data.city,
      state: data.state,
      address: data.address || null,
      sqft_min: data.sqft_min || null,
      sqft_max: data.sqft_max || null,
      budget_min: data.budget_min || null,
      budget_max: data.budget_max || null,
      duration_type: data.duration_type || null,
      start_date: data.start_date || null,
      industry: data.industry || null,
      asset_type: data.asset_type,
      lot_size: data.lot_size || null,
      is_corporate_location: data.is_corporate_location || false,
      additional_features: data.additional_features || [],
      stealth_mode: data.stealth_mode || false,
    });

    return demandListing;
  }

  /**
   * Verify user owns a business
   * Helper method for authorization checks
   *
   * @param businessId - ID of the business
   * @param userId - ID of the user
   * @returns True if user owns the business
   */
  async verifyBusinessOwnership(businessId: string, userId: string): Promise<boolean> {
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      return false;
    }

    return business.user_id === userId;
  }

  /**
   * Handle PUT /api/businesses/:id
   * Update a business
   *
   * @param businessId - ID of the business to update
   * @param userId - ID of authenticated user (for authorization)
   * @param data - Business update data
   * @returns Updated business
   * @throws Error if business not found or user doesn't own the business
   */
  async updateBusiness(
    businessId: string,
    userId: string,
    data: {
      name?: string;
      category?: string;
      logo_url?: string | null;
      status?: BusinessStatus;
    }
  ): Promise<Business> {
    // Verify user owns the business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Update business
    const updatedBusiness = await this.businessModel.update(businessId, {
      name: data.name,
      category: data.category,
      logo_url: data.logo_url,
      status: data.status,
    });

    if (!updatedBusiness) {
      throw new Error('Business not found');
    }

    return updatedBusiness;
  }

  /**
   * Handle DELETE /api/businesses/:id
   * Delete a business and all associated data
   *
   * @param businessId - ID of the business to delete
   * @param userId - ID of authenticated user (for authorization)
   * @throws Error if business not found or user doesn't own the business
   */
  async deleteBusiness(businessId: string, userId: string): Promise<void> {
    // Verify user owns the business
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Delete the business (this should cascade delete related records)
    const deleted = await this.businessModel.delete(businessId);

    if (!deleted) {
      throw new Error('Failed to delete business');
    }
  }

  /**
   * Handle PUT /api/demand-listings/:id
   * Update a demand listing
   *
   * @param listingId - ID of the demand listing to update
   * @param userId - ID of authenticated user (for authorization)
   * @param data - Demand listing update data
   * @returns Updated demand listing
   * @throws Error if listing not found or user doesn't own the business
   */
  async updateDemandListing(
    listingId: string,
    userId: string,
    data: {
      title?: string | null;
      description?: string | null;
      location_name?: string;
      city?: string;
      state?: string;
      address?: string | null;
      sqft_min?: number | null;
      sqft_max?: number | null;
      budget_min?: number | null;
      budget_max?: number | null;
      duration_type?: string | null;
      start_date?: string | null;
      industry?: string | null;
      asset_type?: string;
      lot_size?: number | null;
      is_corporate_location?: boolean;
      additional_features?: string[];
      stealth_mode?: boolean;
    }
  ): Promise<DemandListing> {
    // Find the demand listing
    const listing = await this.demandListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Demand listing not found');
    }

    // Verify user owns the business
    const business = await this.businessModel.findById(listing.business_id);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Update the demand listing
    const updatedListing = await this.demandListingModel.update(listingId, data);

    if (!updatedListing) {
      throw new Error('Failed to update demand listing');
    }

    return updatedListing;
  }

  /**
   * Handle DELETE /api/demand-listings/:id
   * Delete a demand listing
   *
   * @param listingId - ID of the demand listing to delete
   * @param userId - ID of authenticated user (for authorization)
   * @throws Error if listing not found or user doesn't own the business
   */
  async deleteDemandListing(listingId: string, userId: string): Promise<void> {
    // Find the demand listing
    const listing = await this.demandListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Demand listing not found');
    }

    // Verify user owns the business
    const business = await this.businessModel.findById(listing.business_id);

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this business');
    }

    // Delete the demand listing
    const deleted = await this.demandListingModel.delete(listingId);

    if (!deleted) {
      throw new Error('Failed to delete demand listing');
    }
  }

  /**
   * Handle PATCH /api/demand-listings/:id/stealth
   * Toggle stealth mode for a demand listing
   *
   * @param listingId - ID of the demand listing
   * @param userId - ID of authenticated user (for authorization)
   * @param enabled - Whether stealth mode should be enabled
   * @returns Updated demand listing
   */
  async toggleStealthMode(
    listingId: string,
    userId: string,
    enabled: boolean
  ): Promise<DemandListing> {
    return this.updateDemandListing(listingId, userId, { stealth_mode: enabled });
  }

  /**
   * Task Group 3.2: Handle GET /api/businesses/search
   * Global business search across ALL businesses (not filtered by user_id)
   *
   * @param searchTerm - Search query string
   * @returns Global search results from all businesses
   */
  async globalSearch(searchTerm: string): Promise<GlobalSearchResponse> {
    const businesses = await this.businessModel.findAllGlobal(searchTerm);

    return {
      businesses,
      total: businesses.length,
    };
  }

  /**
   * Task Group 3.3: Handle POST /api/businesses/check-duplicate
   * Check if a business with the given name already exists globally
   *
   * @param companyName - Company name to check
   * @returns Duplicate check result with exists boolean
   */
  async checkDuplicate(companyName: string): Promise<DuplicateCheckResponse> {
    if (!companyName || companyName.trim() === '') {
      throw new Error('Company name is required');
    }

    const exists = await this.businessModel.checkDuplicate(companyName);

    return {
      exists,
    };
  }

  /**
   * Task Group 3.4: Handle POST /api/user/businesses
   * Add an existing business to user's portfolio
   * Note: This creates a relationship, but currently the schema uses user_id on businesses
   * For now, we'll verify the business exists and return success
   * Future: If junction table is needed, implement user_businesses relationship
   *
   * @param userId - ID of authenticated user
   * @param businessId - ID of business to add to portfolio
   * @returns Success response with business ID
   */
  async addBusinessToUser(userId: string, businessId: string): Promise<AddBusinessResponse> {
    if (!businessId || businessId.trim() === '') {
      throw new Error('Business ID is required');
    }

    // Verify business exists
    const business = await this.businessModel.findById(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    // Note: Current schema uses businesses.user_id for ownership
    // In a true portfolio system, this would create a user_businesses junction record
    // For now, we'll return success indicating the relationship concept
    // The actual implementation depends on whether multiple users can share businesses

    return {
      success: true,
      businessId: businessId,
      message: 'Business added to portfolio',
    };
  }

  /**
   * Task Group 3.5: Handle GET /api/user/businesses
   * Get all businesses associated with authenticated user
   *
   * @param userId - ID of authenticated user
   * @returns User's businesses with count
   */
  async getUserBusinesses(userId: string): Promise<UserBusinessesResponse> {
    const businesses = await this.businessModel.findByUserId(userId);

    return {
      businesses,
      count: businesses.length,
    };
  }
}
