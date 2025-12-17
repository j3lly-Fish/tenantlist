import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TopNavigation } from '../components/TopNavigation';
import { AuthProvider } from '../contexts/AuthContext';

// Mock AuthContext
const mockAuthContext = {
  user: {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'tenant',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: null,
  },
  isAuthenticated: true,
  isLoading: false,
  role: 'tenant',
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  setUser: jest.fn(),
};

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockAuthContext,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('TopNavigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation elements correctly', () => {
    renderWithRouter(<TopNavigation />);

    // Check logo
    expect(screen.getByText('zyx')).toBeInTheDocument();

    // Check navigation tabs
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();

    // Check tier badge (default to "Free Plan")
    expect(screen.getByText('Free Plan')).toBeInTheDocument();

    // Check Add Business button
    expect(screen.getByText('Add Business')).toBeInTheDocument();

    // Check profile dropdown trigger (settings icon or user name)
    expect(screen.getByRole('button', { name: /profile menu/i })).toBeInTheDocument();
  });

  it('highlights active tab correctly', () => {
    // Mock location to be /dashboard
    window.history.pushState({}, '', '/dashboard');

    renderWithRouter(<TopNavigation />);

    const dashboardTab = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardTab).toHaveClass('active');
  });

  it('opens and closes profile dropdown on click', async () => {
    renderWithRouter(<TopNavigation />);

    const dropdownTrigger = screen.getByRole('button', { name: /profile menu/i });

    // Initially, dropdown menu should not be visible
    expect(screen.queryByText('Go to Profile')).not.toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(dropdownTrigger);

    // Dropdown menu should be visible
    await waitFor(() => {
      expect(screen.getByText('Go to Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Click outside to close dropdown
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Go to Profile')).not.toBeInTheDocument();
    });
  });

  it('displays user tier badge correctly', () => {
    renderWithRouter(<TopNavigation tier="Starter" />);

    expect(screen.getByText('Starter')).toBeInTheDocument();
  });

  it('calls logout handler when logout is clicked', async () => {
    renderWithRouter(<TopNavigation />);

    // Open dropdown
    const dropdownTrigger = screen.getByRole('button', { name: /profile menu/i });
    fireEvent.click(dropdownTrigger);

    // Click logout
    const logoutButton = await screen.findByText('Logout');
    fireEvent.click(logoutButton);

    // Verify logout was called
    await waitFor(() => {
      expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to correct routes when navigation tabs are clicked', () => {
    renderWithRouter(<TopNavigation />);

    const dashboardTab = screen.getByRole('link', { name: 'Dashboard' });
    const trendsTab = screen.getByRole('link', { name: 'Trends' });
    const applicationsTab = screen.getByRole('link', { name: 'Applications' });

    // Verify href attributes
    expect(dashboardTab).toHaveAttribute('href', '/dashboard');
    expect(trendsTab).toHaveAttribute('href', '/trends');
    expect(applicationsTab).toHaveAttribute('href', '/applications');
  });
});
