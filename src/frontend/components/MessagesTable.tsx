import React, { useState, useMemo, useCallback } from 'react';
import { ConversationWithDetails, Message } from '@types';
import { MessagesTableRow, MessageRowData } from './MessagesTableRow';
import styles from './MessagesTable.module.css';

type SortField = 'date' | 'broker' | 'landlord' | 'propertyName' | 'address' | 'sqft' | 'location';
type SortDirection = 'asc' | 'desc';

interface PropertyData {
  [conversationId: string]: MessageRowData;
}

interface MessagesTableProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  loading?: boolean;
  propertyData: PropertyData;
  expandedConversationId?: string | null;
  expandedMessages?: Message[];
  loadingMessages?: boolean;
}

/**
 * MessagesTable Component
 * Displays messages/conversations in a table format with expandable rows
 */
export const MessagesTable: React.FC<MessagesTableProps> = ({
  conversations,
  currentUserId,
  onSelectConversation,
  onSendMessage,
  loading = false,
  propertyData,
  expandedConversationId,
  expandedMessages = [],
  loadingMessages = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [localExpandedId, setLocalExpandedId] = useState<string | null>(null);

  // Use external expanded state if provided, otherwise use local state
  const effectiveExpandedId = expandedConversationId !== undefined ? expandedConversationId : localExpandedId;

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const data = propertyData[conv.id];
      if (!data) return true; // Include if no property data

      return (
        data.broker.toLowerCase().includes(query) ||
        data.landlord.toLowerCase().includes(query) ||
        data.propertyName.toLowerCase().includes(query) ||
        data.address.toLowerCase().includes(query) ||
        data.location.toLowerCase().includes(query) ||
        (conv.subject?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [conversations, searchQuery, propertyData]);

  // Sort conversations
  const sortedConversations = useMemo(() => {
    const sorted = [...filteredConversations];

    sorted.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      const aData = propertyData[a.id] || {
        broker: '',
        landlord: '',
        propertyName: '',
        address: '',
        sqft: '0',
        location: '',
      };
      const bData = propertyData[b.id] || {
        broker: '',
        landlord: '',
        propertyName: '',
        address: '',
        sqft: '0',
        location: '',
      };

      switch (sortField) {
        case 'date':
          aValue = new Date(a.lastMessage?.created_at || a.created_at).getTime();
          bValue = new Date(b.lastMessage?.created_at || b.created_at).getTime();
          break;
        case 'broker':
          aValue = aData.broker.toLowerCase();
          bValue = bData.broker.toLowerCase();
          break;
        case 'landlord':
          aValue = aData.landlord.toLowerCase();
          bValue = bData.landlord.toLowerCase();
          break;
        case 'propertyName':
          aValue = aData.propertyName.toLowerCase();
          bValue = bData.propertyName.toLowerCase();
          break;
        case 'address':
          aValue = aData.address.toLowerCase();
          bValue = bData.address.toLowerCase();
          break;
        case 'sqft':
          aValue = parseInt(aData.sqft.replace(/,/g, ''), 10) || 0;
          bValue = parseInt(bData.sqft.replace(/,/g, ''), 10) || 0;
          break;
        case 'location':
          aValue = aData.location.toLowerCase();
          bValue = bData.location.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredConversations, sortField, sortDirection, propertyData]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle row expand/collapse
  const handleToggleExpand = useCallback((conversationId: string) => {
    if (expandedConversationId !== undefined) {
      // If using external state, call onSelectConversation
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        onSelectConversation(conv);
      }
    } else {
      // Use local state
      setLocalExpandedId((prev) => (prev === conversationId ? null : conversationId));
    }
  }, [conversations, expandedConversationId, onSelectConversation]);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    return (
      <span className={styles.sortIcon}>
        {isActive ? (
          sortDirection === 'asc' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </span>
    );
  };

  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={`${styles.skeleton} ${styles.skeletonShort}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonMedium}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonMedium}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonLong}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonMedium}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonShort}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonMedium}`} /></td>
          <td><div className={`${styles.skeleton} ${styles.skeletonShort}`} /></td>
        </tr>
      ))}
    </>
  );

  // Render empty state
  const renderEmptyState = () => (
    <tr>
      <td colSpan={8}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className={styles.emptyText}>
            {searchQuery ? 'No messages found' : 'No messages yet'}
          </p>
          <p className={styles.emptySubtext}>
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'When you receive messages, they will appear here'}
          </p>
        </div>
      </td>
    </tr>
  );

  return (
    <div className={styles.messagesTableContainer}>
      {/* Header with title and search */}
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Messages</h2>
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search messages"
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'date' ? styles.sortActive : ''}`}
                onClick={() => handleSort('date')}
              >
                Date {renderSortIcon('date')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'broker' ? styles.sortActive : ''}`}
                onClick={() => handleSort('broker')}
              >
                Broker {renderSortIcon('broker')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'landlord' ? styles.sortActive : ''}`}
                onClick={() => handleSort('landlord')}
              >
                Landlord {renderSortIcon('landlord')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'propertyName' ? styles.sortActive : ''}`}
                onClick={() => handleSort('propertyName')}
              >
                Property Name {renderSortIcon('propertyName')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'address' ? styles.sortActive : ''}`}
                onClick={() => handleSort('address')}
              >
                Address {renderSortIcon('address')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'sqft' ? styles.sortActive : ''}`}
                onClick={() => handleSort('sqft')}
              >
                Sqft {renderSortIcon('sqft')}
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${sortField === 'location' ? styles.sortActive : ''}`}
                onClick={() => handleSort('location')}
              >
                Location {renderSortIcon('location')}
              </th>
              <th className={styles.th}>
                {/* Expand column - no header text */}
              </th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {loading ? (
              renderSkeletons()
            ) : sortedConversations.length === 0 ? (
              renderEmptyState()
            ) : (
              sortedConversations.map((conversation) => {
                const rowData = propertyData[conversation.id] || {
                  broker: '-',
                  landlord: '-',
                  propertyName: conversation.subject || 'Untitled',
                  address: '-',
                  sqft: '-',
                  location: '-',
                };

                const isExpanded = effectiveExpandedId === conversation.id;
                const messages = isExpanded ? expandedMessages : [];

                return (
                  <MessagesTableRow
                    key={conversation.id}
                    conversation={conversation}
                    rowData={rowData}
                    currentUserId={currentUserId}
                    isExpanded={isExpanded}
                    onToggleExpand={handleToggleExpand}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    loadingMessages={loadingMessages && isExpanded}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MessagesTable;
