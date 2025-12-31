import { BrokerKPIService } from './BrokerKPIService';
import { getDashboardSocket } from '../websocket/dashboardSocket';

/**
 * Broker deal data structure
 */
export interface BrokerDeal {
  id: string;
  broker_user_id: string;
  tenant_business_id?: string | null;
  property_id?: string | null;
  demand_listing_id?: string | null;
  status: 'prospecting' | 'touring' | 'offer_submitted' | 'signed' | 'lost';
  commission_percentage?: number | null;
  estimated_commission?: number | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date | null;
}

/**
 * Service for handling broker dashboard real-time events
 * Emits WebSocket events and manages cache invalidation for broker KPIs
 */
export class BrokerDashboardEventService {
  private kpiService: BrokerKPIService;

  constructor(kpiService?: BrokerKPIService) {
    this.kpiService = kpiService || new BrokerKPIService();
  }

  /**
   * Handle broker deal created event
   * Invalidates cache, fetches fresh KPIs, and emits WebSocket events
   *
   * @param userId - ID of the broker user
   * @param deal - The created deal
   */
  async onDealCreated(userId: string, deal: BrokerDeal): Promise<void> {
    try {
      // Invalidate KPI cache
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.warn('Dashboard WebSocket server not initialized');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        return;
      }

      // Fetch fresh KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitBrokerDealCreated(userId, deal);
      socketServer.emitKPIUpdate(userId, kpis);
    } catch (error) {
      console.error('Error emitting broker deal created event:', error);
    }
  }

  /**
   * Handle broker deal updated event
   * Invalidates cache, fetches fresh KPIs, and emits WebSocket events
   *
   * @param userId - ID of the broker user
   * @param deal - The updated deal
   */
  async onDealUpdated(userId: string, deal: BrokerDeal): Promise<void> {
    try {
      // Invalidate KPI cache
      await this.kpiService.invalidateCache(userId);

      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.warn('Dashboard WebSocket server not initialized');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        return;
      }

      // Fetch fresh KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit events
      socketServer.emitBrokerDealUpdated(userId, deal);
      socketServer.emitKPIUpdate(userId, kpis);
    } catch (error) {
      console.error('Error emitting broker deal updated event:', error);
    }
  }

  /**
   * Trigger a KPI update without a specific deal change
   * Useful for scheduled updates or manual refresh
   *
   * @param userId - ID of the broker user
   */
  async triggerKPIUpdate(userId: string): Promise<void> {
    try {
      // Get WebSocket server
      const socketServer = getDashboardSocket();
      if (!socketServer) {
        console.warn('Dashboard WebSocket server not initialized');
        return;
      }

      // Check if user is connected
      const isConnected = await socketServer.isUserConnected(userId);
      if (!isConnected) {
        return;
      }

      // Fetch KPIs
      const kpis = await this.kpiService.getKPIs(userId);

      // Emit KPI update
      socketServer.emitKPIUpdate(userId, kpis);
    } catch (error) {
      console.error('Error emitting broker KPI update:', error);
    }
  }
}

// Export singleton instance
export const brokerDashboardEventService = new BrokerDashboardEventService();
