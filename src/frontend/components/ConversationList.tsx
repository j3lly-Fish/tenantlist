import React, { useState, useMemo } from 'react';
import { ConversationWithDetails } from '@types';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId?: string;
  currentUserId: string;
  loading?: boolean;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onNewChat?: () => void;
}

/**
 * ConversationList Component
 * Displays a list of conversations with search and selection
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  currentUserId,
  loading = false,
  onSelectConversation,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Search in participant names
      const otherParticipant = conv.participants?.find((p) => p.user_id !== currentUserId);
      const participantName = otherParticipant?.user?.profile
        ? `${otherParticipant.user.profile.first_name} ${otherParticipant.user.profile.last_name}`
        : otherParticipant?.user?.email || '';

      // Search in subject
      const subject = conv.subject || '';

      // Search in last message
      const lastMessage = conv.lastMessage?.content || '';

      return (
        participantName.toLowerCase().includes(query) ||
        subject.toLowerCase().includes(query) ||
        lastMessage.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, currentUserId]);

  // Get display name for a conversation
  const getDisplayName = (conversation: ConversationWithDetails): string => {
    if (conversation.subject) return conversation.subject;

    const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUserId);
    if (otherParticipant?.user?.profile) {
      return `${otherParticipant.user.profile.first_name} ${otherParticipant.user.profile.last_name}`;
    }
    return otherParticipant?.user?.email || 'Unknown User';
  };

  // Get avatar initials
  const getInitials = (conversation: ConversationWithDetails): string => {
    const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUserId);
    if (otherParticipant?.user?.profile) {
      const { first_name, last_name } = otherParticipant.user.profile;
      return `${first_name?.[0] || ''}${last_name?.[0] || ''}`.toUpperCase();
    }
    return otherParticipant?.user?.email?.[0]?.toUpperCase() || '?';
  };

  // Get avatar image URL
  const getAvatarUrl = (conversation: ConversationWithDetails): string | null => {
    const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUserId);
    return otherParticipant?.user?.profile?.photo_url || null;
  };

  // Format timestamp
  const formatTimestamp = (date: Date | string): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
          <div className={styles.skeletonContent}>
            <div className={`${styles.skeleton} ${styles.skeletonName}`} />
            <div className={`${styles.skeleton} ${styles.skeletonMessage}`} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className={styles.conversationList}>
      <div className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        {onNewChat && (
          <button
            className={styles.newChatButton}
            onClick={onNewChat}
            aria-label="Start new conversation"
            title="New message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      <div className={styles.listContainer}>
        {loading ? (
          renderSkeletons()
        ) : filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className={styles.emptyText}>
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const isUnread = (conversation.unreadCount || 0) > 0;
            const displayName = getDisplayName(conversation);
            const avatarUrl = getAvatarUrl(conversation);
            const initials = getInitials(conversation);

            return (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${isSelected ? styles.active : ''} ${isUnread ? styles.unread : ''}`}
                onClick={() => onSelectConversation(conversation)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation(conversation);
                  }
                }}
                aria-selected={isSelected}
              >
                <div className={styles.avatar}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className={styles.avatarImage} />
                  ) : (
                    initials
                  )}
                </div>

                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <span className={styles.participantName}>{displayName}</span>
                    {conversation.lastMessage && (
                      <span className={styles.timestamp}>
                        {formatTimestamp(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p className={styles.lastMessage}>
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    {isUnread && (
                      <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
