/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react';
import { MessagesTable } from '../components/MessagesTable';
import { MessagesTableRow } from '../components/MessagesTableRow';
import { ConversationWithDetails, MessageStatus, UserRole } from '@types';

// Mock conversation data for testing
const mockConversation: ConversationWithDetails = {
  id: 'conv-1',
  property_listing_id: 'prop-1',
  demand_listing_id: null,
  subject: 'Inquiry about Office Space',
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
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        profile: {
          first_name: 'John',
          last_name: 'Tenant',
          photo_url: null,
        },
      },
    },
    {
      id: 'participant-2',
      conversation_id: 'conv-1',
      user_id: 'user-2',
      last_read_at: new Date('2024-01-15T10:00:00Z'),
      unread_count: 0,
      is_muted: false,
      joined_at: new Date('2024-01-15T10:00:00Z'),
      left_at: null,
      user: {
        id: 'user-2',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        profile: {
          first_name: 'Jane',
          last_name: 'Broker',
          photo_url: null,
        },
      },
    },
  ],
  lastMessage: {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    content: 'Thank you for your interest!',
    attachments: [],
    status: MessageStatus.DELIVERED,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  },
  unreadCount: 2,
};

const mockConversations: ConversationWithDetails[] = [
  mockConversation,
  {
    ...mockConversation,
    id: 'conv-2',
    subject: 'Retail Space Inquiry',
    unreadCount: 0,
    lastMessage: {
      ...mockConversation.lastMessage!,
      id: 'msg-2',
      conversation_id: 'conv-2',
      content: 'Looking forward to the tour.',
      created_at: new Date('2024-01-14T10:00:00Z'),
      updated_at: new Date('2024-01-14T10:00:00Z'),
    },
  },
];

// Mock property data to associate with conversations
const mockPropertyData = {
  'conv-1': {
    broker: 'Jane Broker',
    landlord: 'Property Management Inc.',
    propertyName: 'Downtown Office Tower',
    address: '123 Main St',
    sqft: '5,000',
    location: 'Miami, FL',
  },
  'conv-2': {
    broker: 'Bob Agent',
    landlord: 'Retail Holdings LLC',
    propertyName: 'Aventura Mall Space',
    address: '456 Shopping Ave',
    sqft: '2,500',
    location: 'Aventura, FL',
  },
};

describe('MessagesTable', () => {
  const mockCurrentUserId = 'user-1';
  const mockOnSelectConversation = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render table headers correctly', () => {
    render(
      <MessagesTable
        conversations={mockConversations}
        currentUserId={mockCurrentUserId}
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={false}
        propertyData={mockPropertyData}
      />
    );

    // Check all column headers are present
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Broker')).toBeInTheDocument();
    expect(screen.getByText('Landlord')).toBeInTheDocument();
    expect(screen.getByText('Property Name')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Sqft')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('should display rows with Date, Broker, Landlord, Property Name, Address, Sqft, Location', () => {
    render(
      <MessagesTable
        conversations={mockConversations}
        currentUserId={mockCurrentUserId}
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={false}
        propertyData={mockPropertyData}
      />
    );

    // Check first row data is displayed
    expect(screen.getByText('Jane Broker')).toBeInTheDocument();
    expect(screen.getByText('Property Management Inc.')).toBeInTheDocument();
    expect(screen.getByText('Downtown Office Tower')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('Miami, FL')).toBeInTheDocument();
  });

  it('should display unread indicator badge', () => {
    render(
      <MessagesTable
        conversations={mockConversations}
        currentUserId={mockCurrentUserId}
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={false}
        propertyData={mockPropertyData}
      />
    );

    // Check for unread badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show loading state with skeletons', () => {
    const { container } = render(
      <MessagesTable
        conversations={[]}
        currentUserId={mockCurrentUserId}
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={true}
        propertyData={{}}
      />
    );

    // Check for skeleton elements
    const skeletonRows = container.querySelectorAll('[class*="skeletonRow"]');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should show empty state when no conversations', () => {
    render(
      <MessagesTable
        conversations={[]}
        currentUserId={mockCurrentUserId}
        onSelectConversation={mockOnSelectConversation}
        onSendMessage={mockOnSendMessage}
        loading={false}
        propertyData={{}}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});

describe('MessagesTableRow', () => {
  const mockCurrentUserId = 'user-1';
  const mockOnToggleExpand = jest.fn();
  const mockOnSendMessage = jest.fn();

  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'Thank you for your interest!',
      attachments: [],
      status: MessageStatus.DELIVERED,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date('2024-01-15T10:00:00Z'),
      updated_at: new Date('2024-01-15T10:00:00Z'),
      sender: {
        id: 'user-2',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        profile: {
          first_name: 'Jane',
          last_name: 'Broker',
          photo_url: null,
        },
      },
    },
  ];

  const mockRowData = {
    broker: 'Jane Broker',
    landlord: 'Property Management Inc.',
    propertyName: 'Downtown Office Tower',
    address: '123 Main St',
    sqft: '5,000',
    location: 'Miami, FL',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should toggle expansion when chevron is clicked', () => {
    render(
      <table>
        <tbody>
          <MessagesTableRow
            conversation={mockConversation}
            rowData={mockRowData}
            currentUserId={mockCurrentUserId}
            isExpanded={false}
            onToggleExpand={mockOnToggleExpand}
            messages={mockMessages}
            onSendMessage={mockOnSendMessage}
          />
        </tbody>
      </table>
    );

    // Find and click the expand button
    const expandButton = screen.getByLabelText('Expand conversation');
    fireEvent.click(expandButton);

    expect(mockOnToggleExpand).toHaveBeenCalledWith('conv-1');
  });

  it('should show expanded view with conversation messages when expanded', () => {
    render(
      <table>
        <tbody>
          <MessagesTableRow
            conversation={mockConversation}
            rowData={mockRowData}
            currentUserId={mockCurrentUserId}
            isExpanded={true}
            onToggleExpand={mockOnToggleExpand}
            messages={mockMessages}
            onSendMessage={mockOnSendMessage}
          />
        </tbody>
      </table>
    );

    // Check that message content is visible
    expect(screen.getByText('Thank you for your interest!')).toBeInTheDocument();
  });

  it('should render message content with avatar and timestamp', () => {
    render(
      <table>
        <tbody>
          <MessagesTableRow
            conversation={mockConversation}
            rowData={mockRowData}
            currentUserId={mockCurrentUserId}
            isExpanded={true}
            onToggleExpand={mockOnToggleExpand}
            messages={mockMessages}
            onSendMessage={mockOnSendMessage}
          />
        </tbody>
      </table>
    );

    // Check for avatar initials (JB for Jane Broker)
    expect(screen.getByText('JB')).toBeInTheDocument();
    // Check message content
    expect(screen.getByText('Thank you for your interest!')).toBeInTheDocument();
  });

  it('should have reply input at bottom of expanded section', () => {
    render(
      <table>
        <tbody>
          <MessagesTableRow
            conversation={mockConversation}
            rowData={mockRowData}
            currentUserId={mockCurrentUserId}
            isExpanded={true}
            onToggleExpand={mockOnToggleExpand}
            messages={mockMessages}
            onSendMessage={mockOnSendMessage}
          />
        </tbody>
      </table>
    );

    // Check for reply input placeholder
    expect(screen.getByPlaceholderText('Type a reply...')).toBeInTheDocument();
  });
});
