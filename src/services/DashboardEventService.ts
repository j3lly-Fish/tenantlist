import { getDashboardSocket } from '../websocket/dashboardSocket';
import { KPIService } from './KPIService';
import { Business } from '../types';

/**
 * Service for emitting dashboard-related WebSocket events
 * Triggers real-time updates when business or metrics data changes
 */
export class DashboardEventService {
  private kpiService: KPIService;

  constructor(kpiService?: KPIService) {
    this.kpiService = kpiService || new KPIService();
  }

  /**
   * Emit event when business metrics are updated
   * Recalculates KPIs and sends update to user
   *
   * @param userId - ID of the user who owns the business
   * @param businessId - ID of the business whose metrics changed
   */
  async onMetricsUpdated(userId: string, businessId: string): Promise<void> {
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
        console.log(`User ${userId} not connected, skipping KPI update emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.calculateDashboardKPIs(userId);

      // Emit KPI update event
      socketServer.emitKPIUpdate(userId, kpis);

      // Emit metrics updated event
      socketServer.emitMetricsUpdated(userId, businessId);

      console.log(`Dashboard events emitted for user ${userId} after metrics update`);
    } catch (error) {
      console.error('Error emitting metrics updated event:', error);
    }
  }

  /**
   * Emit event when a new business is created
   *
   * @param userId - ID of the user who owns the business
   * @param business - The newly created business
   */
  async onBusinessCreated(userId: string, business: Business): Promise<void> {
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
        console.log(`User ${userId} not connected, skipping business:created emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.calculateDashboardKPIs(userId);

      // Emit events
      socketServer.emitBusinessCreated(userId, business);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Business created event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting business created event:', error);
    }
  }

  /**
   * Emit event when a business is updated
   *
   * @param userId - ID of the user who owns the business
   * @param business - The updated business
   */
  async onBusinessUpdated(userId: string, business: Business): Promise<void> {
    try {
      // Invalidate cached KPIs (status change might affect active count)
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
        console.log(`User ${userId} not connected, skipping business:updated emission`);
        return;
      }

      // Calculate new KPIs (in case status changed)
      const kpis = await this.kpiService.calculateDashboardKPIs(userId);

      // Emit events
      socketServer.emitBusinessUpdated(userId, business);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Business updated event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting business updated event:', error);
    }
  }

  /**
   * Emit event when a business is deleted
   *
   * @param userId - ID of the user who owns the business
   * @param businessId - ID of the deleted business
   */
  async onBusinessDeleted(userId: string, businessId: string): Promise<void> {
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
        console.log(`User ${userId} not connected, skipping business:deleted emission`);
        return;
      }

      // Calculate new KPIs
      const kpis = await this.kpiService.calculateDashboardKPIs(userId);

      // Emit events
      socketServer.emitBusinessDeleted(userId, businessId);
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`Business deleted event emitted for user ${userId}`);
    } catch (error) {
      console.error('Error emitting business deleted event:', error);
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
      const kpis = await this.kpiService.calculateDashboardKPIs(userId);

      // Emit update
      socketServer.emitKPIUpdate(userId, kpis);

      console.log(`KPI update triggered for user ${userId}`);
    } catch (error) {
      console.error('Error triggering KPI update:', error);
    }
  }
}
