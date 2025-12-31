/**
 * Environment variable utilities
 * Provides a testable way to access import.meta.env
 */

export const getEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }
  // Fallback for test environment
  return {
    VITE_API_BASE_URL: '',
    VITE_WS_BASE_URL: '',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  };
};
