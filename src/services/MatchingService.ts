import { Pool } from 'pg';
import pool from '../config/database';
import {
  DemandListing,
  PropertyListing,
  PropertyMatch,
  MatchDetails,
  PropertyMatchWithProperty,
} from '../types';
import { notificationService } from './NotificationService';

/**
 * Asset type mapping for matching property types to demand listing asset types
 * Maps property_type enum values to demand listing asset_type values
 */
const ASSET_TYPE_MAP: Record<string, string[]> = {
  retail: ['retail', 'storefront'],
  restaurant: ['restaurant', 'storefront'],
  office: ['office_space', 'office'],
  industrial: ['industrial_space', 'warehouse'],
  warehouse: ['warehouse', 'industrial_space'],
  medical: ['medical_office', 'office_space'],
  flex: ['flex', 'warehouse', 'office_space'],
  land: ['land'],
  other: ['other'],
};

/**
 * Scoring weights for different match criteria
 * Total should equal 100
 */
const SCORING_WEIGHTS = {
  location: 30,      // Location is most important
  sqft: 25,          // Square footage is second
  price: 25,         // Budget fit is equally important
  asset_type: 15,    // Asset type match
  amenities: 5,      // Amenities bonus
};

/**
 * MatchingService
 *
 * Rule-based matching engine that scores tenant demand listings (QFPs)
 * against available property listings.
 *
 * Scoring criteria:
 * - Location: Same city (100%), same state (50%), different state (0%)
 * - Square footage: Property within tenant's min/max range
 * - Price: Property price within tenant's budget range
 * - Asset type: Exact match or compatible type
 * - Amenities: Percentage of required features available
 */
