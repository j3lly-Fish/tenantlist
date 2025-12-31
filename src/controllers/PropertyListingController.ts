import { PropertyListingModel } from '../database/models/PropertyListing';
import { PropertyListingMetricsModel } from '../database/models/PropertyListingMetrics';
import { PropertyDashboardEventService } from '../services/PropertyDashboardEventService';
import { PropertyListing, PropertyListingStatus, PropertyType } from '../types';

/**
 * Property Listing API response types
 */
interface PropertyListingListResponse {
  listings: PropertyListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface PropertyListingDetailResponse {
  listing: PropertyListing;
  metrics: {
    total_views: number;
    total_clicks: number;
    total_inquiries: number;
    total_favorites: number;
    total_shares: number;
  };
}

interface PropertySearchResponse {
  listings: PropertyListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: {
    cities: string[];
    states: string[];
  };
}

/**
 * Controller for property listing endpoints
 * Handles HTTP request/response logic for property listing operations
 */
export class PropertyListingController {
  private propertyListingModel: PropertyListingModel;
  private propertyListingMetricsModel: PropertyListingMetricsModel;
  private eventService: PropertyDashboardEventService;

  constructor(
    propertyListingModel?: PropertyListingModel,
    propertyListingMetricsModel?: PropertyListingMetricsModel,
    eventService?: PropertyDashboardEventService
  ) {
    this.propertyListingModel = propertyListingModel || new PropertyListingModel();
    this.propertyListingMetricsModel = propertyListingMetricsModel || new PropertyListingMetricsModel();
    this.eventService = eventService || new PropertyDashboardEventService();
  }

  /**
   * Handle GET /api/property-listings (for landlords/brokers)
   * List property listings for authenticated user with pagination, filtering, and search
   */
  async listMyListings(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: PropertyListingStatus;
      propertyType?: PropertyType;
      search?: string;
    } = {}
  ): Promise<PropertyListingListResponse> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const result = await this.propertyListingModel.findByUserIdPaginated(
      userId,
      limit,
      offset,
      options.status,
      options.propertyType,
      options.search
    );

    const hasMore = offset + result.listings.length < result.total;

