import { getDashboardSocket } from '../websocket/dashboardSocket';
import { PropertyKPIService } from './PropertyKPIService';
import { PropertyListing } from '../types';

/**
 * Service for emitting property dashboard WebSocket events
 * Triggers real-time updates when property data changes
 */
export class PropertyDashboardEventService {
  private kpiService: PropertyKPIService;

  constructor(kpiService?: PropertyKPIService) {
    this.kpiService = kpiService || new PropertyKPIService();
  }

  /**
   * Emit event when a new property is created
   *
   * @param userId - ID of the user who owns the property
   * @param property - The newly created property
   */
  async onPropertyCreated(userId: string, property: PropertyListing): Promise<void> {
    try {
      // Invalidate cached KPIs
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.log('WebSocket server not initialized, skipping event emission');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        console.log(`User ${userId} not connected, skipping property:created emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitPropertyCreated(userId, property);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Property created event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting property created event:', error);
    }
  }

  /**
   * Emit event when a property is updated
   *
   * @param userId - ID of the user who owns the property
   * @param propertyId - ID of the updated property
   * @param property - The updated property
   */
  async onPropertyUpdated(
    userId: string,
    propertyId: string,
    property: PropertyListing
  ): Promise<void> {
    try {
      // Invalidate cached KPIs (update might affect metrics)
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.log('WebSocket server not initialized, skipping event emission');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        console.log(`User ${userId} not connected, skipping property:updated emission`);
        return;
      }

      // Calculate new KPIs (in case update affected metrics)
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitPropertyUpdated(userId, propertyId, property);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Property updated event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting property updated event:', error);
    }
  }

  /**
   * Emit event when a property is deleted
   *
   * @param userId - ID of the user who owns the property
   * @param propertyId - ID of the deleted property
   */
  async onPropertyDeleted(userId: string, propertyId: string): Promise<void> {
    try {
      // Invalidate cached KPIs
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.log('WebSocket server not initialized, skipping event emission');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        console.log(`User ${userId} not connected, skipping property:deleted emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitPropertyDeleted(userId, propertyId);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Property deleted event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting property deleted event:', error);
    }
  }

  /**
   * Emit event when a property status changes
   *
   * @param userId - ID of the user who owns the property
   * @param propertyId - ID of the property
   * @param oldStatus - Previous status
   * @param newStatus - New status
   */
  async onStatusChanged(
    userId: string,
    propertyId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      // Invalidate cached KPIs (status change affects activeListings KPI)
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.log('WebSocket server not initialized, skipping event emission');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        console.log(`User ${userId} not connected, skipping status-changed emission`);
        return;
      }

      // Calculate new KPIs (status affects activeListings count)
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitStatusChanged(userId, propertyId, oldStatus, newStatus);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Property status changed event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting status changed event:', error);
    }
  }

  /**
   * Manually trigger KPI recalculation and emit update
   * Useful for batch updates or scheduled recalculations
   *
   * @param userId - ID of the user
   */
  async triggerKPIUpdate(userId: string): Promise<void> {
    try {
      // Invalidate cache
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.log('WebSocket server not initialized, skipping event emission');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        console.log(`User ${userId} not connected, skipping KPI update emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit update
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Property KPI update triggered for user ${userId}`);
    } catch (error) {
      console.error('Error triggering property KPI update:', error);
    }
  }
}
