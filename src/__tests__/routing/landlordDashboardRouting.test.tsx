import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../frontend/App';

// Mock the auth context
jest.mock('../../frontend/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    role: 'LANDLORD',
    user: { id: '1', email: 'test@example.com', role: 'LANDLORD' }
  })
}));

// Mock LandlordDashboard component
jest.mock('../../frontend/pages/LandlordDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="landlord-dashboard">Landlord Dashboard</div>
}));

// Mock other page components to avoid loading issues
jest.mock('../../frontend/pages/Login', () => ({
  __esModule: true,
  default: () => <div>Login</div>
}));

jest.mock('../../frontend/pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Tenant Dashboard</div>
}));

jest.mock('../../frontend/components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock('../../frontend/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Landlord Dashboard Routing', () => {
  it('should render LandlordDashboard at /landlord-dashboard route', async () => {
    render(
      <MemoryRouter initialEntries={['/landlord-dashboard']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('landlord-dashboard')).toBeInTheDocument();
    });
  });

  it('should redirect from /properties to /landlord-dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/properties']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('landlord-dashboard')).toBeInTheDocument();
    });
  });

  it('should maintain backward compatibility with /properties route', async () => {
    // This test ensures old bookmarks still work
    render(
      <MemoryRouter initialEntries={['/properties']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should show the landlord dashboard, not a 404 or error
      expect(screen.getByTestId('landlord-dashboard')).toBeInTheDocument();
    });
  });
});
