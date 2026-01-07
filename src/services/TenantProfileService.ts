import { Pool } from 'pg';
import pool from '../config/database';
import { TenantPublicProfileModel, TenantPublicProfile } from '../database/models/TenantPublicProfile';
import { TenantProfileImageModel } from '../database/models/TenantProfileImage';
import { TenantProfileDocumentModel } from '../database/models/TenantProfileDocument';
import { TenantLocationModel } from '../database/models/TenantLocation';

/**
 * Tenant profile with all related data
 */
export interface TenantProfileWithDetails extends TenantPublicProfile {
  images?: any[];
  documents?: any[];
  locations?: any[];
}

/**
 * Search result with pagination
 */
export interface TenantSearchResult {
  profiles: TenantPublicProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service for managing tenant public profiles
 * Implements pagination using existing findPaginated pattern
 */
export class TenantProfileService {
  private pool: Pool;
  private tenantProfileModel: TenantPublicProfileModel;
  private imageModel: TenantProfileImageModel;
  private documentModel: TenantProfileDocumentModel;
  private locationModel: TenantLocationModel;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
    this.tenantProfileModel = new TenantPublicProfileModel(this.pool);
    this.imageModel = new TenantProfileImageModel(this.pool);
    this.documentModel = new TenantProfileDocumentModel(this.pool);
    this.locationModel = new TenantLocationModel(this.pool);
  }

  /**
   * Search tenant profiles with filters and pagination
   *
   * @param filters - Search filters (search, category, location, page, limit)
   * @returns Paginated search results
   */
  async search(filters: {
    search?: string;
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<TenantSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { profiles, total } = await this.tenantProfileModel.findPaginated(
      limit,
      offset,
      {
        search: filters.search,
        category: filters.category,
        location: filters.location,
      }
    );

    return {
      profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get tenant profile by ID with images, documents, and locations
   *
   * @param tenantId - Tenant profile ID
   * @returns Tenant profile with all related data or null
   */
  async getById(tenantId: string): Promise<TenantProfileWithDetails | null> {
    const profile = await this.tenantProfileModel.findById(tenantId);
    if (!profile) {
      return null;
    }

    // Fetch related data in parallel
    const [images, documents, locations] = await Promise.all([
      this.imageModel.findByTenantProfileId(tenantId),
      this.documentModel.findByTenantProfileId(tenantId),
      this.locationModel.findByTenantProfileId(tenantId),
    ]);

    return {
      ...profile,
      images,
      documents,
      locations,
    };
  }

  /**
   * Get all locations for a tenant
   *
   * @param tenantId - Tenant profile ID
   * @returns Array of tenant locations
   */
  async getLocations(tenantId: string): Promise<any[]> {
    return this.locationModel.findByTenantProfileId(tenantId);
  }

  /**
   * Create a new tenant profile
   *
   * @param businessId - Business ID (optional)
   * @param profileData - Tenant profile data
   * @returns Created tenant profile
   */
  async create(
    businessId: string | null,
    profileData: {
      display_name: string;
      cover_image_url?: string;
      logo_url?: string;
      category?: string;
      about?: string;
      website_url?: string;
      instagram_url?: string;
      linkedin_url?: string;
      tenant_pin?: string;
      contact_email?: string;
    }
  ): Promise<TenantPublicProfile> {
    return this.tenantProfileModel.create({
      business_id: businessId,
      ...profileData,
    });
  }

  /**
   * Update tenant profile
   *
   * @param tenantId - Tenant profile ID
   * @param data - Partial profile data to update
   * @returns Updated profile or null if not found
   */
  async update(
    tenantId: string,
    data: Partial<TenantPublicProfile>
  ): Promise<TenantPublicProfile | null> {
    return this.tenantProfileModel.update(tenantId, data);
  }

  /**
   * Add image to tenant profile
   *
   * @param tenantId - Tenant profile ID
   * @param imageUrl - Image URL
   * @param displayOrder - Display order (optional)
   * @returns Created image record
   */
  async addImage(
    tenantId: string,
    imageUrl: string,
    displayOrder?: number
  ): Promise<any> {
    return this.imageModel.create({
      tenant_profile_id: tenantId,
      image_url: imageUrl,
      display_order: displayOrder || 0,
    });
  }

  /**
   * Add document to tenant profile
   *
   * @param tenantId - Tenant profile ID
   * @param docData - Document data
   * @returns Created document record
   */
  async addDocument(
    tenantId: string,
    docData: {
      document_name: string;
      document_url: string;
      document_type: 'pdf' | 'image' | 'doc' | 'xlsx' | 'other';
    }
  ): Promise<any> {
    return this.documentModel.create({
      tenant_profile_id: tenantId,
      ...docData,
    });
  }

  /**
   * Add location to tenant profile
   *
   * @param tenantId - Tenant profile ID
   * @param locationData - Location data
   * @returns Created location record
   */
  async addLocation(
    tenantId: string,
    locationData: {
      location_name: string;
      city?: string;
      state?: string;
      asset_type?: string;
      sqft_min?: number;
      sqft_max?: number;
      preferred_lease_term?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<any> {
    return this.locationModel.create({
      tenant_profile_id: tenantId,
      ...locationData,
    });
  }
}
