import { Router, Request, Response } from 'express';
import { marketInsightsService } from '../services/MarketInsightsService';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';

const router = Router();
const roleGuard = new RoleGuardMiddleware();

/**
 * GET /api/market-insights
 * Get complete market insights data
 * Available to all authenticated users (all tiers)
 */
router.get(
  '/',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const insights = await marketInsightsService.getMarketInsights();

      res.json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      console.error('Error fetching market insights:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch market insights',
        },
      });
    }
  }
);

/**
 * GET /api/market-insights/overview
 * Get market overview KPIs only
 */
router.get(
  '/overview',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const overview = await marketInsightsService.getMarketOverview();

      res.json({
        success: true,
        data: overview,
      });
    } catch (error: any) {
      console.error('Error fetching market overview:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch market overview',
        },
      });
    }
  }
);

/**
 * GET /api/market-insights/vacancy-trends
 * Get vacancy rate trends over time
 */
router.get(
  '/vacancy-trends',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const trends = await marketInsightsService.getVacancyTrends();

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      console.error('Error fetching vacancy trends:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch vacancy trends',
        },
      });
    }
  }
);

/**
 * GET /api/market-insights/absorption
 * Get absorption data by asset type
 */
router.get(
  '/absorption',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const absorption = await marketInsightsService.getAbsorptionByType();

      res.json({
        success: true,
        data: absorption,
      });
    } catch (error: any) {
      console.error('Error fetching absorption data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch absorption data',
        },
      });
    }
  }
);

/**
 * GET /api/market-insights/demand-by-industry
 * Get demand breakdown by industry
 */
router.get(
  '/demand-by-industry',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const demand = await marketInsightsService.getDemandByIndustry();

      res.json({
        success: true,
        data: demand,
      });
    } catch (error: any) {
      console.error('Error fetching demand by industry:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch demand by industry',
        },
      });
    }
  }
);

/**
 * GET /api/market-insights/demand-by-state
 * Get demand breakdown by state
 */
router.get(
  '/demand-by-state',
  roleGuard.authenticate(),
  async (_req: Request, res: Response) => {
    try {
      const demand = await marketInsightsService.getDemandByState();

      res.json({
        success: true,
        data: demand,
      });
    } catch (error: any) {
      console.error('Error fetching demand by state:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch demand by state',
        },
      });
    }
  }
);

export default router;