export class MatchingService {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Calculate match score between a demand listing and a property listing
   */
  calculateMatchScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; details: MatchDetails; componentScores: Record<string, number> } {
    const componentScores: Record<string, number> = {
      location: 0,
      sqft: 0,
      price: 0,
      asset_type: 0,
      amenities: 0,
    };

    // Calculate location score
    const locationMatch = this.calculateLocationScore(demandListing, propertyListing);
    componentScores.location = locationMatch.score;

    // Calculate square footage score
    const sqftMatch = this.calculateSqftScore(demandListing, propertyListing);
    componentScores.sqft = sqftMatch.score;

    // Calculate price score
    const priceMatch = this.calculatePriceScore(demandListing, propertyListing);
    componentScores.price = priceMatch.score;

    // Calculate asset type score
    const assetTypeMatch = this.calculateAssetTypeScore(demandListing, propertyListing);
    componentScores.asset_type = assetTypeMatch.score;

    // Calculate amenities score
    const amenitiesMatch = this.calculateAmenitiesScore(demandListing, propertyListing);
    componentScores.amenities = amenitiesMatch.score;

    // Calculate weighted total score
    const totalScore =
      (componentScores.location * SCORING_WEIGHTS.location +
        componentScores.sqft * SCORING_WEIGHTS.sqft +
        componentScores.price * SCORING_WEIGHTS.price +
        componentScores.asset_type * SCORING_WEIGHTS.asset_type +
        componentScores.amenities * SCORING_WEIGHTS.amenities) /
      100;

    // Build match details
    const details: MatchDetails = {
      location_match: {
        same_city: locationMatch.sameCity,
        same_state: locationMatch.sameState,
      },
      sqft_match: {
        property_sqft: propertyListing.sqft,
        required_min: demandListing.sqft_min,
        required_max: demandListing.sqft_max,
        in_range: sqftMatch.inRange,
      },
      price_match: {
        property_price: propertyListing.asking_price,
        budget_min: demandListing.budget_min,
        budget_max: demandListing.budget_max,
        in_range: priceMatch.inRange,
      },
      asset_type_match: {
        property_type: propertyListing.property_type,
        required_type: demandListing.asset_type,
        is_exact_match: assetTypeMatch.isExactMatch,
      },
      amenities_match: {
        matched_features: amenitiesMatch.matchedFeatures,
        total_required: amenitiesMatch.totalRequired,
        match_percentage: amenitiesMatch.percentage,
      },
    };

    return {
      score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
      details,
      componentScores,
    };
  }

  /**
   * Calculate location match score
   * - Same city: 100 points
   * - Same state: 50 points
   * - Different state: 0 points
   */
  private calculateLocationScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; sameCity: boolean; sameState: boolean } {
    const demandCity = demandListing.city?.toLowerCase().trim() || '';
    const demandState = demandListing.state?.toLowerCase().trim() || '';
    const propertyCity = propertyListing.city?.toLowerCase().trim() || '';
    const propertyState = propertyListing.state?.toLowerCase().trim() || '';

    const sameCity = demandCity === propertyCity && demandCity !== '';
    const sameState = demandState === propertyState && demandState !== '';

    let score = 0;
    if (sameCity && sameState) {
      score = 100;
    } else if (sameState) {
      score = 50;
    }

    return { score, sameCity, sameState };
  }

  /**
   * Calculate square footage match score
   * - Property within exact range: 100 points
   * - Within 20% of range: 70 points
   * - Within 50% of range: 40 points
   * - Outside range: 0 points
   */
  private calculateSqftScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; inRange: boolean } {
    const propertySqft = propertyListing.sqft;
    const minSqft = demandListing.sqft_min;
    const maxSqft = demandListing.sqft_max;

    // If no sqft requirements specified, give full score
    if (!minSqft && !maxSqft) {
      return { score: 100, inRange: true };
    }

    const effectiveMin = minSqft || 0;
    const effectiveMax = maxSqft || Infinity;

    // Check if property is in exact range
    if (propertySqft >= effectiveMin && propertySqft <= effectiveMax) {
      return { score: 100, inRange: true };
    }

    // Calculate how far outside the range
    const rangeSize = (maxSqft || minSqft || propertySqft) - (minSqft || 0);
    const tolerance20 = rangeSize * 0.2;
    const tolerance50 = rangeSize * 0.5;

    if (propertySqft < effectiveMin) {
      const diff = effectiveMin - propertySqft;
      if (diff <= tolerance20) return { score: 70, inRange: false };
      if (diff <= tolerance50) return { score: 40, inRange: false };
    } else {
      const diff = propertySqft - effectiveMax;
      if (diff <= tolerance20) return { score: 70, inRange: false };
      if (diff <= tolerance50) return { score: 40, inRange: false };
    }

    return { score: 0, inRange: false };
  }

  /**
   * Calculate price match score
   * - Property within budget range: 100 points
   * - Within 10% of range: 80 points
   * - Within 25% of range: 50 points
   * - Outside range: 0 points
   */
  private calculatePriceScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; inRange: boolean } {
    const propertyPrice = propertyListing.asking_price;
    const minBudget = demandListing.budget_min;
    const maxBudget = demandListing.budget_max;

    // If property has no price, give partial score
    if (!propertyPrice) {
      return { score: 50, inRange: false };
    }

    // If no budget requirements specified, give full score
    if (!minBudget && !maxBudget) {
      return { score: 100, inRange: true };
    }

    const effectiveMin = minBudget || 0;
    const effectiveMax = maxBudget || Infinity;

    // Check if property is in exact range
    if (propertyPrice >= effectiveMin && propertyPrice <= effectiveMax) {
      return { score: 100, inRange: true };
    }

    // Calculate tolerance based on budget
    const budgetMidpoint = maxBudget || minBudget || propertyPrice;
    const tolerance10 = budgetMidpoint * 0.1;
    const tolerance25 = budgetMidpoint * 0.25;

    if (propertyPrice < effectiveMin) {
      // Property is cheaper than min - this is usually good
      return { score: 100, inRange: true };
    } else {
      const diff = propertyPrice - effectiveMax;
      if (diff <= tolerance10) return { score: 80, inRange: false };
      if (diff <= tolerance25) return { score: 50, inRange: false };
    }

    return { score: 0, inRange: false };
  }

  /**
   * Calculate asset type match score
   * - Exact match: 100 points
   * - Compatible type: 70 points
   * - No match: 0 points
   */
  private calculateAssetTypeScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; isExactMatch: boolean } {
    const propertyType = propertyListing.property_type?.toLowerCase() || '';
    const requiredType = demandListing.asset_type?.toLowerCase() || '';

    // If no required type, give full score
    if (!requiredType) {
      return { score: 100, isExactMatch: true };
    }

    // Check exact match
    if (propertyType === requiredType) {
      return { score: 100, isExactMatch: true };
    }

    // Check compatible types
    const compatibleTypes = ASSET_TYPE_MAP[propertyType] || [];
    if (compatibleTypes.includes(requiredType)) {
      return { score: 70, isExactMatch: false };
    }

    // Check reverse mapping
    const reverseCompatible = ASSET_TYPE_MAP[requiredType] || [];
    if (reverseCompatible.includes(propertyType)) {
      return { score: 70, isExactMatch: false };
    }

    return { score: 0, isExactMatch: false };
  }

  /**
   * Calculate amenities match score
   * Based on percentage of required features available in property
   */
  private calculateAmenitiesScore(
    demandListing: DemandListing,
    propertyListing: PropertyListing
  ): { score: number; matchedFeatures: string[]; totalRequired: number; percentage: number } {
    const requiredFeatures = demandListing.additional_features || [];
    const propertyAmenities = propertyListing.amenities || [];

    // If no features required, give full score
    if (requiredFeatures.length === 0) {
      return { score: 100, matchedFeatures: [], totalRequired: 0, percentage: 100 };
    }

    // Normalize amenities for comparison
    const normalizedPropertyAmenities = propertyAmenities.map((a) =>
      a.toLowerCase().replace(/[^a-z0-9]/g, '_')
    );

    // Find matched features
    const matchedFeatures = requiredFeatures.filter((feature) => {
      const normalizedFeature = feature.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return normalizedPropertyAmenities.some(
        (amenity) =>
          amenity.includes(normalizedFeature) || normalizedFeature.includes(amenity)
      );
    });

    const percentage =
      requiredFeatures.length > 0
        ? (matchedFeatures.length / requiredFeatures.length) * 100
        : 100;

    return {
      score: Math.round(percentage),
      matchedFeatures,
      totalRequired: requiredFeatures.length,
      percentage: Math.round(percentage),
    };
  }

  /**
   * Find and score all matching properties for a demand listing
   * @param sendNotification - If true, sends email notification for new matches
   */
  async findMatchesForDemandListing(
    demandListingId: string,
    limit: number = 10,
    sendNotification: boolean = false
  ): Promise<PropertyMatchWithProperty[]> {
    // Get the demand listing with business info for user lookup
    const demandResult = await this.pool.query(
      `SELECT dl.*, b.user_id
       FROM demand_listings dl
       JOIN businesses b ON dl.business_id = b.id
       WHERE dl.id = $1`,
      [demandListingId]
    );

    if (demandResult.rows.length === 0) {
      throw new Error('Demand listing not found');
    }

    const demandListing = demandResult.rows[0] as DemandListing & { user_id: string };
    const userId = demandResult.rows[0].user_id;

    // Get all active property listings
    const propertiesResult = await this.pool.query(
      `SELECT * FROM property_listings WHERE status = 'active'`
    );

    const properties = propertiesResult.rows as PropertyListing[];

    // Calculate scores for all properties
    const matches: Array<{
      propertyListing: PropertyListing;
      score: number;
      details: MatchDetails;
      componentScores: Record<string, number>;
    }> = [];

    for (const property of properties) {
      const { score, details, componentScores } = this.calculateMatchScore(
        demandListing,
        property
      );

      // Only include matches with score > 0
      if (score > 0) {
        matches.push({
          propertyListing: property,
          score,
          details,
          componentScores,
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Take top N matches
    const topMatches = matches.slice(0, limit);

    // Store/update matches in database
    const storedMatches: PropertyMatchWithProperty[] = [];

    for (const match of topMatches) {
      const storedMatch = await this.upsertMatch(
        demandListingId,
        match.propertyListing.id,
        match.score,
        match.componentScores,
        match.details
      );

      storedMatches.push({
        ...storedMatch,
        property: match.propertyListing,
      });
    }

    // Send notification if requested and there are new matches
    if (sendNotification && storedMatches.length > 0) {
      notificationService.sendNewMatchesNotification(
        userId,
        storedMatches.map((m) => ({
          id: m.id,
          match_score: m.match_score,
          property: {
            title: m.property.title,
            city: m.property.city,
            state: m.property.state,
          },
        }))
      ).catch((err) => console.error('Failed to send match notification:', err));
    }

    return storedMatches;
  }

  /**
   * Insert or update a match record
   */
  private async upsertMatch(
    demandListingId: string,
    propertyListingId: string,
    score: number,
    componentScores: Record<string, number>,
    details: MatchDetails
  ): Promise<PropertyMatch> {
    const result = await this.pool.query(
      `INSERT INTO property_matches (
        demand_listing_id, property_listing_id, match_score,
        location_score, sqft_score, price_score, asset_type_score, amenities_score,
        match_details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (demand_listing_id, property_listing_id)
      DO UPDATE SET
        match_score = EXCLUDED.match_score,
        location_score = EXCLUDED.location_score,
        sqft_score = EXCLUDED.sqft_score,
        price_score = EXCLUDED.price_score,
        asset_type_score = EXCLUDED.asset_type_score,
        amenities_score = EXCLUDED.amenities_score,
        match_details = EXCLUDED.match_details,
        updated_at = NOW()
      RETURNING *`,
      [
        demandListingId,
        propertyListingId,
        score,
        componentScores.location,
        componentScores.sqft,
        componentScores.price,
        componentScores.asset_type,
        componentScores.amenities,
        JSON.stringify(details),
      ]
    );

    return result.rows[0];
  }

  /**
   * Get stored matches for a demand listing
   */
  async getMatchesForDemandListing(
    demandListingId: string,
    options?: {
      limit?: number;
      includeDismissed?: boolean;
    }
  ): Promise<PropertyMatchWithProperty[]> {
    const limit = options?.limit || 10;
    const includeDismissed = options?.includeDismissed || false;

    let query = `
      SELECT
        pm.*,
        row_to_json(pl.*) as property
      FROM property_matches pm
      JOIN property_listings pl ON pm.property_listing_id = pl.id
      WHERE pm.demand_listing_id = $1
        AND pl.status = 'active'
    `;

    if (!includeDismissed) {
      query += ` AND pm.is_dismissed = FALSE`;
    }

    query += ` ORDER BY pm.match_score DESC LIMIT $2`;

    const result = await this.pool.query(query, [demandListingId, limit]);

    return result.rows.map((row) => ({
      ...row,
      property: row.property,
    }));
  }

  /**
   * Get top matches for a user across all their demand listings
   */
  async getMatchesForUser(
    userId: string,
    limit: number = 10
  ): Promise<PropertyMatchWithProperty[]> {
    const result = await this.pool.query(
      `SELECT
        pm.*,
        row_to_json(pl.*) as property
      FROM property_matches pm
      JOIN property_listings pl ON pm.property_listing_id = pl.id
      JOIN demand_listings dl ON pm.demand_listing_id = dl.id
      JOIN businesses b ON dl.business_id = b.id
      WHERE b.user_id = $1
        AND pl.status = 'active'
        AND pm.is_dismissed = FALSE
      ORDER BY pm.match_score DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((row) => ({
      ...row,
      property: row.property,
    }));
  }

  /**
   * Mark a match as viewed
   */
  async markAsViewed(matchId: string): Promise<void> {
    await this.pool.query(
      `UPDATE property_matches
       SET is_viewed = TRUE, viewed_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
  }

  /**
   * Toggle save status for a match
   */
  async toggleSaved(matchId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE property_matches
       SET is_saved = NOT is_saved,
           saved_at = CASE WHEN is_saved THEN NULL ELSE NOW() END
       WHERE id = $1
       RETURNING is_saved`,
      [matchId]
    );

    return result.rows[0]?.is_saved || false;
  }

  /**
   * Dismiss a match
   */
  async dismissMatch(matchId: string): Promise<void> {
    await this.pool.query(
      `UPDATE property_matches
       SET is_dismissed = TRUE, dismissed_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
  }

  /**
   * Refresh matches for all active demand listings
   * Can be called periodically or when properties are added/updated
   */
  async refreshAllMatches(): Promise<number> {
    // Get all active demand listings
    const demandListings = await this.pool.query(
      `SELECT id FROM demand_listings WHERE status = 'active'`
    );

    let totalMatches = 0;

    for (const row of demandListings.rows) {
      try {
        const matches = await this.findMatchesForDemandListing(row.id);
        totalMatches += matches.length;
      } catch (error) {
        console.error(`Error refreshing matches for demand listing ${row.id}:`, error);
      }
    }

    return totalMatches;
  }

  /**
   * Get saved matches for a user
   */
  async getSavedMatches(userId: string): Promise<PropertyMatchWithProperty[]> {
    const result = await this.pool.query(
      `SELECT
        pm.*,
        row_to_json(pl.*) as property
      FROM property_matches pm
      JOIN property_listings pl ON pm.property_listing_id = pl.id
      JOIN demand_listings dl ON pm.demand_listing_id = dl.id
      JOIN businesses b ON dl.business_id = b.id
      WHERE b.user_id = $1
        AND pm.is_saved = TRUE
        AND pm.is_dismissed = FALSE
      ORDER BY pm.saved_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...row,
      property: row.property,
    }));
  }
}
