import { Pool } from 'pg';
import pool from '../../config/database';
import { PropertyListing, PropertyListingStatus, PropertyType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class PropertyListingModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new property listing
   */
  async create(data: {
    user_id: string;
    title: string;
    description?: string | null;
    property_type: PropertyType;
    status?: PropertyListingStatus;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number | null;
    longitude?: number | null;
    sqft: number;
    lot_size?: number | null;
    year_built?: number | null;
    floors?: number | null;
    asking_price?: number | null;
    price_per_sqft?: number | null;
    lease_type?: string | null;
    cam_charges?: number | null;
    available_date?: string | null;
    min_lease_term?: string | null;
    max_lease_term?: string | null;
    amenities?: string[];
    highlights?: string[];
    photos?: Array<{ url: string; caption?: string; order?: number }>;
    virtual_tour_url?: string | null;
    documents?: Array<{ name: string; url: string; type?: string; size?: number }>;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    is_featured?: boolean;
    is_verified?: boolean;
  }): Promise<PropertyListing> {
    const result = await this.pool.query(
      `INSERT INTO property_listings (
        id, user_id, title, description, property_type, status,
        address, city, state, zip_code, latitude, longitude,
        sqft, lot_size, year_built, floors,
        asking_price, price_per_sqft, lease_type, cam_charges,
        available_date, min_lease_term, max_lease_term,
        amenities, highlights, photos, virtual_tour_url, documents,
        contact_name, contact_email, contact_phone,
        is_featured, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      RETURNING *`,
      [
        uuidv4(),
        data.user_id,
        data.title,
        data.description || null,
        data.property_type,
        data.status || 'pending',
        data.address,
        data.city,
        data.state,
        data.zip_code,
        data.latitude || null,
        data.longitude || null,
        data.sqft,
        data.lot_size || null,
        data.year_built || null,
        data.floors || null,
        data.asking_price || null,
        data.price_per_sqft || null,
        data.lease_type || null,
        data.cam_charges || null,
        data.available_date || null,
        data.min_lease_term || null,
        data.max_lease_term || null,
        JSON.stringify(data.amenities || []),
        JSON.stringify(data.highlights || []),
        JSON.stringify(data.photos || []),
        data.virtual_tour_url || null,
        JSON.stringify(data.documents || []),
        data.contact_name || null,
        data.contact_email || null,
        data.contact_phone || null,
        data.is_featured || false,
        data.is_verified || false,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find property listing by ID
   */
  async findById(id: string): Promise<PropertyListing | null> {
    const result = await this.pool.query(
      'SELECT * FROM property_listings WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find property listings by user ID
   */
  async findByUserId(userId: string): Promise<PropertyListing[]> {
    const result = await this.pool.query(
      'SELECT * FROM property_listings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  /**
   * Find property listings by user ID with pagination, filtering, and search
   */
  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number,
    status?: PropertyListingStatus,
    propertyType?: PropertyType,
    search?: string
  ): Promise<{ listings: PropertyListing[]; total: number }> {
    let query = `
      SELECT * FROM property_listings
      WHERE user_id = $1
    `;
    let countQuery = `
      SELECT COUNT(*) as count FROM property_listings
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add status filter
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add property type filter
    if (propertyType) {
      query += ` AND property_type = $${paramIndex}`;
      countQuery += ` AND property_type = $${paramIndex}`;
      params.push(propertyType);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      query += ` AND (
        title ILIKE $${paramIndex}
        OR address ILIKE $${paramIndex}
        OR city ILIKE $${paramIndex}
        OR state ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`;
      countQuery += ` AND (
        title ILIKE $${paramIndex}
        OR address ILIKE $${paramIndex}
        OR city ILIKE $${paramIndex}
        OR state ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute queries
    const [listingsResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2)), // Remove limit and offset for count
    ]);

    return {
      listings: listingsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Search property listings (public search for tenants)
   */
  async search(filters: {
    city?: string;
    state?: string;
    propertyType?: PropertyType;
    minSqft?: number;
    maxSqft?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ listings: PropertyListing[]; total: number }> {
    let query = `
      SELECT * FROM property_listings
      WHERE status = 'active'
    `;
    let countQuery = `
      SELECT COUNT(*) as count FROM property_listings
      WHERE status = 'active'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // City filter
    if (filters.city) {
      query += ` AND city ILIKE $${paramIndex}`;
      countQuery += ` AND city ILIKE $${paramIndex}`;
      params.push(`%${filters.city}%`);
      paramIndex++;
    }

    // State filter
    if (filters.state) {
      query += ` AND state = $${paramIndex}`;
      countQuery += ` AND state = $${paramIndex}`;
      params.push(filters.state);
      paramIndex++;
    }

    // Property type filter
    if (filters.propertyType) {
      query += ` AND property_type = $${paramIndex}`;
      countQuery += ` AND property_type = $${paramIndex}`;
      params.push(filters.propertyType);
      paramIndex++;
    }

    // Square footage range
    if (filters.minSqft) {
      query += ` AND sqft >= $${paramIndex}`;
      countQuery += ` AND sqft >= $${paramIndex}`;
      params.push(filters.minSqft);
      paramIndex++;
    }
    if (filters.maxSqft) {
      query += ` AND sqft <= $${paramIndex}`;
      countQuery += ` AND sqft <= $${paramIndex}`;
      params.push(filters.maxSqft);
      paramIndex++;
    }

    // Price range
    if (filters.minPrice) {
      query += ` AND asking_price >= $${paramIndex}`;
      countQuery += ` AND asking_price >= $${paramIndex}`;
      params.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice) {
      query += ` AND asking_price <= $${paramIndex}`;
      countQuery += ` AND asking_price <= $${paramIndex}`;
      params.push(filters.maxPrice);
      paramIndex++;
    }

    // Amenities filter (JSON contains)
    if (filters.amenities && filters.amenities.length > 0) {
      query += ` AND amenities ?| $${paramIndex}`;
      countQuery += ` AND amenities ?| $${paramIndex}`;
      params.push(filters.amenities);
      paramIndex++;
    }

    // Text search
    if (filters.search) {
      query += ` AND (
        title ILIKE $${paramIndex}
        OR address ILIKE $${paramIndex}
        OR city ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`;
      countQuery += ` AND (
        title ILIKE $${paramIndex}
        OR address ILIKE $${paramIndex}
        OR city ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Ordering - featured first, then by date
    query += ` ORDER BY is_featured DESC, created_at DESC`;

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute queries
    const [listingsResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2)),
    ]);

    return {
      listings: listingsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Count property listings by user ID
   */
  async countByUserId(userId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM property_listings WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Count active property listings by user ID
   */
  async countActiveByUserId(userId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM property_listings WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get featured property listings
   */
  async getFeatured(limit: number = 10): Promise<PropertyListing[]> {
    const result = await this.pool.query(
      `SELECT * FROM property_listings
       WHERE status = 'active' AND is_featured = true
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get recent property listings
   */
  async getRecent(limit: number = 10): Promise<PropertyListing[]> {
    const result = await this.pool.query(
      `SELECT * FROM property_listings
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Update property listing
   */
  async update(id: string, data: Partial<PropertyListing>): Promise<PropertyListing | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Fields that need JSON serialization
    const jsonFields = ['amenities', 'highlights', 'photos', 'documents'];

    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'user_id' &&
        key !== 'created_at' &&
        value !== undefined
      ) {
        if (jsonFields.includes(key) && (typeof value === 'object' || Array.isArray(value))) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
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
      `UPDATE property_listings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update property listing status
   */
  async updateStatus(id: string, status: PropertyListingStatus): Promise<PropertyListing | null> {
    const result = await this.pool.query(
      `UPDATE property_listings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete property listing
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM property_listings WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get distinct cities for property listings
   */
  async getDistinctCities(): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT city FROM property_listings WHERE status = 'active' ORDER BY city`
    );

    return result.rows.map((row) => row.city);
  }

  /**
   * Get distinct states for property listings
   */
  async getDistinctStates(): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT state FROM property_listings WHERE status = 'active' ORDER BY state`
    );

    return result.rows.map((row) => row.state);
  }
}
