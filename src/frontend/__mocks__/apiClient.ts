// Mock API client for testing
// This file is used to avoid import.meta.env issues in Jest

export const getDashboardData = jest.fn();
export const getBusinesses = jest.fn();
export const getBusiness = jest.fn();
export const getBusinessLocations = jest.fn();
export const getLocationMetrics = jest.fn();
export const createBusiness = jest.fn();
export const updateBusiness = jest.fn();
export const deleteBusiness = jest.fn();
export const getMyPropertyListings = jest.fn();
export const searchPropertyListings = jest.fn();
export const getPropertyListing = jest.fn();
export const createPropertyListing = jest.fn();
export const updatePropertyListing = jest.fn();
export const updatePropertyListingStatus = jest.fn();
export const deletePropertyListing = jest.fn();
export const getPropertyDashboardStats = jest.fn();
export const getLandlordKPIs = jest.fn();
export const getFeaturedPropertyListings = jest.fn();
export const getRecentPropertyListings = jest.fn();
export const getConversations = jest.fn();
export const getConversation = jest.fn();
export const createConversation = jest.fn();
export const getMessages = jest.fn();
export const sendMessage = jest.fn();
export const markConversationAsRead = jest.fn();
export const getUnreadMessageCount = jest.fn();
export const deleteMessage = jest.fn();
export const searchMessages = jest.fn();
export const muteConversation = jest.fn();
export const leaveConversation = jest.fn();
export const getPropertyMatches = jest.fn();
export const getSavedMatches = jest.fn();
export const getMatchesForDemandListing = jest.fn();
export const refreshMatchesForDemandListing = jest.fn();
export const markMatchAsViewed = jest.fn();
export const toggleMatchSaved = jest.fn();
export const dismissMatch = jest.fn();
export const getMarketInsights = jest.fn();
export const getSubscriptionPlans = jest.fn();
export const getCurrentSubscription = jest.fn();
export const createCheckoutSession = jest.fn();
export const createBillingPortalSession = jest.fn();
export const getBillingHistory = jest.fn();
export const checkTierAccess = jest.fn();
export const getNotificationPreferences = jest.fn();
export const updateNotificationPreferences = jest.fn();
export const unsubscribeAllNotifications = jest.fn();
export const resubscribeNotifications = jest.fn();

export default {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};
