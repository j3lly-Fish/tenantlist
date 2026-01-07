// Database enum types
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  BROKER = 'broker',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
}

export enum BusinessStatus {
  ACTIVE = 'active',
  PENDING_VERIFICATION = 'pending_verification',
  STEALTH_MODE = 'stealth_mode',
}

export enum DemandListingStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CLOSED = 'closed',
}

export enum BusinessInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum PropertyListingStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  LEASED = 'leased',
  OFF_MARKET = 'off_market',
}

export enum PropertyType {
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  OFFICE = 'office',
  INDUSTRIAL = 'industrial',
  WAREHOUSE = 'warehouse',
  MEDICAL = 'medical',
  FLEX = 'flex',
  LAND = 'land',
  OTHER = 'other',
}

export enum SubscriptionTier {
  STARTER = 'starter',
  PRO = 'pro',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum BusinessCategory {
  FB = 'F&B',
  RETAIL = 'Retail',
  OFFICE = 'Office',
  INDUSTRIAL = 'Industrial',
  HEALTHCARE = 'Healthcare',
  HOSPITALITY = 'Hospitality',
  OTHER = 'Other',
}

// User model types
export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  role: UserRole;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  phone: string;
  photo_url: string | null;
  profile_completed: boolean;
  subscription_tier: SubscriptionTier;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  ip_address: string | null;
  created_at: Date;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  ip_address: string | null;
  created_at: Date;
}

export interface MFASettings {
  id: string;
  user_id: string;
  enabled: boolean;
  secret: string | null;
  backup_codes: string[] | null;
  created_at: Date;
  updated_at: Date;
}

// Business model types
export interface Business {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  category: string;
  status: BusinessStatus;
  is_verified: boolean;
  stealth_mode_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  // Extended profile fields (from step 2 setup)
  cover_image_url?: string | null;
  description?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  phone?: string | null;
  locations?: string[];
  gallery_images?: string[];
  public_documents?: Array<{ name: string; url: string; size?: number }>;
  private_credentials?: Array<{ name: string; url: string; size?: number }>;
  // Aggregated counts (optional, populated by queries)
  listingsCount?: number;
  statesCount?: number;
  invitesCount?: number;
}

