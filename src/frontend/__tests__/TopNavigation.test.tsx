import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
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

// Mock messagingWebSocket
jest.mock('../utils/messagingWebsocket', () => ({
  messagingWebSocket: {
    onUnreadUpdate: jest.fn(() => jest.fn()),
    onNewMessage: jest.fn(() => jest.fn()),
  },
}));

// Mock apiClient
jest.mock('../utils/apiClient', () => ({
  getUnreadMessageCount: jest.fn().mockResolvedValue({ unreadCount: 0 }),
}));

const renderWithRouter = (component: React.ReactElement, initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>
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

    // Check profile dropdown trigger (settings icon or user name)
    expect(screen.getByRole('button', { name: /profile menu/i })).toBeInTheDocument();
  });

  it('highlights active tab correctly', () => {
    renderWithRouter(<TopNavigation />, '/dashboard');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
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

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const trendsLink = screen.getByText('Trends').closest('a');
    const applicationsLink = screen.getByText('Applications').closest('a');

    // Verify href attributes
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(trendsLink).toHaveAttribute('href', '/trends');
    expect(applicationsLink).toHaveAttribute('href', '/applications');
  });
});

// Task Group 12: Navigation Enhancements Tests
describe('TopNavigation - Navigation Icon Enhancements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders favorites (heart) icon before messages icon', () => {
    renderWithRouter(<TopNavigation />);

    // Check that favorites icon is present
    const favoritesIcon = screen.getByTestId('favorites-icon');
    expect(favoritesIcon).toBeInTheDocument();

    // Check that messages icon is also present
    const messagesButton = screen.getByRole('button', { name: /messages/i });
    expect(messagesButton).toBeInTheDocument();

    // Verify favorites appears before messages by checking DOM order
    const iconGroup = favoritesIcon.parentElement;
    const iconButtons = iconGroup ? Array.from(iconGroup.children) : [];
    const favoritesIndex = iconButtons.indexOf(favoritesIcon);
    const messagesIndex = iconButtons.findIndex(
      el => el.getAttribute('aria-label')?.toLowerCase().includes('messages')
    );

    expect(favoritesIndex).toBeLessThan(messagesIndex);
  });

  it('renders notifications (bell) icon with badge counter', () => {
    renderWithRouter(<TopNavigation notificationCount={5} />);

    // Check that notifications icon is present
    const notificationsIcon = screen.getByTestId('notifications-icon');
    expect(notificationsIcon).toBeInTheDocument();

    // Check that badge is present with the count
    const badge = screen.getByTestId('notification-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('hides notification badge when unread count is 0', () => {
    renderWithRouter(<TopNavigation notificationCount={0} />);

    // Check that notifications icon is present
    const notificationsIcon = screen.getByTestId('notifications-icon');
    expect(notificationsIcon).toBeInTheDocument();

    // Badge should not be present when count is 0
    const badge = screen.queryByTestId('notification-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('renders icons in correct order: favorites, notifications, messages, tier, profile', () => {
    renderWithRouter(<TopNavigation notificationCount={3} />);

    // Get all the key elements
    const favoritesIcon = screen.getByTestId('favorites-icon');
    const notificationsIcon = screen.getByTestId('notifications-icon');
    const messagesButton = screen.getByRole('button', { name: /messages/i });
    const tierBadge = screen.getByText('Free Plan');
    const profileButton = screen.getByRole('button', { name: /profile menu/i });

    // Verify all elements are present
    expect(favoritesIcon).toBeInTheDocument();
    expect(notificationsIcon).toBeInTheDocument();
    expect(messagesButton).toBeInTheDocument();
    expect(tierBadge).toBeInTheDocument();
    expect(profileButton).toBeInTheDocument();

    // Verify the icon group order (favorites, notifications, messages)
    const iconGroup = favoritesIcon.parentElement;
    expect(iconGroup).toContainElement(favoritesIcon);
    expect(iconGroup).toContainElement(notificationsIcon);
    expect(iconGroup).toContainElement(messagesButton);

    // Check order within icon group
    const iconGroupChildren = iconGroup ? Array.from(iconGroup.children) : [];
    const favIdx = iconGroupChildren.indexOf(favoritesIcon);
    const notifIdx = iconGroupChildren.indexOf(notificationsIcon);
    const msgIdx = iconGroupChildren.indexOf(messagesButton);

    expect(favIdx).toBeLessThan(notifIdx);
    expect(notifIdx).toBeLessThan(msgIdx);
  });

  it('notification badge shows 99+ for counts over 99', () => {
    renderWithRouter(<TopNavigation notificationCount={150} />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveTextContent('99+');
  });
});
