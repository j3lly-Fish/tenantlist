import { Router, Request, Response } from 'express';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import pool from '../config/database';

const router = Router();
const roleGuard = new RoleGuardMiddleware();

/**
 * Extended Request interface with authenticated user data
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * GET /api/performance/metrics
 * Get performance metrics for tenant user
 */
router.get('/metrics', roleGuard.requireTenant(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.query;

    // Get user's businesses
    const businessesResult = await pool.query(
      `SELECT id FROM businesses WHERE user_id = $1`,
      [userId]
    );
    const businessIds = businessesResult.rows.map((row: any) => row.id);

    if (businessIds.length === 0) {
      return res.json({
        success: true,
        data: {
          propertyInvites: 0,
          declined: { count: 0, percentage: 0 },
          messages: { total: 0, unread: 0 },
          qfps: 0,
        },
      });
    }

    // Filter by specific business if requested
    const targetBusinessIds = businessId && businessId !== 'all'
      ? [businessId]
      : businessIds;

    // Get QFPs count (demand_listings)
    const qfpsResult = await pool.query(
      `SELECT COUNT(*) as count FROM demand_listings
       WHERE business_id = ANY($1) AND status = 'active'`,
      [targetBusinessIds]
    );
    const qfpsCount = parseInt(qfpsResult.rows[0].count);

    // Get demand listing IDs for the businesses
    const demandListingsResult = await pool.query(
      `SELECT id FROM demand_listings WHERE business_id = ANY($1)`,
      [targetBusinessIds]
    );
    const demandListingIds = demandListingsResult.rows.map((row: any) => row.id);

    if (demandListingIds.length === 0) {
      return res.json({
        success: true,
        data: {
          propertyInvites: 0,
          declined: { count: 0, percentage: 0 },
          messages: { total: 0, unread: 0 },
          qfps: qfpsCount,
        },
      });
    }

    // Get property invites (property_matches)
    const invitesResult = await pool.query(
      `SELECT COUNT(*) as count FROM property_matches
       WHERE demand_listing_id = ANY($1)`,
      [demandListingIds]
    );
    const propertyInvites = parseInt(invitesResult.rows[0].count);

    // Get declined invites
    const declinedResult = await pool.query(
      `SELECT COUNT(*) as count FROM property_matches
       WHERE demand_listing_id = ANY($1) AND is_dismissed = true`,
      [demandListingIds]
    );
    const declinedCount = parseInt(declinedResult.rows[0].count);
    const declinedPercentage = propertyInvites > 0
      ? Math.round((declinedCount / propertyInvites) * 100)
      : 0;

    // Get messages count for user
    const messagesResult = await pool.query(
      `SELECT
         COUNT(*) as total_messages,
         COALESCE(SUM(unread_count), 0) as unread_count
       FROM conversation_participants
       WHERE user_id = $1 AND left_at IS NULL`,
      [userId]
    );
    const totalMessages = parseInt(messagesResult.rows[0].total_messages);
    const unreadMessages = parseInt(messagesResult.rows[0].unread_count);

    res.json({
      success: true,
      data: {
        propertyInvites,
        declined: {
          count: declinedCount,
          percentage: declinedPercentage,
        },
        messages: {
          total: totalMessages,
          unread: unreadMessages,
        },
        qfps: qfpsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
    });
  }
});

/**
 * GET /api/performance/properties
 * Get property performance data
 */
router.get('/properties', roleGuard.requireTenant(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.query;

    // Get user's businesses
    const businessesResult = await pool.query(
      `SELECT id, name FROM businesses WHERE user_id = $1`,
      [userId]
    );
    const businesses = businessesResult.rows;
    const businessIds = businesses.map((row: any) => row.id);

    if (businessIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Filter by specific business if requested
    const targetBusinessIds = businessId && businessId !== 'all'
      ? [businessId]
      : businessIds;

    // Get demand listings with performance data
    const demandListingsResult = await pool.query(
      `SELECT
         dl.id,
         dl.location_name,
         b.name as business_name,
         dl.state,
         COUNT(DISTINCT pm.id) as property_invitations,
         COUNT(DISTINCT CASE WHEN pm.is_dismissed = true THEN pm.id END) as declines,
         0 as ofps_submitted,
         0 as messages,
         0 as views,
         '0 Mins' as avg_time
       FROM demand_listings dl
       JOIN businesses b ON b.id = dl.business_id
       LEFT JOIN property_matches pm ON pm.demand_listing_id = dl.id
       WHERE dl.business_id = ANY($1)
       GROUP BY dl.id, dl.location_name, b.name, dl.state
       ORDER BY property_invitations DESC`,
      [targetBusinessIds]
    );

    const properties = demandListingsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.location_name,
      type: row.business_name,
      state: row.state,
      propertyInvitations: parseInt(row.property_invitations),
      ofpsSubmitted: parseInt(row.ofps_submitted),
      messages: parseInt(row.messages),
      declines: parseInt(row.declines),
      views: parseInt(row.views),
      avgTime: row.avg_time,
    }));

    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Error fetching property performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property performance',
    });
  }
});

export default router;
