import { Pool } from 'pg';
import pool from '../config/database';
import { DemandListingModel } from '../database/models/DemandListing';
import { DemandListing } from '../types';

/**
 * Service for managing demand listings with enhanced amenities features
 * Extends existing DemandListingModel methods with JSONB field support
 */
export class DemandListingService {
  private pool: Pool;
  private demandListingModel: DemandListingModel;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
    this.demandListingModel = new DemandListingModel(this.pool);
  }

  /**
   * Create demand listing with amenities and enhanced fields
   *
   * @param brokerId - Broker's business ID
   * @param locationData - Location data including amenities, locations of interest, and map boundaries
   * @returns Created demand listing
   */
  async createWithAmenities(
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
      // New fields
      amenities?: string[];
      locations_of_interest?: any[];
      map_boundaries?: Record<string, any>;
      lot_size_min?: number;
      lot_size_max?: number;
      monthly_budget_min?: number;
      monthly_budget_max?: number;
    }
  ): Promise<DemandListing> {
    // Validate lot_size ranges
    if (locationData.lot_size_min && locationData.lot_size_max) {
      if (locationData.lot_size_min > locationData.lot_size_max) {
        throw new Error('lot_size_min cannot be greater than lot_size_max');
      }
    }

    // Validate monthly_budget ranges
    if (locationData.monthly_budget_min && locationData.monthly_budget_max) {
      if (locationData.monthly_budget_min > locationData.monthly_budget_max) {
        throw new Error('monthly_budget_min cannot be greater than monthly_budget_max');
      }
    }

    return this.demandListingModel.create({
      business_id: brokerId,
      ...locationData,
    });
  }

  /**
   * Update amenities for a demand listing
   *
   * @param listingId - Demand listing ID
   * @param amenities - Array of amenity strings
   * @returns Updated demand listing or null
   */
  async updateAmenities(
    listingId: string,
    amenities: string[]
  ): Promise<DemandListing | null> {
    return this.demandListingModel.update(listingId, { amenities });
  }

  /**
   * Update locations of interest for a demand listing
   *
   * @param listingId - Demand listing ID
   * @param locations - Array of location objects/strings
   * @returns Updated demand listing or null
   */
  async updateLocationsOfInterest(
    listingId: string,
    locations: any[]
  ): Promise<DemandListing | null> {
    return this.demandListingModel.update(listingId, { locations_of_interest: locations });
  }

  /**
   * Update map boundaries for a demand listing
   *
   * @param listingId - Demand listing ID
   * @param geoJSON - GeoJSON object representing map boundaries
   * @returns Updated demand listing or null
   */
  async updateMapBoundaries(
    listingId: string,
    geoJSON: Record<string, any>
  ): Promise<DemandListing | null> {
    return this.demandListingModel.update(listingId, { map_boundaries: geoJSON });
  }

  /**
   * Get demand listing by ID
   *
   * @param listingId - Demand listing ID
   * @returns Demand listing or null
   */
  async getById(listingId: string): Promise<DemandListing | null> {
    return this.demandListingModel.findById(listingId);
  }

  /**
   * Get demand listings by business ID
   *
   * @param businessId - Business ID
   * @returns Array of demand listings
   */
  async getByBusinessId(businessId: string): Promise<DemandListing[]> {
    return this.demandListingModel.findByBusinessId(businessId);
  }

  /**
   * Get active demand listings by business ID
   *
   * @param businessId - Business ID
   * @returns Array of active demand listings
   */
  async getActiveByBusinessId(businessId: string): Promise<DemandListing[]> {
    return this.demandListingModel.findActiveByBusinessId(businessId);
  }

  /**
   * Update demand listing with validation
   *
   * @param listingId - Demand listing ID
   * @param data - Partial demand listing data
   * @returns Updated demand listing or null
   */
  async update(
    listingId: string,
    data: Partial<DemandListing>
  ): Promise<DemandListing | null> {
    // Validate lot_size ranges if both provided and not null
    if (data.lot_size_min !== undefined && data.lot_size_min !== null &&
        data.lot_size_max !== undefined && data.lot_size_max !== null) {
      if (data.lot_size_min > data.lot_size_max) {
        throw new Error('lot_size_min cannot be greater than lot_size_max');
      }
    }

    // Validate monthly_budget ranges if both provided and not null
    if (data.monthly_budget_min !== undefined && data.monthly_budget_min !== null &&
        data.monthly_budget_max !== undefined && data.monthly_budget_max !== null) {
      if (data.monthly_budget_min > data.monthly_budget_max) {
        throw new Error('monthly_budget_min cannot be greater than monthly_budget_max');
      }
    }

    return this.demandListingModel.update(listingId, data);
  }

  /**
   * Delete demand listing
   *
   * @param listingId - Demand listing ID
   * @returns True if deleted, false otherwise
   */
  async delete(listingId: string): Promise<boolean> {
    return this.demandListingModel.delete(listingId);
  }

  /**
   * Search demand listings with filters and pagination
   *
   * @param filters - Search filters
   * @param page - Page number
   * @param limit - Results per page
   * @returns Paginated demand listings
   */
  async search(
    filters: {
      location?: string;
      propertyType?: string;
      minSqft?: number;
      maxSqft?: number;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ listings: DemandListing[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { listings, total } = await this.demandListingModel.findPaginated(
      limit,
      offset,
      filters
    );

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
