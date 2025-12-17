import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessLocation } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class BusinessLocationModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new business location
  async create(data: {
    business_id: string;
    city: string;
    state: string;
    address: string | null;
  }): Promise<BusinessLocation> {
    const result = await this.pool.query(
      `INSERT INTO business_locations (id, business_id, city, state, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), data.business_id, data.city, data.state, data.address]
    );

    return result.rows[0];
  }

  // Find location by ID
  async findById(id: string): Promise<BusinessLocation | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_locations WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all locations for a business
  async findByBusinessId(businessId: string): Promise<BusinessLocation[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_locations WHERE business_id = $1 ORDER BY created_at ASC',
      [businessId]
    );

    return result.rows;
  }

  // Update location
  async update(
    id: string,
    data: Partial<BusinessLocation>
  ): Promise<BusinessLocation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'business_id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE business_locations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete location
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM business_locations WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  // Count locations for a business
  async countByBusinessId(businessId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM business_locations WHERE business_id = $1',
      [businessId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}
