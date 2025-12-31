/**
 * Mock environment utility for testing
 */

export const getEnv = jest.fn(() => ({
  VITE_API_BASE_URL: '',
  VITE_WS_BASE_URL: '',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
}));