// Legacy interface - use DemandListing instead
export interface BusinessLocation {
  id: string;
  business_id: string;
  city: string;
  state: string;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DemandListing {
  id: string;
  business_id: string;
  title: string | null;
  description: string | null;
  location_name: string;
  city: string;
  state: string;
  address: string | null;
  sqft_min: number | null;
  sqft_max: number | null;
  budget_min: number | null;
  budget_max: number | null;
  duration_type: string | null;
  start_date: string | null;
  industry: string | null;
  asset_type: string;
  requirements: Record<string, any>;
  match_percentage: string;
  status: DemandListingStatus;
  // QFP (Qualified Facility Profile) fields
  lot_size: number | null;
  is_corporate_location: boolean;
  additional_features: string[];
  stealth_mode: boolean;
  // Broker Dashboard Figma Redesign - New fields for location posting
  amenities?: string[];
  locations_of_interest?: string[];
  map_boundaries?: Record<string, any> | null;
  lot_size_min?: number | null;
  lot_size_max?: number | null;
  monthly_budget_min?: number | null;
  monthly_budget_max?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessMetrics {
  id: string;
  business_id: string;
  demand_listing_id: string | null;
  metric_date: Date;
  views_count: number;
  clicks_count: number;
  property_invites_count: number;
  declined_count: number;
  messages_count: number;
  qfps_submitted_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PropertyListing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  status: PropertyListingStatus;
  // Location
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  // Property details
  sqft: number;
  lot_size: number | null;
  year_built: number | null;
  floors: number | null;
  // Pricing
  asking_price: number | null;
  price_per_sqft: number | null;
  lease_type: string | null; // NNN, Gross, Modified Gross
  cam_charges: number | null;
  // Availability
  available_date: string | null;
  min_lease_term: string | null;
  max_lease_term: string | null;
  // Features & amenities (JSONB arrays)
  amenities: string[];
  highlights: string[];
  // Media (JSONB)
  photos: Array<{ url: string; caption?: string; order?: number }>;
  virtual_tour_url: string | null;
  // Documents (JSONB)
  documents: Array<{ name: string; url: string; type?: string; size?: number }>;
  // Contact
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  // Visibility
  is_featured: boolean;
  is_verified: boolean;
  // Metrics (added for landlord dashboard enhancement)
  days_on_market: number | null;
  view_count: number;
  inquiry_count: number;
  last_activity_at: Date | null;
  // Timestamps
  created_at: Date;
  updated_at: Date;
  // Aggregated counts (optional, populated by queries)
  viewsCount?: number;
  inquiriesCount?: number;
  matchesCount?: number;
}

export interface PropertyListingMetrics {
  id: string;
  property_listing_id: string;
  metric_date: Date;
  views_count: number;
  clicks_count: number;
  inquiries_count: number;
  favorites_count: number;
  shares_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessInvite {
  id: string;
  business_id: string;
  invited_by_user_id: string;
  invited_user_email: string;
  status: BusinessInviteStatus;
  created_at: Date;
  updated_at: Date;
}

// Messaging types
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface Conversation {
  id: string;
  property_listing_id: string | null;
  demand_listing_id: string | null;
  subject: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
  // Populated fields
  participants?: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: Date | null;
  unread_count: number;
  is_muted: boolean;
  joined_at: Date;
  left_at: Date | null;
  // Populated user info
  user?: {
    id: string;
    email: string;
    role: UserRole;
    profile?: {
      first_name: string;
      last_name: string;
      photo_url: string | null;
    };
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Array<{ name: string; url: string; type?: string; size?: number }>;
  status: MessageStatus;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Populated sender info
  sender?: {
    id: string;
    email: string;
    role: UserRole;
    profile?: {
      first_name: string;
      last_name: string;
      photo_url: string | null;
    };
  };
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: Date;
}

// Conversation with full details for inbox/chat view
export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  otherParticipant?: ConversationParticipant; // For 1-on-1 chats
}

// Dashboard types
export interface DashboardKPIs {
  activeBusinesses: number;
  responseRate: string;
  landlordViews: number;
  messagesTotal: number;
}

export interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  isLocked?: boolean;
  tierRequired?: string;
  loading?: boolean;
}

export interface BusinessCardProps {
  business: Business;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewPerformance?: () => void;
  onManageLocations?: () => void;
  onClick?: () => void;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchState {
  query: string;
  statusFilter: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  businesses: Business[];
  total: number;
}

// Property Match types (for matching algorithm)
export interface PropertyMatch {
  id: string;
  demand_listing_id: string;
  property_listing_id: string;
  match_score: number;
  location_score: number;
  sqft_score: number;
  price_score: number;
  asset_type_score: number;
  amenities_score: number;
  match_details: MatchDetails;
  is_viewed: boolean;
  is_saved: boolean;
  is_dismissed: boolean;
  viewed_at: Date | null;
  saved_at: Date | null;
  dismissed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Populated fields
  property?: PropertyListing;
  demandListing?: DemandListing;
}

export interface MatchDetails {
  location_match: {
    same_city: boolean;
    same_state: boolean;
    distance_miles?: number;
  };
  sqft_match: {
    property_sqft: number;
    required_min: number | null;
    required_max: number | null;
    in_range: boolean;
  };
  price_match: {
    property_price: number | null;
    budget_min: number | null;
    budget_max: number | null;
    in_range: boolean;
  };
  asset_type_match: {
    property_type: string;
    required_type: string;
    is_exact_match: boolean;
  };
  amenities_match: {
    matched_features: string[];
    total_required: number;
    match_percentage: number;
  };
}

export interface PropertyMatchWithProperty extends PropertyMatch {
  property: PropertyListing;
}

// WebSocket event types
export interface WebSocketKPIUpdate {
  kpis: DashboardKPIs;
}

export interface WebSocketBusinessEvent {
  business: Business;
}

export interface WebSocketBusinessDeleted {
  businessId: string;
}

export interface WebSocketMetricsUpdate {
  businessId: string;
  metrics: BusinessMetrics;
}

// Market Insights types
export interface MarketTrendDataPoint {
  date: string;
  value: number;
  change?: number;
}

export interface VacancyTrendData {
  date: string;
  retail: number;
  office: number;
  industrial: number;
  overall: number;
}

export interface AbsorptionData {
  assetType: string;
  absorption: number;
  available: number;
  leased: number;
}

export interface MarketOverviewKPIs {
  totalActiveListings: number;
  totalActiveListingsChange: number;
  averageVacancyRate: number;
  averageVacancyRateChange: number;
  totalDemandListings: number;
  totalDemandListingsChange: number;
  averageMatchRate: number;
  averageMatchRateChange: number;
}

export interface DemandByIndustry {
  industry: string;
  count: number;
  percentage: number;
}

export interface DemandByState {
  state: string;
  count: number;
  percentage: number;
}

export interface MarketInsightsData {
  overview: MarketOverviewKPIs;
  vacancyTrends: VacancyTrendData[];
  absorptionByType: AbsorptionData[];
  demandByIndustry: DemandByIndustry[];
  demandByState: DemandByState[];
  lastUpdated: string;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price_monthly: number;
  price_annually: number | null;
  description: string;
  features: string[];
  limits: SubscriptionLimits;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionLimits {
  locations: number; // -1 = unlimited
  qfps: number;
  team_members: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  billing_interval: 'monthly' | 'annual';
  current_period_start: Date | null;
  current_period_end: Date | null;
  canceled_at: Date | null;
  cancel_at_period_end: boolean;
  trial_start: Date | null;
  trial_end: Date | null;
  created_at: Date;
  updated_at: Date;
  plan?: SubscriptionPlan;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired';

export interface BillingTransaction {
  id: string;
  subscription_id: string;
  stripe_invoice_id: string | null;
  stripe_charge_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string | null;
  billing_date: Date;
  paid_at: Date | null;
  failure_reason: string | null;
  receipt_url: string | null;
  invoice_pdf_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}
