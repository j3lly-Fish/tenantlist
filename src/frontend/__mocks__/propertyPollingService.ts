/**
 * Mock implementation of property polling service for testing
 */

export const startPropertyPolling = jest.fn();
export const stopPropertyPolling = jest.fn();

export const propertyPollingService = {
  startPolling: jest.fn(),
  stopPolling: jest.fn(),
  isActive: jest.fn(() => false),
  setPollingInterval: jest.fn(),
};

export default propertyPollingService;
