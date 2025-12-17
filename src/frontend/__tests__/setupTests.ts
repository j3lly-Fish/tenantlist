// Setup file for frontend tests
import '@testing-library/jest-dom';

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

// Mock fetch for tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});