import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  DashboardData,
  Business,
  BusinessLocation,
  BusinessMetrics,
  PropertyListing,
  PropertyType,
  PropertyListingStatus,
  Conversation,
  ConversationWithDetails,
  Message,
  PropertyMatchWithProperty,
  MarketInsightsData,
  SubscriptionPlan,
  SubscriptionWithPlan,
  BillingTransaction,
  SubscriptionTier,
} from '@types';
import { getEnv } from '@utils/env';

/**
 * API Client Configuration
 * Axios instance with authentication and error handling
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    // Get base URL from environment variables
    // Empty string means relative URLs (works with nginx proxy in Docker)
    const baseURL = getEnv().VITE_API_BASE_URL ?? '';

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL,
      withCredentials: true, // Include httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Set up request interceptor to add JWT token
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      (error) => Promise.reject(error)
    );

    // Set up response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      this.handleResponseError.bind(this)
    );
  }

  /**
   * Request interceptor: Add JWT token to headers if available
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Token is sent via httpOnly cookie automatically
    // No need to manually add Authorization header for cookie-based auth
    return config;
  }

  /**
   * Response interceptor: Handle 401 errors with token refresh
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        // Token refresh is already in progress, queue this request
        return new Promise((resolve) => {
          this.refreshSubscribers.push((token: string) => {
            resolve(this.client(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Token refreshed successfully
          this.isRefreshing = false;
          this.onRefreshed('refreshed');
          this.refreshSubscribers = [];

          // Retry the original request
          return this.client(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed
        this.isRefreshing = false;
        this.refreshSubscribers = [];

        // Redirect to login page
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors globally
    return this.handleGlobalError(error);
  }

  /**
   * Notify all queued requests that token has been refreshed
   */
  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  /**
   * Global error handler
   */
  private handleGlobalError(error: AxiosError): Promise<never> {
    // Extract error message
    const errorData = error.response?.data as ApiResponse;
    const errorMessage = errorData?.error || errorData?.message || error.message || 'An error occurred';

    // Log error in development
    if (getEnv().DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
    }

    // Return structured error
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

/**
 * Typed API methods for dashboard endpoints
 */

/**
 * Get dashboard data (KPIs and businesses)
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/api/dashboard/tenant');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data');
  }
  return response.data;
};

/**
 * Get businesses with pagination and filters
 */
export const getBusinesses = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedResponse<Business>> => {
  const response = await apiClient.get<PaginatedResponse<Business>>('/api/businesses', params);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch businesses');
  }
  return response.data;
};

/**
 * Get single business by ID
 */
export const getBusiness = async (businessId: string): Promise<Business> => {
  const response = await apiClient.get<Business>(`/api/businesses/${businessId}`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch business');
  }
  return response.data;
};

/**
 * Get business locations
 */
export const getBusinessLocations = async (businessId: string): Promise<BusinessLocation[]> => {
  const response = await apiClient.get<BusinessLocation[]>(`/api/businesses/${businessId}/locations`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch locations');
  }
  return response.data;
};

/**
 * Get location metrics
 */
export const getLocationMetrics = async (
  businessId: string,
  locationId: string
): Promise<BusinessMetrics[]> => {
  const response = await apiClient.get<BusinessMetrics[]>(
    `/api/businesses/${businessId}/locations/${locationId}/metrics`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch metrics');
  }
  return response.data;
};

/**
 * Create new business
 */
export const createBusiness = async (data: {
  name: string;
  category: string;
  status?: string;
}): Promise<Business> => {
  const response = await apiClient.post<Business>('/api/businesses', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create business');
  }
  return response.data;
};

/**
 * Update business
 */
