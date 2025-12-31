// Setup file for frontend tests
import '@testing-library/jest-dom';

// Polyfill import.meta for Jest environment (Vite uses import.meta.env)
// @ts-ignore
globalThis.importMeta = {
  env: {
    VITE_API_BASE_URL: '',
    VITE_WS_BASE_URL: '',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
};

// Also set it on global for jest-environment-jsdom
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: '',
        VITE_WS_BASE_URL: '',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false,
      },
    },
  },
  writable: true,
});

// Polyfill FormData for jsdom environment
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    private data: Map<string, any> = new Map();

    append(key: string, value: any): void {
      this.data.set(key, value);
    }

    get(key: string): any {
      return this.data.get(key);
    }

    has(key: string): boolean {
      return this.data.has(key);
    }

    delete(key: string): void {
      this.data.delete(key);
    }

    // Add other FormData methods as needed
    forEach(callback: (value: any, key: string, parent: FormData) => void): void {
      this.data.forEach((value, key) => callback(value, key, this));
    }
  } as any;
}

// Mock scrollIntoView for jsdom (not implemented in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock IntersectionObserver for jsdom (not implemented in jsdom)
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
global.IntersectionObserver = mockIntersectionObserver;

// Mock fetch for tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
