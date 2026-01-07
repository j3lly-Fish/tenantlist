import { TenantProfileService, TenantProfileWithDetails, TenantSearchResult } from '../services/TenantProfileService';
import { BrokerTenantRequestService } from '../services/BrokerTenantRequestService';

/**
 * Response type for tenant profile requests
 */
export interface TenantRequestResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

/**
 * Response type for contact message
 */
export interface ContactMessageResponse {
  success: boolean;
  message: string;
}

/**
 * Controller for tenant public profile endpoints
 * Handles HTTP request/response logic for tenant profile operations
 * Follows pattern from BrokerDashboardController
 */
export class TenantProfileController {
  private tenantProfileService: TenantProfileService;
  private brokerTenantRequestService: BrokerTenantRequestService;

  constructor(
    tenantProfileService?: TenantProfileService,
    brokerTenantRequestService?: BrokerTenantRequestService
  ) {
    this.tenantProfileService = tenantProfileService || new TenantProfileService();
    this.brokerTenantRequestService = brokerTenantRequestService || new BrokerTenantRequestService();
  }

  /**
   * Handle GET /api/broker/tenants
   * Search public tenant profiles with pagination
   *
   * @param filters - Search filters (search, category, location, page, limit)
   * @returns Paginated tenant profiles with ratings
   */
  async searchTenantProfiles(filters: {
    search?: string;
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<TenantSearchResult> {
    const page = filters.page || 1;
    const limit = Math.min(100, filters.limit || 20); // Max 100 per page

    return await this.tenantProfileService.search({
      search: filters.search,
      category: filters.category,
      location: filters.location,
      page,
      limit,
    });
  }

  /**
   * Handle GET /api/broker/tenants/:id
   * Get full tenant profile with images, documents, and locations
   *
   * @param tenantId - Tenant profile ID
   * @returns Tenant profile with embedded images, documents, locations arrays
   * @throws Error if profile not found
   */
  async getTenantProfile(tenantId: string): Promise<TenantProfileWithDetails> {
    const profile = await this.tenantProfileService.getById(tenantId);

    if (!profile) {
      throw new Error('Tenant profile not found');
    }

    return profile;
  }

  /**
   * Handle POST /api/broker/tenants/:id/request
   * Request admin approval to add tenant
   *
   * @param tenantId - Tenant profile ID
   * @param brokerId - ID of authenticated broker user
   * @param businessProfileId - Business profile ID
   * @param requestData - Request data (tenant_email, tenant_pin)
   * @returns Request ID and status
   * @throws Error if validation fails
   */
  async requestAdminApproval(
    tenantId: string,
    brokerId: string,
    businessProfileId: string,
    requestData: {
      tenant_email: string;
      tenant_pin: string;
    }
  ): Promise<TenantRequestResponse> {
    // Validate required fields
    if (!requestData.tenant_email) {
      throw new Error('tenant_email is required');
    }

    if (!requestData.tenant_pin) {
      throw new Error('tenant_pin is required');
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.tenant_email)) {
      throw new Error('Invalid email format');
    }

    // Verify tenant profile exists
    const tenantProfile = await this.tenantProfileService.getById(tenantId);
    if (!tenantProfile) {
      throw new Error('Tenant profile not found');
    }

    // Create request
    const request = await this.brokerTenantRequestService.createRequest(
      brokerId,
      businessProfileId,
      tenantId,
      requestData.tenant_email,
      requestData.tenant_pin
    );

    return {
      requestId: request.id,
      status: request.status as 'pending' | 'approved' | 'rejected',
      message: 'Request submitted successfully. Awaiting admin approval.',
    };
  }

  /**
   * Handle POST /api/broker/tenants/:id/contact
   * Send message to tenant
   *
   * @param tenantId - Tenant profile ID
   * @param brokerId - ID of authenticated broker user
   * @param contactData - Contact message data (message, subject)
   * @returns Message sent confirmation
   * @throws Error if validation fails
   */
  async contactTenant(
    tenantId: string,
    brokerId: string,
    contactData: {
      message: string;
      subject: string;
    }
  ): Promise<ContactMessageResponse> {
    // Validate required fields
    if (!contactData.message) {
      throw new Error('message is required');
    }

    if (!contactData.subject) {
      throw new Error('subject is required');
    }

    // Verify tenant profile exists
    const tenantProfile = await this.tenantProfileService.getById(tenantId);
    if (!tenantProfile) {
      throw new Error('Tenant profile not found');
    }

    // TODO: In a real implementation, this would integrate with a messaging service
    // For now, we'll just validate and return success
    // This could be extended to:
    // 1. Create a message record in database
    // 2. Send email notification to tenant
    // 3. Create a notification in the notification system
    // 4. Emit WebSocket event for real-time delivery

    console.log(`Contact message from broker ${brokerId} to tenant ${tenantId}:`, {
      subject: contactData.subject,
      message: contactData.message,
      tenantEmail: tenantProfile.contact_email,
    });

    return {
      success: true,
      message: 'Message sent successfully',
    };
  }

  /**
   * Handle GET /api/broker/tenants/:id/locations
   * Get all locations for a tenant profile
   *
   * @param tenantId - Tenant profile ID
   * @returns Array of tenant locations
   * @throws Error if tenant profile not found
   */
  async getTenantLocations(tenantId: string): Promise<any[]> {
    // Verify tenant profile exists
    const tenantProfile = await this.tenantProfileService.getById(tenantId);
    if (!tenantProfile) {
      throw new Error('Tenant profile not found');
    }

    const locations = await this.tenantProfileService.getLocations(tenantId);
    return locations;
  }
}