export const updateBusiness = async (
  businessId: string,
  data: Partial<Business>
): Promise<Business> => {
  const response = await apiClient.put<Business>(`/api/businesses/${businessId}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update business');
  }
  return response.data;
};

/**
 * Delete business
 */
export const deleteBusiness = async (businessId: string): Promise<void> => {
  const response = await apiClient.delete(`/api/businesses/${businessId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete business');
  }
};

/**
 * Property Listing API methods
 */

/**
 * Get my property listings (for landlords/brokers)
 */
export const getMyPropertyListings = async (params: {
  page?: number;
  limit?: number;
  status?: PropertyListingStatus;
  property_type?: PropertyType;
  search?: string;
}): Promise<{ listings: PropertyListing[]; total: number; page: number; limit: number; hasMore: boolean }> => {
  const response = await apiClient.get<{ listings: PropertyListing[]; total: number; page: number; limit: number; hasMore: boolean }>(
    '/api/property-listings/my',
    params
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch property listings');
  }
  return response.data;
};

/**
 * Search property listings (public)
 */
export const searchPropertyListings = async (params: {
  city?: string;
  state?: string;
  property_type?: PropertyType;
  min_sqft?: number;
  max_sqft?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ listings: PropertyListing[]; total: number; page: number; limit: number; hasMore: boolean }> => {
  const response = await apiClient.get<{ listings: PropertyListing[]; total: number; page: number; limit: number; hasMore: boolean }>(
    '/api/property-listings/search',
    params
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to search property listings');
  }
  return response.data;
};

/**
 * Get single property listing by ID
 */
export const getPropertyListing = async (listingId: string): Promise<{ listing: PropertyListing }> => {
  const response = await apiClient.get<{ listing: PropertyListing }>(`/api/property-listings/${listingId}`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch property listing');
  }
  return response.data;
};

/**
 * Create new property listing
 */
export const createPropertyListing = async (data: {
  title: string;
  description?: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  sqft: number;
  lot_size?: number;
  year_built?: number;
  floors?: number;
  asking_price?: number;
  price_per_sqft?: number;
  lease_type?: string;
  cam_charges?: number;
  available_date?: string;
  min_lease_term?: string;
  max_lease_term?: string;
  amenities?: string[];
  highlights?: string[];
  photos?: Array<{ url: string; caption?: string; order?: number }>;
  virtual_tour_url?: string;
  documents?: Array<{ name: string; url: string; type?: string; size?: number }>;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}): Promise<{ listing: PropertyListing }> => {
  const response = await apiClient.post<{ listing: PropertyListing }>('/api/property-listings', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create property listing');
  }
  return response.data;
};

/**
 * Update property listing
 */
export const updatePropertyListing = async (
  listingId: string,
  data: Partial<PropertyListing>
): Promise<{ listing: PropertyListing }> => {
  const response = await apiClient.put<{ listing: PropertyListing }>(`/api/property-listings/${listingId}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update property listing');
  }
  return response.data;
};

/**
 * Update property listing status
 */
export const updatePropertyListingStatus = async (
  listingId: string,
  status: PropertyListingStatus
): Promise<{ listing: PropertyListing }> => {
  const response = await apiClient.patch<{ listing: PropertyListing }>(`/api/property-listings/${listingId}/status`, { status });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update listing status');
  }
  return response.data;
};

/**
 * Delete property listing
 */
export const deletePropertyListing = async (listingId: string): Promise<void> => {
  const response = await apiClient.delete(`/api/property-listings/${listingId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete property listing');
  }
};

/**
 * Get property listing dashboard stats
 */
export const getPropertyDashboardStats = async (): Promise<{
  total: number;
  active: number;
  pending: number;
  leased: number;
  offMarket: number;
  totalViews: number;
  totalInquiries: number;
}> => {
  const response = await apiClient.get<{
    total: number;
    active: number;
    pending: number;
    leased: number;
    offMarket: number;
    totalViews: number;
    totalInquiries: number;
  }>('/api/property-listings/dashboard');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard stats');
  }
  return response.data;
};

/**
 * Landlord Dashboard API with KPIs and trends
 */

export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  period: string;
}

export interface KPIMetric {
  value: number;
  trend: TrendData;
}

export interface PropertyKPIData {
  totalListings: KPIMetric;
  activeListings: KPIMetric;
  avgDaysOnMarket: KPIMetric;
  responseRate: KPIMetric;
}

export interface LandlordDashboardData {
  kpis: PropertyKPIData;
  properties: PropertyListing[];
  total: number;
  hasMore: boolean;
}

/**
 * Get full landlord dashboard data with KPIs and properties
 */
export const getLandlordDashboard = async (params?: {
  page?: number;
  limit?: number;
}): Promise<LandlordDashboardData> => {
  const response = await apiClient.get<LandlordDashboardData>(
    '/api/dashboard/landlord',
    params
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch landlord dashboard');
  }
  return response.data;
};

/**
 * Get landlord KPIs only (for polling updates)
 */
export const getLandlordKPIs = async (): Promise<PropertyKPIData> => {
  const response = await apiClient.get<PropertyKPIData>('/api/dashboard/landlord/kpis');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch landlord KPIs');
  }
  return response.data;
};

