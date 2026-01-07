import { DemandListingService } from '../services/DemandListingService';
import { DemandListing } from '../types';

/**
 * Response type for broker locations
 */
export interface BrokerLocationsResponse {
  locations: DemandListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Controller for broker location/demand listing endpoints
 * Handles HTTP request/response logic for posting and managing space requirements
 * Follows pattern from BrokerDashboardController
 */
export class BrokerLocationController {
  private demandListingService: DemandListingService;

  constructor(demandListingService?: DemandListingService) {
    this.demandListingService = demandListingService || new DemandListingService();
  }

  /**
   * Handle POST /api/broker/locations
   * Post new space requirement with amenities
   *
   * @param brokerId - Broker's business ID
   * @param locationData - Location data including amenities, locations of interest, and map boundaries
   * @returns Created demand listing
   * @throws Error if validation fails
   */
  async createLocation(
    brokerId: string,
    locationData: {
      title?: string;
      description?: string;
      location_name: string;
      city: string;
      state: string;
      address?: string;
      sqft_min?: number;
      sqft_max?: number;
      budget_min?: number;
      budget_max?: number;
      duration_type?: string;
      start_date?: string;
      industry?: string;
      asset_type: string;
      target_move_in?: string;
      preferred_lease_term?: string;
      amenities?: string[];
      locations_of_interest?: any[];
      map_boundaries?: Record<string, any>;
      lot_size_min?: number;
      lot_size_max?: number;
      monthly_budget_min?: number;
      monthly_budget_max?: number;
    }
  ): Promise<DemandListing> {
    // Validate required fields
    if (!locationData.location_name) {
      throw new Error('location_name is required');
    }

    if (!locationData.asset_type) {
      throw new Error('asset_type is required');
    }

    // Validate sqft ranges if both provided
    if (locationData.sqft_min && locationData.sqft_max) {
      if (locationData.sqft_min > locationData.sqft_max) {
        throw new Error('sqft_min cannot be greater than sqft_max');
      }
    }

    // Validate budget ranges if both provided
    if (locationData.budget_min && locationData.budget_max) {
      if (locationData.budget_min > locationData.budget_max) {
        throw new Error('budget_min cannot be greater than budget_max');
      }
    }

    // Validate monthly_budget ranges if both provided
    if (locationData.monthly_budget_min && locationData.monthly_budget_max) {
      if (locationData.monthly_budget_min > locationData.monthly_budget_max) {
        throw new Error('monthly_budget_min cannot be greater than monthly_budget_max');
      }
    }

    // Validate lot_size ranges if both provided
    if (locationData.lot_size_min && locationData.lot_size_max) {
      if (locationData.lot_size_min > locationData.lot_size_max) {
        throw new Error('lot_size_min cannot be greater than lot_size_max');
      }
    }

    // Validate amenities array if provided
    if (locationData.amenities) {
      if (!Array.isArray(locationData.amenities)) {
        throw new Error('amenities must be an array');
      }
    }

    // Validate locations_of_interest array if provided
    if (locationData.locations_of_interest) {
      if (!Array.isArray(locationData.locations_of_interest)) {
        throw new Error('locations_of_interest must be an array');
      }
    }

    // Validate map_boundaries if provided
    if (locationData.map_boundaries) {
      if (typeof locationData.map_boundaries !== 'object') {
        throw new Error('map_boundaries must be a valid GeoJSON object');
      }
    }

    return await this.demandListingService.createWithAmenities(brokerId, locationData);
  }

