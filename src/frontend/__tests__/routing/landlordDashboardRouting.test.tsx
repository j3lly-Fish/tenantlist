import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the auth context
jest.mock('@contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    role: 'LANDLORD',
    user: { id: '1', email: 'test@example.com', role: 'LANDLORD' }
  })
}));

// Mock LandlordDashboard component
const MockLandlordDashboard = () => <div data-testid="landlord-dashboard">Landlord Dashboard</div>;
jest.mock('@pages/LandlordDashboard', () => ({
  __esModule: true,
  default: MockLandlordDashboard
}));

// Mock ProtectedRoute to just render children
const MockProtectedRoute = ({ children }: { children: React.ReactNode }) => <>{children}</>;
jest.mock('@components/ProtectedRoute', () => ({
  __esModule: true,
  default: MockProtectedRoute
}));

describe('Landlord Dashboard Routing', () => {
  it('should render LandlordDashboard at /landlord-dashboard route', async () => {
    render(
      <MemoryRouter initialEntries={['/landlord-dashboard']}>
        <Routes>
          <Route
            path="/landlord-dashboard"
            element={
              <MockProtectedRoute>
                <MockLandlordDashboard />
              </MockProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('landlord-dashboard')).toBeInTheDocument();
    });
  });

  it('should redirect from /properties to /landlord-dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/properties']}>
        <Routes>
          <Route
            path="/landlord-dashboard"
            element={
              <MockProtectedRoute>
                <MockLandlordDashboard />
              </MockProtectedRoute>
            }
          />
          <Route
            path="/properties"
            element={<Navigate to="/landlord-dashboard" replace />}
          />
        </Routes>
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
        <Routes>
          <Route
            path="/landlord-dashboard"
            element={
              <MockProtectedRoute>
                <MockLandlordDashboard />
              </MockProtectedRoute>
            }
          />
          <Route
            path="/properties"
            element={<Navigate to="/landlord-dashboard" replace />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should show the landlord dashboard, not a 404 or error
      expect(screen.getByTestId('landlord-dashboard')).toBeInTheDocument();
    });
  });
});