/**
 * Broker Dashboard API methods
 */

/**
 * Get broker KPIs only (for polling updates)
 */
export const getBrokerKPIs = async (): Promise<any> => {
  const response = await apiClient.get<any>('/api/dashboard/broker/kpis');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch broker KPIs');
  }
  return response.data;
};

/**
 * Get broker profile for authenticated user
 */
export const getBrokerProfile = async (): Promise<any> => {
  const response = await apiClient.get<any>('/api/broker/profile');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch broker profile');
  }
  return response.data;
};

/**
 * Create broker profile
 */
export const createBrokerProfile = async (data: any): Promise<any> => {
  const response = await apiClient.post<any>('/api/broker/profile', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create broker profile');
  }
  return response.data;
};

/**
 * Update broker profile
 */
export const updateBrokerProfile = async (data: any): Promise<any> => {
  const response = await apiClient.put<any>('/api/broker/profile', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update broker profile');
  }
  return response.data;
};

/**
 * Get paginated tenant demands
 */
export const getTenantDemands = async (params?: {
  page?: number;
  limit?: number;
  location?: string;
  propertyType?: string;
  minSqft?: number;
  maxSqft?: number;
}): Promise<any> => {
  const response = await apiClient.get<any>('/api/broker/demands', params);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch tenant demands');
  }
  return response.data;
};

/**
 * Get paginated property listings for broker
 */
export const getBrokerProperties = async (params?: {
  page?: number;
  limit?: number;
  location?: string;
  propertyType?: string;
  minSqft?: number;
  maxSqft?: number;
}): Promise<any> => {
  const response = await apiClient.get<any>('/api/broker/properties', params);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch properties');
  }
  return response.data;
};

/**
 * Get broker deals
 */
export const getBrokerDeals = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<any> => {
  const response = await apiClient.get<any>('/api/broker/deals', params);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch broker deals');
  }
  return response.data;
};

/**
 * Get featured property listings
 */
export const getFeaturedPropertyListings = async (limit?: number): Promise<{ listings: PropertyListing[] }> => {
  const response = await apiClient.get<{ listings: PropertyListing[] }>('/api/property-listings/featured', { limit });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch featured listings');
  }
  return response.data;
};

/**
 * Get recent property listings
 */
export const getRecentPropertyListings = async (limit?: number): Promise<{ listings: PropertyListing[] }> => {
  const response = await apiClient.get<{ listings: PropertyListing[] }>('/api/property-listings/recent', { limit });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch recent listings');
  }
  return response.data;
};

/**
 * Messaging API methods
 */

/**
 * Get all conversations for the current user
 */
export const getConversations = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ conversations: ConversationWithDetails[]; total: number; hasMore: boolean }> => {
  const response = await apiClient.get<{ conversations: ConversationWithDetails[]; total: number; hasMore: boolean }>(
    '/api/messages/conversations',
    params
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch conversations');
  }
  return response.data;
};

/**
 * Get a single conversation with details
 */
export const getConversation = async (conversationId: string): Promise<{ conversation: ConversationWithDetails }> => {
  const response = await apiClient.get<{ conversation: ConversationWithDetails }>(
    `/api/messages/conversations/${conversationId}`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch conversation');
  }
  return response.data;
};

/**
 * Create a new conversation
 */