  /**
   * Handle PUT /api/broker/locations/:id
   * Update location requirement
   *
   * @param locationId - Location/demand listing ID
   * @param brokerId - Broker's business ID (for authorization)
   * @param updateData - Partial location data to update
   * @returns Updated demand listing
   * @throws Error if location not found or unauthorized
   */
  async updateLocation(
    locationId: string,
    brokerId: string,
    updateData: Partial<DemandListing>
  ): Promise<DemandListing> {
    // Verify ownership
    const existing = await this.demandListingService.getById(locationId);
    if (!existing) {
      throw new Error('Location not found');
    }

    if (existing.business_id !== brokerId) {
      throw new Error('Unauthorized to update this location');
    }

    // Validate sqft ranges if both provided in update
    if (updateData.sqft_min !== undefined && updateData.sqft_max !== undefined) {
      if (updateData.sqft_min !== null && updateData.sqft_max !== null && updateData.sqft_min > updateData.sqft_max) {
        throw new Error('sqft_min cannot be greater than sqft_max');
      }
    }

    // Validate budget ranges if both provided in update
    if (updateData.budget_min !== undefined && updateData.budget_max !== undefined) {
      if (updateData.budget_min !== null && updateData.budget_max !== null && updateData.budget_min > updateData.budget_max) {
        throw new Error('budget_min cannot be greater than budget_max');
      }
    }

    // Validate monthly_budget ranges if updating
    if (updateData.monthly_budget_min !== undefined && updateData.monthly_budget_max !== undefined) {
      if (updateData.monthly_budget_min !== null && updateData.monthly_budget_max !== null && updateData.monthly_budget_min > updateData.monthly_budget_max) {
        throw new Error('monthly_budget_min cannot be greater than monthly_budget_max');
      }
    }

    // Validate lot_size ranges if updating
    if (updateData.lot_size_min !== undefined && updateData.lot_size_max !== undefined) {
      if (updateData.lot_size_min !== null && updateData.lot_size_max !== null && updateData.lot_size_min > updateData.lot_size_max) {
        throw new Error('lot_size_min cannot be greater than lot_size_max');
      }
    }

    const updated = await this.demandListingService.update(locationId, updateData);
    if (!updated) {
      throw new Error('Failed to update location');
    }

    return updated;
  }

  /**
   * Handle GET /api/broker/locations
   * List broker's posted locations with pagination
   *
   * @param brokerId - Broker's business ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   * @returns Paginated broker locations
   */
  async getLocations(
    brokerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<BrokerLocationsResponse> {
    // Validate and sanitize pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit));
    const offset = (validatedPage - 1) * validatedLimit;

    // Get broker listings
    const listings = await this.demandListingService.getByBusinessId(brokerId);
    const total = listings.length;
    const paginatedListings = listings.slice(offset, offset + validatedLimit);
    const hasMore = offset + paginatedListings.length < total;

    return {
      locations: paginatedListings,
      total: total,
      page: validatedPage,
      limit: validatedLimit,
      hasMore,
    };
  }

  /**
   * Handle GET /api/broker/locations/:id
   * Get specific location by ID
   *
   * @param locationId - Location/demand listing ID
   * @param brokerId - Broker's business ID (for authorization)
   * @returns Demand listing
   * @throws Error if location not found or unauthorized
   */
  async getLocationById(locationId: string, brokerId: string): Promise<DemandListing> {
    const location = await this.demandListingService.getById(locationId);

    if (!location) {
      throw new Error('Location not found');
    }

    if (location.business_id !== brokerId) {
      throw new Error('Unauthorized to access this location');
    }

    return location;
  }

  /**
   * Handle DELETE /api/broker/locations/:id
   * Delete location requirement
   *
   * @param locationId - Location/demand listing ID
   * @param brokerId - Broker's business ID (for authorization)
   * @returns Success status
   * @throws Error if location not found or unauthorized
   */
  async deleteLocation(locationId: string, brokerId: string): Promise<{ success: boolean }> {
    // Verify ownership
    const existing = await this.demandListingService.getById(locationId);
    if (!existing) {
      throw new Error('Location not found');
    }

    if (existing.business_id !== brokerId) {
      throw new Error('Unauthorized to delete this location');
    }

    const success = await this.demandListingService.delete(locationId);
    return { success };
  }
}
