import { Pool } from 'pg';
import pool from '../../config/database';
import { DemandListing, DemandListingStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class DemandListingModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new demand listing
  async create(data: {
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
    requirements?: Record<string, any>;
    status?: DemandListingStatus;
    lot_size?: number | null;
    is_corporate_location?: boolean;
    additional_features?: string[];
    stealth_mode?: boolean;
    // New fields for Figma redesign
    amenities?: string[];
    locations_of_interest?: any[];
    map_boundaries?: Record<string, any> | null;
    lot_size_min?: number | null;
    lot_size_max?: number | null;
    monthly_budget_min?: number | null;
    monthly_budget_max?: number | null;
  }): Promise<DemandListing> {
    const result = await this.pool.query(
      `INSERT INTO demand_listings (
        id, business_id, title, description, location_name, city, state, address,
        sqft_min, sqft_max, budget_min, budget_max, duration_type, start_date,
        industry, asset_type, requirements, status, lot_size, is_corporate_location,
        additional_features, stealth_mode,
        amenities, locations_of_interest, map_boundaries,
        lot_size_min, lot_size_max, monthly_budget_min, monthly_budget_max
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        uuidv4(),
        data.business_id,
        data.title || null,
        data.description || null,
        data.location_name,
        data.city,
        data.state,
        data.address || null,
        data.sqft_min || null,
        data.sqft_max || null,
        data.budget_min || null,
        data.budget_max || null,
        data.duration_type || null,
        data.start_date || null,
        data.industry || null,
        data.asset_type,
        JSON.stringify(data.requirements || {}),
        data.status || 'active',
        data.lot_size || null,
        data.is_corporate_location || false,
        JSON.stringify(data.additional_features || []),
        data.stealth_mode || false,
        JSON.stringify(data.amenities || []),
        JSON.stringify(data.locations_of_interest || []),
        data.map_boundaries ? JSON.stringify(data.map_boundaries) : null,
        data.lot_size_min || null,
        data.lot_size_max || null,
        data.monthly_budget_min || null,
        data.monthly_budget_max || null,
      ]
    );

    return result.rows[0];
  }

  // Find demand listing by ID
  async findById(id: string): Promise<DemandListing | null> {
    const result = await this.pool.query(
      'SELECT * FROM demand_listings WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all demand listings by business ID
  async findByBusinessId(businessId: string): Promise<DemandListing[]> {
    const result = await this.pool.query(
      'SELECT * FROM demand_listings WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );

    return result.rows;
  }

  // Find active demand listings by business ID
  async findActiveByBusinessId(businessId: string): Promise<DemandListing[]> {
    const result = await this.pool.query(
      "SELECT * FROM demand_listings WHERE business_id = $1 AND status = 'active' ORDER BY created_at DESC",
      [businessId]
    );

    return result.rows;
  }

  // Count demand listings by business ID
  async countByBusinessId(businessId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM demand_listings WHERE business_id = $1',
      [businessId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  // Get distinct states for a business
  async getDistinctStates(businessId: string): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT DISTINCT state FROM demand_listings WHERE business_id = $1 ORDER BY state',
      [businessId]
    );

    return result.rows.map((row) => row.state);
  }

  // Update demand listing
  async update(id: string, data: Partial<DemandListing>): Promise<DemandListing | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Fields that need JSON serialization
    const jsonFields = ['requirements', 'additional_features', 'amenities', 'locations_of_interest', 'map_boundaries'];

    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'business_id' &&
        key !== 'created_at' &&
        value !== undefined
      ) {
        if (jsonFields.includes(key) && (typeof value === 'object' || Array.isArray(value))) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value === null ? null : JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE demand_listings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete demand listing
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM demand_listings WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Find paginated demand listings with optional filters
   * Used by brokers to browse all tenant demands
   *
   * @param limit - Number of listings to return
   * @param offset - Offset for pagination
   * @param filters - Optional filters (location, propertyType, minSqft, maxSqft)
   * @returns Paginated listings and total count
   */
  async findPaginated(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      location?: string;
      propertyType?: string;
      minSqft?: number;
      maxSqft?: number;
    }
  ): Promise<{ listings: DemandListing[]; total: number }> {
    let query = `SELECT * FROM demand_listings WHERE status = 'active'`;
    let countQuery = `SELECT COUNT(*) FROM demand_listings WHERE status = 'active'`;
    const params: any[] = [];
    let paramIndex = 1;

    // Add location filter (city or state)
    if (filters?.location) {
      query += ` AND (city ILIKE $${paramIndex} OR state ILIKE $${paramIndex})`;
      countQuery += ` AND (city ILIKE $${paramIndex} OR state ILIKE $${paramIndex})`;
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    // Add property type filter (asset_type)
    if (filters?.propertyType) {
      query += ` AND asset_type = $${paramIndex}`;
      countQuery += ` AND asset_type = $${paramIndex}`;
      params.push(filters.propertyType);
      paramIndex++;
    }

    // Add min square footage filter
    if (filters?.minSqft) {
      query += ` AND (sqft_max IS NULL OR sqft_max >= $${paramIndex})`;
      countQuery += ` AND (sqft_max IS NULL OR sqft_max >= $${paramIndex})`;
      params.push(filters.minSqft);
      paramIndex++;
    }

    // Add max square footage filter
    if (filters?.maxSqft) {
      query += ` AND (sqft_min IS NULL OR sqft_min <= $${paramIndex})`;
      countQuery += ` AND (sqft_min IS NULL OR sqft_min <= $${paramIndex})`;
      params.push(filters.maxSqft);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute both queries
    const [listingsResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, paramIndex - 1)),
    ]);

    return {
      listings: listingsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Helper methods for JSONB fields (getters/setters)
   */

  /**
   * Parse amenities from JSONB
   *
   * @param listing - Demand listing with JSONB amenities
   * @returns Array of amenity strings
   */
  parseAmenities(listing: DemandListing): string[] {
    if (!listing.amenities) return [];
    if (typeof listing.amenities === 'string') {
      return JSON.parse(listing.amenities);
    }
    return listing.amenities as string[];
  }

  /**
   * Parse locations of interest from JSONB
   *
   * @param listing - Demand listing with JSONB locations_of_interest
   * @returns Array of location objects
   */
  parseLocationsOfInterest(listing: DemandListing): any[] {
    if (!listing.locations_of_interest) return [];
    if (typeof listing.locations_of_interest === 'string') {
      return JSON.parse(listing.locations_of_interest);
    }
    return listing.locations_of_interest as any[];
  }

  /**
   * Parse map boundaries from JSONB
   *
   * @param listing - Demand listing with JSONB map_boundaries
   * @returns Map boundaries object or null
   */
  parseMapBoundaries(listing: DemandListing): Record<string, any> | null {
    if (!listing.map_boundaries) return null;
    if (typeof listing.map_boundaries === 'string') {
      return JSON.parse(listing.map_boundaries);
    }
    return listing.map_boundaries as Record<string, any>;
  }
}