export const createConversation = async (data: {
  participant_ids: string[];
  subject?: string;
  property_listing_id?: string;
  demand_listing_id?: string;
  initial_message?: string;
}): Promise<{ conversation: Conversation; message?: Message }> => {
  const response = await apiClient.post<{ conversation: Conversation; message?: Message }>(
    '/api/messages/conversations',
    data
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create conversation');
  }
  return response.data;
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (
  conversationId: string,
  params?: { limit?: number; before?: string }
): Promise<{ messages: Message[]; total: number; hasMore: boolean }> => {
  const response = await apiClient.get<{ messages: Message[]; total: number; hasMore: boolean }>(
    `/api/messages/conversations/${conversationId}/messages`,
    params
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch messages');
  }
  return response.data;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  data: {
    content: string;
    attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
  }
): Promise<{ message: Message }> => {
  const response = await apiClient.post<{ message: Message }>(
    `/api/messages/conversations/${conversationId}/messages`,
    data
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to send message');
  }
  return response.data;
};

/**
 * Mark a conversation as read
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  const response = await apiClient.post(`/api/messages/conversations/${conversationId}/read`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to mark conversation as read');
  }
};

/**
 * Get total unread message count
 */
export const getUnreadMessageCount = async (): Promise<{ unreadCount: number }> => {
  const response = await apiClient.get<{ unreadCount: number }>('/api/messages/unread-count');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch unread count');
  }
  return response.data;
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  const response = await apiClient.delete(`/api/messages/${messageId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete message');
  }
};

/**
 * Search messages
 */
export const searchMessages = async (
  query: string,
  limit?: number
): Promise<{ messages: Message[] }> => {
  const response = await apiClient.get<{ messages: Message[] }>('/api/messages/search', {
    q: query,
    limit,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to search messages');
  }
  return response.data;
};

/**
 * Mute or unmute a conversation
 */
export const muteConversation = async (
  conversationId: string,
  muted: boolean
): Promise<void> => {
  const response = await apiClient.patch(`/api/messages/conversations/${conversationId}/mute`, {
    muted,
  });
  if (!response.success) {
    throw new Error(response.error || 'Failed to update conversation mute status');
  }
};

/**
 * Leave a conversation
 */
export const leaveConversation = async (conversationId: string): Promise<void> => {
  const response = await apiClient.post(`/api/messages/conversations/${conversationId}/leave`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to leave conversation');
  }
};

/**
 * Matching API methods
 */

/**
 * Get top property matches for the current user
 */
export const getPropertyMatches = async (limit?: number): Promise<{
  matches: PropertyMatchWithProperty[];
  total: number;
}> => {
  const response = await apiClient.get<{ matches: PropertyMatchWithProperty[]; total: number }>(
    '/api/matches',
    { limit }
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch property matches');
  }
  return response.data;
};

/**
 * Get saved property matches
 */
export const getSavedMatches = async (): Promise<{
  matches: PropertyMatchWithProperty[];
  total: number;
}> => {
  const response = await apiClient.get<{ matches: PropertyMatchWithProperty[]; total: number }>(
    '/api/matches/saved'
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch saved matches');
  }
  return response.data;
};

/**
 * Get matches for a specific demand listing
 */
export const getMatchesForDemandListing = async (
  demandListingId: string,
  options?: { limit?: number; includeDismissed?: boolean }
): Promise<{ matches: PropertyMatchWithProperty[]; total: number }> => {
  const response = await apiClient.get<{ matches: PropertyMatchWithProperty[]; total: number }>(
    `/api/matches/demand-listing/${demandListingId}`,
    {
      limit: options?.limit,
      include_dismissed: options?.includeDismissed,
    }
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch matches');
  }
  return response.data;
};

/**
 * Refresh matches for a demand listing
 */
export const refreshMatchesForDemandListing = async (
  demandListingId: string
): Promise<{ matches: PropertyMatchWithProperty[]; total: number }> => {
  const response = await apiClient.post<{ matches: PropertyMatchWithProperty[]; total: number }>(
    `/api/matches/demand-listing/${demandListingId}/refresh`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to refresh matches');
  }
  return response.data;
};

/**
 * Mark a match as viewed
 */
export const markMatchAsViewed = async (matchId: string): Promise<void> => {
  const response = await apiClient.post(`/api/matches/${matchId}/view`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to mark match as viewed');
  }
};

/**
 * Toggle save status for a match
 */
export const toggleMatchSaved = async (matchId: string): Promise<{ isSaved: boolean }> => {
  const response = await apiClient.post<{ isSaved: boolean }>(`/api/matches/${matchId}/save`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to toggle match save status');
  }
  return response.data;
};

/**
 * Dismiss a match
 */
export const dismissMatch = async (matchId: string): Promise<void> => {
  const response = await apiClient.post(`/api/matches/${matchId}/dismiss`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to dismiss match');
  }
};

// ============================================================================
// Market Insights API
// ============================================================================

/**
 * Get complete market insights data
 */
export const getMarketInsights = async (): Promise<MarketInsightsData> => {
  const response = await apiClient.get<MarketInsightsData>('/api/market-insights');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch market insights');
  }
  return response.data;
};

// ============================================================================
// Subscription API
// ============================================================================

/**
 * Get all available subscription plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<SubscriptionPlan[]>('/api/subscriptions/plans');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch subscription plans');
  }
  return response.data;
};

/**
 * Get current user's subscription
 */
export const getCurrentSubscription = async (): Promise<{
  subscription: SubscriptionWithPlan | null;
  tier: SubscriptionTier;
  isConfigured: boolean;
}> => {
  const response = await apiClient.get<{
    subscription: SubscriptionWithPlan | null;
    tier: SubscriptionTier;
    isConfigured: boolean;
  }>('/api/subscriptions/current');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch current subscription');
  }
  return response.data;
};

/**
 * Create checkout session for subscription
 */
export const createCheckoutSession = async (
  planTier: SubscriptionTier,
  billingInterval: 'monthly' | 'annual' = 'monthly'
): Promise<{ sessionId: string; url: string }> => {
  const response = await apiClient.post<{ sessionId: string; url: string }>(
    '/api/subscriptions/checkout',
    { planTier, billingInterval }
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create checkout session');
  }
  return response.data;
};

/**
 * Create billing portal session
 */
export const createBillingPortalSession = async (): Promise<{ url: string }> => {
  const response = await apiClient.post<{ url: string }>('/api/subscriptions/portal');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create billing portal session');
  }
  return response.data;
};

/**
 * Get billing history
 */
export const getBillingHistory = async (): Promise<BillingTransaction[]> => {
  const response = await apiClient.get<BillingTransaction[]>('/api/subscriptions/billing-history');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch billing history');
  }
  return response.data;
};

/**
 * Check access to a specific tier
 */
export const checkTierAccess = async (tier: SubscriptionTier): Promise<{ hasAccess: boolean; tier: string }> => {
  const response = await apiClient.get<{ hasAccess: boolean; tier: string }>(
    `/api/subscriptions/check-access/${tier}`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to check tier access');
  }
  return response.data;
};

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export interface NotificationPreferences {
  email: {
    new_matches: boolean;
    new_messages: boolean;
    business_invites: boolean;
    tour_reminders: boolean;
    account_updates: boolean;
    weekly_digest: boolean;
  };
  inApp: {
    new_matches: boolean;
    new_messages: boolean;
    business_invites: boolean;
    tour_reminders: boolean;
    account_updates: boolean;
  };
  settings: {
    email_frequency: 'instant' | 'daily' | 'weekly';
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    timezone: string;
  };
  unsubscribed_all: boolean;
}

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await apiClient.get<{ preferences: NotificationPreferences }>(
    '/api/notifications/preferences'
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch notification preferences');
  }
  return response.data.preferences;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await apiClient.put<{ preferences: NotificationPreferences }>(
    '/api/notifications/preferences',
    updates
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update notification preferences');
  }
  return response.data.preferences;
};

/**
 * Unsubscribe from all marketing emails
 */
export const unsubscribeAllNotifications = async (): Promise<void> => {
  const response = await apiClient.post<void>('/api/notifications/unsubscribe-all');
  if (!response.success) {
    throw new Error(response.error || 'Failed to unsubscribe');
  }
};

/**
 * Resubscribe to emails
 */
export const resubscribeNotifications = async (): Promise<void> => {
  const response = await apiClient.post<void>('/api/notifications/resubscribe');
  if (!response.success) {
    throw new Error(response.error || 'Failed to resubscribe');
  }
};

export default apiClient;
