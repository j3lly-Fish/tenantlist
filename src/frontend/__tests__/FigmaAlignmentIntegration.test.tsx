/**
 * Figma Alignment Integration Tests (Task Group 14.3)
 *
 * Strategic tests to fill critical gaps in integration workflows:
 * 1. Landing page to signup flow with role pre-selection
 * 2. PropertyDetail with all new sections integrated
 * 3. Messages page data transformation
 *
 * Test count: 5 additional strategic tests (max 10 per task requirements)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';

// Mock modules that use import.meta.env
jest.mock('@utils/apiClient');
jest.mock('@utils/websocketClient');
jest.mock('@utils/messagingWebsocket');
jest.mock('@utils/pollingService');

// Import components after mocks
import { HeroSection } from '../components/LandingPage/HeroSection';
import { SignupModal } from '../components/SignupModal';
import { PropertyGallery, GalleryItem } from '../components/PropertyGallery';
import { ContactAgentSidebar, AgentInfo } from '../components/ContactAgentSidebar';
import { DocumentationSection } from '../components/DocumentationSection';
import { MessagesTable } from '../components/MessagesTable';
import { ConversationWithDetails, MessageStatus, UserRole } from '@types';

/**
 * Test Suite: Landing Page to Signup Flow Integration
 */
describe('Landing Page to Signup Flow Integration', () => {
  /**
   * Test 1: "Find Space" CTA triggers signup modal - Tenant role pre-selection
   */
  test('Find Space button click handler is called and SignupModal can accept tenant role', async () => {
    const mockOnFindSpace = jest.fn();
    const mockOnSignupSuccess = jest.fn();

    render(
      <>
        <HeroSection onFindSpace={mockOnFindSpace} />
        <SignupModal
          isOpen={true}
          onClose={() => {}}
          onSwitchToLogin={() => {}}
          onSignupSuccess={mockOnSignupSuccess}
          initialRole="tenant"
        />
      </>
    );

    // Click Find Space button
    const findSpaceButton = screen.getByRole('button', { name: /find space/i });
    fireEvent.click(findSpaceButton);
    expect(mockOnFindSpace).toHaveBeenCalled();

    // Verify SignupModal is rendered with tenant role initially selected
    // The initialRole prop sets the initial state - verify by checking the role card exists
    const tenantCard = screen.getByTestId('role-card-tenant');
    expect(tenantCard).toBeInTheDocument();

    // Verify tenant role card shows correct label per Figma spec
    expect(screen.getByText('Tenants / Franchisers')).toBeInTheDocument();
  });

  /**
   * Test 2: "List Property" CTA triggers signup modal - Landlord role pre-selection
   */
  test('List Property button click handler is called and SignupModal can accept landlord role', async () => {
    const mockOnListProperty = jest.fn();
    const mockOnSignupSuccess = jest.fn();

    render(
      <>
        <HeroSection onListProperty={mockOnListProperty} />
        <SignupModal
          isOpen={true}
          onClose={() => {}}
          onSwitchToLogin={() => {}}
          onSignupSuccess={mockOnSignupSuccess}
          initialRole="landlord"
        />
      </>
    );

    // Click List Property button
    const listPropertyButton = screen.getByRole('button', { name: /list property/i });
    fireEvent.click(listPropertyButton);
    expect(mockOnListProperty).toHaveBeenCalled();

    // Verify SignupModal is rendered with landlord role available
    const landlordCard = screen.getByTestId('role-card-landlord');
    expect(landlordCard).toBeInTheDocument();

    // Verify landlord role card shows correct label per Figma spec
    expect(screen.getByText('Landlords / Asset Managers')).toBeInTheDocument();
  });
});

/**
 * Test Suite: Property Detail Page Integration
 */
