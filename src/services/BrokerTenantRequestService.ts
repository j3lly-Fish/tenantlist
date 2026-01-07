import { Pool } from 'pg';
import pool from '../config/database';
import { BrokerTenantRequestModel, BrokerTenantRequest } from '../database/models/BrokerTenantRequest';
import { TenantPublicProfileModel } from '../database/models/TenantPublicProfile';
import { getDashboardSocket } from '../websocket/dashboardSocket';

/**
 * Service for managing broker-tenant approval requests
 * Handles PIN verification and admin approval workflow
 */
export class BrokerTenantRequestService {
  private pool: Pool;
  private requestModel: BrokerTenantRequestModel;
  private tenantModel: TenantPublicProfileModel;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
    this.requestModel = new BrokerTenantRequestModel(this.pool);
    this.tenantModel = new TenantPublicProfileModel(this.pool);
  }

  /**
   * Create a new broker-tenant request
   *
   * @param brokerId - Broker user ID
   * @param businessId - Business profile ID (optional)
   * @param tenantId - Tenant profile ID
   * @param email - Tenant email for verification
   * @param pin - Tenant PIN for verification
   * @returns Created request
   */
  async createRequest(
    brokerId: string,
    businessId: string | null,
    tenantId: string,
    email: string,
    pin: string
  ): Promise<BrokerTenantRequest> {
    // Check if broker already has a request for this tenant
    const existingRequest = await this.requestModel.findExistingRequest(brokerId, tenantId);

    if (existingRequest && existingRequest.status === 'pending') {
      throw new Error('A pending request already exists for this tenant');
    }

    if (existingRequest && existingRequest.status === 'approved') {
      throw new Error('You already have approved access to this tenant');
    }

    // Verify tenant exists
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant profile not found');
    }

    // Create request (PIN verification will be done during admin review)
    return this.requestModel.create({
      broker_user_id: brokerId,
      business_profile_id: businessId,
      tenant_profile_id: tenantId,
      tenant_email: email,
      tenant_pin: pin,
    });
  }

  /**
   * Verify tenant PIN
   *
   * @param tenantId - Tenant profile ID
   * @param pin - PIN to verify
   * @returns True if PIN matches, false otherwise
   */
  async verifyPin(tenantId: string, pin: string): Promise<boolean> {
    const tenant = await this.tenantModel.findById(tenantId);

    if (!tenant || !tenant.tenant_pin) {
      return false;
    }

    return tenant.tenant_pin === pin;
  }

  /**
   * Get request status
   *
   * @param requestId - Request ID
   * @returns Request or null if not found
   */
  async getRequestStatus(requestId: string): Promise<BrokerTenantRequest | null> {
    return this.requestModel.findById(requestId);
  }

  /**
   * Approve a broker-tenant request (admin action)
   *
   * @param requestId - Request ID
   * @param adminId - Admin user ID performing the approval
   * @returns Approved request or null if not found
   */
  async approveRequest(requestId: string, adminId: string): Promise<BrokerTenantRequest | null> {
    // Get request first to verify PIN
    const request = await this.requestModel.findById(requestId);

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    // Verify PIN before approving
    const isPinValid = await this.verifyPin(
      request.tenant_profile_id,
      request.tenant_pin || ''
    );

    if (!isPinValid) {
      throw new Error('Invalid tenant PIN - cannot approve request');
    }

    // Approve request
    const approvedRequest = await this.requestModel.approve(requestId, adminId);

    // Emit WebSocket event to notify broker
    if (approvedRequest) {
      try {
        const socketServer = getDashboardSocket();
        if (socketServer) {
          const isConnected = await socketServer.isUserConnected(request.broker_user_id);
          if (isConnected) {
            socketServer.getNamespace().to(`user:${request.broker_user_id}`).emit('broker:tenant-approved', {
              request: approvedRequest,
              timestamp: new Date().toISOString(),
            });
            console.log(`Emitted broker:tenant-approved to user:${request.broker_user_id}`);
          }
        }
      } catch (error) {
        console.error('Error emitting broker:tenant-approved event:', error);
        // Don't throw - approval succeeded, WebSocket notification is optional
      }
    }

    return approvedRequest;
  }

  /**
   * Reject a broker-tenant request (admin action)
   *
   * @param requestId - Request ID
   * @param adminId - Admin user ID performing the rejection
   * @param reason - Rejection reason (optional)
   * @returns Rejected request or null if not found
   */
  async rejectRequest(
    requestId: string,
    adminId: string,
    reason?: string
  ): Promise<BrokerTenantRequest | null> {
    const request = await this.requestModel.findById(requestId);

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    return this.requestModel.reject(requestId, adminId);
  }

  /**
   * Get requests by broker user ID
   *
   * @param brokerId - Broker user ID
   * @param page - Page number (default 1)
   * @param limit - Results per page (default 20)
   * @param status - Optional status filter
   * @returns Paginated requests
   */
  async getRequestsByBroker(
    brokerId: string,
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{ requests: BrokerTenantRequest[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { requests, total } = await this.requestModel.findByBrokerUserId(
      brokerId,
      limit,
      offset,
      status
    );

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get pending requests for admin review
   *
   * @param page - Page number (default 1)
   * @param limit - Results per page (default 20)
   * @returns Paginated pending requests
   */
  async getPendingRequests(
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: BrokerTenantRequest[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { requests, total } = await this.requestModel.findPending(limit, offset);

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
