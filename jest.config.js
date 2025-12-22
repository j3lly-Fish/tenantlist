module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.tsx',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Configure for React testing
  projects: [
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    },
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/frontend/__tests__/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/src/frontend/__tests__/setupTests.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
          useESM: false,
        }],
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@components/(.*)$': '<rootDir>/src/frontend/components/$1',
        '^@pages/(.*)$': '<rootDir>/src/frontend/pages/$1',
        '^@hooks/(.*)$': '<rootDir>/src/frontend/hooks/$1',
        '^@utils/apiClient$': '<rootDir>/src/frontend/__mocks__/apiClient.ts',
        '^@utils/websocketClient$': '<rootDir>/src/frontend/__mocks__/websocketClient.ts',
        '^@utils/messagingWebsocket$': '<rootDir>/src/frontend/__mocks__/messagingWebsocket.ts',
        '^@utils/pollingService$': '<rootDir>/src/frontend/__mocks__/pollingService.ts',
        '^@utils/(.*)$': '<rootDir>/src/frontend/utils/$1',
        '^@contexts/(.*)$': '<rootDir>/src/frontend/contexts/$1',
        '^@types$': '<rootDir>/src/types/index.ts',
      },
    },
  ],
};