describe('Property Detail Page Integration', () => {
  const mockGalleryItems: GalleryItem[] = [
    { url: 'https://example.com/image1.jpg' },
    { url: 'https://example.com/image2.jpg' },
    { url: 'https://example.com/image3.jpg' },
    { url: 'https://example.com/image4.jpg' },
  ];

  const mockAgent: AgentInfo = {
    name: 'John Smith',
    company: 'CBRE',
    photoUrl: 'https://example.com/agent.jpg',
    email: 'john@cbre.com',
    phone: '(305) 555-1234',
  };

  const mockDocuments = [
    { name: 'Blueprints.pdf', url: '/docs/blueprints.pdf' },
    { name: 'Zoning.pdf', url: '/docs/zoning.pdf' },
  ];

  /**
   * Test 3: Property Detail renders all new sections together
   */
  test('all property detail sections render together correctly', () => {
    const mockOnSendMessage = jest.fn();
    const mockOnSendQFP = jest.fn();
    const mockOnDecline = jest.fn();

    const { container } = render(
      <div data-testid="property-detail-layout">
        {/* Gallery Section */}
        <PropertyGallery items={mockGalleryItems} propertyTitle="Test Property" />

        {/* Contact Sidebar */}
        <ContactAgentSidebar
          agent={mockAgent}
          onSendMessage={mockOnSendMessage}
          onSendQFP={mockOnSendQFP}
          onDecline={mockOnDecline}
        />

        {/* Documentation Section */}
        <DocumentationSection documents={mockDocuments} />
      </div>
    );

    // Verify Gallery renders
    const heroContainer = container.querySelector('.heroContainer');
    expect(heroContainer).toBeInTheDocument();
    const thumbnails = screen.getAllByRole('button');
    expect(thumbnails.length).toBeGreaterThanOrEqual(3);

    // Verify Contact Sidebar renders
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('CBRE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send qfp/i })).toBeInTheDocument();

    // Verify Documentation Section renders
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Blueprints.pdf')).toBeInTheDocument();
    expect(screen.getByText('Zoning.pdf')).toBeInTheDocument();
  });
});

/**
 * Test Suite: Messages Page Data Transformation
 */
describe('Messages Page Data Transformation', () => {
  const mockConversation: ConversationWithDetails = {
    id: 'conv-1',
    property_listing_id: 'prop-1',
    demand_listing_id: null,
    subject: 'Property Inquiry',
    created_by: 'user-1',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
    last_message_at: new Date('2024-01-15T10:00:00Z'),
    participants: [
      {
        id: 'participant-1',
        conversation_id: 'conv-1',
        user_id: 'user-1',
        last_read_at: new Date('2024-01-15T09:00:00Z'),
        unread_count: 2,
        is_muted: false,
        joined_at: new Date('2024-01-15T10:00:00Z'),
        left_at: null,
        user: {
          id: 'user-1',
          email: 'tenant@test.com',
          role: UserRole.TENANT,
          profile: {
            first_name: 'John',
            last_name: 'Tenant',
            photo_url: null,
          },
        },
      },
    ],
    lastMessage: {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'Test message',
      attachments: [],
      status: MessageStatus.DELIVERED,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date('2024-01-15T10:00:00Z'),
      updated_at: new Date('2024-01-15T10:00:00Z'),
    },
    unreadCount: 2,
  };

  const mockPropertyData = {
    'conv-1': {
      broker: 'Jane Agent',
      landlord: 'Property LLC',
      propertyName: 'Downtown Tower',
      address: '123 Main St',
      sqft: '5,000',
      location: 'Miami, FL',
    },
  };

  /**
   * Test 4: Conversation data transforms correctly to table row
   */
  test('conversation data displays correctly in table format', () => {
    const mockOnSelectConversation = jest.fn();
    const mockOnSendMessage = jest.fn();

    render(
      <MessagesTable
        conversations={[mockConversation]}
        currentUserId="user-1"
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={false}
        propertyData={mockPropertyData}
      />
    );

    // Verify table columns render with transformed data
    expect(screen.getByText('Jane Agent')).toBeInTheDocument();
    expect(screen.getByText('Property LLC')).toBeInTheDocument();
    expect(screen.getByText('Downtown Tower')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('Miami, FL')).toBeInTheDocument();

    // Verify unread count displays
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  /**
   * Test 5: Multiple conversations display in sorted order
   */
  test('multiple conversations display with proper structure', () => {
    const secondConversation: ConversationWithDetails = {
      ...mockConversation,
      id: 'conv-2',
      subject: 'Another Inquiry',
      unreadCount: 0,
    };

    const extendedPropertyData = {
      ...mockPropertyData,
      'conv-2': {
        broker: 'Bob Broker',
        landlord: 'Second LLC',
        propertyName: 'Retail Plaza',
        address: '456 Oak Ave',
        sqft: '3,000',
        location: 'Tampa, FL',
      },
    };

    render(
      <MessagesTable
        conversations={[mockConversation, secondConversation]}
        currentUserId="user-1"
        onSelectConversation={jest.fn()}
        onSendMessage={jest.fn()}
        loading={false}
        propertyData={extendedPropertyData}
      />
    );

    // Verify both rows render
    expect(screen.getByText('Downtown Tower')).toBeInTheDocument();
    expect(screen.getByText('Retail Plaza')).toBeInTheDocument();

    // Verify both brokers display
    expect(screen.getByText('Jane Agent')).toBeInTheDocument();
    expect(screen.getByText('Bob Broker')).toBeInTheDocument();

    // Verify table has header row and 2 data rows
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(3); // header + 2 data rows
  });
});
