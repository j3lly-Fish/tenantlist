/**
 * Mock websocketClient for Jest tests
 * Avoids import.meta.env issues
 */

export const websocketClient = {
  connectToDashboard: jest.fn(),
  disconnect: jest.fn(),
  onKPIUpdate: jest.fn(() => jest.fn()),
  onBusinessUpdate: jest.fn(() => jest.fn()),
  onBusinessCreated: jest.fn(() => jest.fn()),
  onBusinessDeleted: jest.fn(() => jest.fn()),
};

export default websocketClient;