    return {
      listings: result.listings,
      total: result.total,
      page,
      limit,
      hasMore,
    };
  }

  /**
   * Handle GET /api/property-listings/search (public search for tenants)
   * Search all active property listings with filters
   */
  async searchListings(
    filters: {
      city?: string;
      state?: string;
      propertyType?: PropertyType;
      minSqft?: number;
      maxSqft?: number;
      minPrice?: number;
      maxPrice?: number;
      amenities?: string[];
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PropertySearchResponse> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const result = await this.propertyListingModel.search({
      ...filters,
      limit,
      offset,
    });

    // Get available filter options
    const [cities, states] = await Promise.all([
      this.propertyListingModel.getDistinctCities(),
      this.propertyListingModel.getDistinctStates(),
    ]);

    const hasMore = offset + result.listings.length < result.total;

    return {
      listings: result.listings,
      total: result.total,
      page,
      limit,
      hasMore,
      filters: {
        cities,
        states,
      },
    };
  }

  /**
   * Handle GET /api/property-listings/:id
   * Get single property listing with details and metrics
   */
  async getListingById(
    listingId: string,
    userId?: string,
    recordView: boolean = true
  ): Promise<PropertyListingDetailResponse> {
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    // If viewing someone else's listing, record the view
    if (recordView && listing.user_id !== userId) {
      await this.propertyListingMetricsModel.incrementMetric(listingId, 'views');
    }

    // Get metrics for the listing
    const metrics = await this.propertyListingMetricsModel.getAggregatedMetrics(listingId);

    return {
      listing,
      metrics,
    };
  }

  /**
   * Handle POST /api/property-listings
   * Create a new property listing
   */
  async createListing(
    userId: string,
    data: {
      title: string;
      description?: string | null;
      property_type: PropertyType;
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
    }
  ): Promise<PropertyListing> {
    // Validate required fields
    if (!data.title || !data.address || !data.city || !data.state || !data.zip_code || !data.sqft) {
      throw new Error('Title, address, city, state, zip code, and square footage are required');
    }

    // Create the property listing
    const listing = await this.propertyListingModel.create({
      user_id: userId,
      title: data.title,
      description: data.description,
      property_type: data.property_type || PropertyType.OTHER,
      status: PropertyListingStatus.PENDING, // New listings start as pending
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      latitude: data.latitude,
      longitude: data.longitude,
      sqft: data.sqft,
      lot_size: data.lot_size,
      year_built: data.year_built,
      floors: data.floors,
      asking_price: data.asking_price,
      price_per_sqft: data.price_per_sqft,
      lease_type: data.lease_type,
      cam_charges: data.cam_charges,
      available_date: data.available_date,
      min_lease_term: data.min_lease_term,
      max_lease_term: data.max_lease_term,
      amenities: data.amenities,
      highlights: data.highlights,
      photos: data.photos,
      virtual_tour_url: data.virtual_tour_url,
      documents: data.documents,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
    });

    // Emit property-created event
    await this.eventService.onPropertyCreated(userId, listing);

    return listing;
  }

  /**
   * Handle PUT /api/property-listings/:id
   * Update a property listing
   */
  async updateListing(
    listingId: string,
    userId: string,
    data: Partial<PropertyListing>
  ): Promise<PropertyListing> {
    // Find the listing
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    // Verify user owns the listing
    if (listing.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this listing');
    }

    // Update the listing
    const updatedListing = await this.propertyListingModel.update(listingId, data);

    if (!updatedListing) {
      throw new Error('Failed to update property listing');
    }

    // Emit property-updated event
    await this.eventService.onPropertyUpdated(userId, listingId, updatedListing);

    return updatedListing;
  }

  /**
   * Handle PATCH /api/property-listings/:id/status
   * Update property listing status
   */
  async updateListingStatus(
    listingId: string,
    userId: string,
    status: PropertyListingStatus
  ): Promise<PropertyListing> {
    // Find the listing
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    // Verify user owns the listing
    if (listing.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this listing');
    }

    // Capture old status before update
    const oldStatus = listing.status;

    // Update status
    const updatedListing = await this.propertyListingModel.updateStatus(listingId, status);

    if (!updatedListing) {
      throw new Error('Failed to update listing status');
    }

    // Emit status-changed event
    await this.eventService.onStatusChanged(userId, listingId, oldStatus, status);

    return updatedListing;
  }

  /**
   * Handle DELETE /api/property-listings/:id
   * Delete a property listing
   */
  async deleteListing(listingId: string, userId: string): Promise<void> {
    // Find the listing
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    // Verify user owns the listing
    if (listing.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this listing');
    }

    // Delete the listing (metrics will cascade delete)
    const deleted = await this.propertyListingModel.delete(listingId);

    if (!deleted) {
      throw new Error('Failed to delete property listing');
    }

    // Emit property-deleted event
    await this.eventService.onPropertyDeleted(userId, listingId);
  }

  /**
   * Handle GET /api/property-listings/featured
   * Get featured property listings
   */
  async getFeaturedListings(limit: number = 10): Promise<PropertyListing[]> {
    return this.propertyListingModel.getFeatured(limit);
  }

  /**
   * Handle GET /api/property-listings/recent
   * Get recent property listings
   */
  async getRecentListings(limit: number = 10): Promise<PropertyListing[]> {
    return this.propertyListingModel.getRecent(limit);
  }

  /**
   * Handle POST /api/property-listings/:id/inquiry
   * Record an inquiry for a property listing
   */
  async recordInquiry(listingId: string): Promise<void> {
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    await this.propertyListingMetricsModel.incrementMetric(listingId, 'inquiries');
  }

  /**
   * Handle POST /api/property-listings/:id/favorite
   * Record a favorite for a property listing
   */
  async recordFavorite(listingId: string): Promise<void> {
    const listing = await this.propertyListingModel.findById(listingId);

    if (!listing) {
      throw new Error('Property listing not found');
    }

    await this.propertyListingMetricsModel.incrementMetric(listingId, 'favorites');
  }

  /**
   * Get dashboard stats for a landlord/broker
   */
  async getDashboardStats(userId: string): Promise<{
    totalListings: number;
    activeListings: number;
    metrics: {
      total_views: number;
      total_clicks: number;
      total_inquiries: number;
      total_favorites: number;
      total_shares: number;
    };
  }> {
    const [totalListings, activeListings, metrics] = await Promise.all([
      this.propertyListingModel.countByUserId(userId),
      this.propertyListingModel.countActiveByUserId(userId),
      this.propertyListingMetricsModel.getAggregatedMetricsByUserId(userId),
    ]);

    return {
      totalListings,
      activeListings,
      metrics,
    };
  }
}
