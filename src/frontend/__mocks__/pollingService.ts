/**
 * Mock pollingService for Jest tests
 * Avoids import.meta.env issues from apiClient dependency
 */

export const startPolling = jest.fn();
export const stopPolling = jest.fn();
export const isPolling = jest.fn(() => false);

const pollingService = {
  startPolling,
  stopPolling,
  isPolling,
  isActive: jest.fn(() => false),
};

export default pollingService;
