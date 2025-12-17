import pool from '../config/database';
import {
  MarketInsightsData,
  MarketOverviewKPIs,
  VacancyTrendData,
  AbsorptionData,
  DemandByIndustry,
  DemandByState,
} from '../types';

/**
 * MarketInsightsService
 *
 * Provides aggregate market data and analytics for the Market Insights Dashboard.
 * Combines real data from the database with simulated market trends for demonstration.
 */
export class MarketInsightsService {
  /**
   * Get complete market insights data
   */
  async getMarketInsights(): Promise<MarketInsightsData> {
    const [overview, vacancyTrends, absorptionByType, demandByIndustry, demandByState] =
      await Promise.all([
        this.getMarketOverview(),
        this.getVacancyTrends(),
        this.getAbsorptionByType(),
        this.getDemandByIndustry(),
        this.getDemandByState(),
      ]);

    return {
      overview,
      vacancyTrends,
      absorptionByType,
      demandByIndustry,
      demandByState,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get market overview KPIs
   */
  async getMarketOverview(): Promise<MarketOverviewKPIs> {
    // Get real counts from database
    const [listingsResult, demandResult, matchesResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active_count,
          COUNT(*) FILTER (WHERE status = 'leased') as leased_count,
          COUNT(*) as total_count
        FROM property_listings
      `),
      pool.query(`
        SELECT COUNT(*) as count FROM demand_listings WHERE status = 'active'
      `),
      pool.query(`
        SELECT
          COUNT(*) as total_matches,
          AVG(match_score) as avg_score
        FROM property_matches
        WHERE is_dismissed = FALSE
      `),
    ]);

    const activeListings = parseInt(listingsResult.rows[0]?.active_count || '0');
    const leasedListings = parseInt(listingsResult.rows[0]?.leased_count || '0');
    const totalListings = parseInt(listingsResult.rows[0]?.total_count || '0');
    const demandListings = parseInt(demandResult.rows[0]?.count || '0');
    const avgMatchScore = parseFloat(matchesResult.rows[0]?.avg_score || '0');

    // Calculate vacancy rate (active / total available space)
    const vacancyRate = totalListings > 0
      ? ((activeListings / totalListings) * 100)
      : 0;

    return {
      totalActiveListings: activeListings,
      totalActiveListingsChange: 5.2, // Simulated positive trend
      averageVacancyRate: Math.round(vacancyRate * 10) / 10,
      averageVacancyRateChange: -1.3, // Simulated decrease (good)
      totalDemandListings: demandListings,
      totalDemandListingsChange: 12.8, // Simulated growth
      averageMatchRate: Math.round(avgMatchScore * 10) / 10 || 68.5,
      averageMatchRateChange: 3.2, // Simulated improvement
    };
  }

  /**
   * Get vacancy trends over the past 12 months
   * Uses real data where available, fills with realistic simulated data
   */
  async getVacancyTrends(): Promise<VacancyTrendData[]> {
    const trends: VacancyTrendData[] = [];
    const today = new Date();

    // Generate 12 months of trend data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format

      // Base vacancy rates with seasonal variation
      const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.05;
      const trendFactor = 1 - (i * 0.008); // Gradual improvement over time

      trends.push({
        date: monthStr,
        retail: Math.round((8.2 * seasonalFactor * trendFactor) * 10) / 10,
        office: Math.round((12.5 * seasonalFactor * trendFactor) * 10) / 10,
        industrial: Math.round((4.8 * seasonalFactor * trendFactor) * 10) / 10,
        overall: Math.round((8.5 * seasonalFactor * trendFactor) * 10) / 10,
      });
    }

    return trends;
  }

  /**
   * Get absorption data by asset type
   */
  async getAbsorptionByType(): Promise<AbsorptionData[]> {
    // Get real property type distribution from database
    const result = await pool.query(`
      SELECT
        property_type,
        COUNT(*) FILTER (WHERE status = 'active') as available,
        COUNT(*) FILTER (WHERE status = 'leased') as leased,
        COUNT(*) as total
      FROM property_listings
      GROUP BY property_type
      ORDER BY total DESC
    `);

    const typeMap: Record<string, string> = {
      retail: 'Retail',
      restaurant: 'Restaurant',
      office: 'Office',
      industrial: 'Industrial',
      warehouse: 'Warehouse',
      medical: 'Medical',
      flex: 'Flex Space',
      land: 'Land',
      other: 'Other',
    };

    // If we have real data, use it
    if (result.rows.length > 0) {
      return result.rows.map((row) => ({
        assetType: typeMap[row.property_type] || row.property_type,
        available: parseInt(row.available),
        leased: parseInt(row.leased),
        absorption: parseInt(row.leased), // Net absorption = leased units
      }));
    }

    // Return simulated data for demo
    return [
      { assetType: 'Retail', absorption: 245000, available: 1250000, leased: 1005000 },
      { assetType: 'Office', absorption: 180000, available: 2100000, leased: 1820000 },
      { assetType: 'Industrial', absorption: 520000, available: 3500000, leased: 3350000 },
      { assetType: 'Warehouse', absorption: 380000, available: 2800000, leased: 2680000 },
      { assetType: 'Medical', absorption: 45000, available: 450000, leased: 405000 },
      { assetType: 'Flex Space', absorption: 85000, available: 620000, leased: 535000 },
    ];
  }

  /**
   * Get demand breakdown by industry/business category
   */
  async getDemandByIndustry(): Promise<DemandByIndustry[]> {
    const result = await pool.query(`
      SELECT
        b.category,
        COUNT(dl.id) as count
      FROM demand_listings dl
      JOIN businesses b ON dl.business_id = b.id
      WHERE dl.status = 'active'
      GROUP BY b.category
      ORDER BY count DESC
    `);

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    // If we have real data, use it
    if (result.rows.length > 0 && total > 0) {
      return result.rows.map((row) => ({
        industry: this.formatCategoryName(row.category),
        count: parseInt(row.count),
        percentage: Math.round((parseInt(row.count) / total) * 1000) / 10,
      }));
    }

    // Return simulated data for demo
    return [
      { industry: 'Food & Beverage', count: 342, percentage: 28.5 },
      { industry: 'Retail', count: 256, percentage: 21.3 },
      { industry: 'Professional Services', count: 198, percentage: 16.5 },
      { industry: 'Healthcare', count: 156, percentage: 13.0 },
      { industry: 'Technology', count: 124, percentage: 10.3 },
      { industry: 'Other', count: 124, percentage: 10.4 },
    ];
  }

  /**
   * Get demand breakdown by state
   */
  async getDemandByState(): Promise<DemandByState[]> {
    const result = await pool.query(`
      SELECT
        dl.target_state as state,
        COUNT(*) as count
      FROM demand_listings dl
      WHERE dl.status = 'active' AND dl.target_state IS NOT NULL
      GROUP BY dl.target_state
      ORDER BY count DESC
      LIMIT 10
    `);

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    // If we have real data, use it
    if (result.rows.length > 0 && total > 0) {
      return result.rows.map((row) => ({
        state: row.state,
        count: parseInt(row.count),
        percentage: Math.round((parseInt(row.count) / total) * 1000) / 10,
      }));
    }

    // Return simulated data for demo (top CRE markets)
    return [
      { state: 'Florida', count: 245, percentage: 18.2 },
      { state: 'Texas', count: 198, percentage: 14.7 },
      { state: 'California', count: 187, percentage: 13.9 },
      { state: 'New York', count: 156, percentage: 11.6 },
      { state: 'Georgia', count: 124, percentage: 9.2 },
      { state: 'North Carolina', count: 98, percentage: 7.3 },
      { state: 'Arizona', count: 87, percentage: 6.5 },
      { state: 'Colorado', count: 76, percentage: 5.6 },
      { state: 'Tennessee', count: 65, percentage: 4.8 },
      { state: 'Nevada', count: 54, percentage: 4.0 },
    ];
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      fnb: 'Food & Beverage',
      retail: 'Retail',
      office: 'Professional Services',
      industrial: 'Industrial',
      healthcare: 'Healthcare',
      hospitality: 'Hospitality',
      other: 'Other',
    };
    return categoryMap[category?.toLowerCase()] || category || 'Other';
  }
}

// Export singleton instance
export const marketInsightsService = new MarketInsightsService();
