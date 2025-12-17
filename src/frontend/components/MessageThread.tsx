import React, { useEffect, useRef, useMemo } from 'react';
import { Message, ConversationWithDetails, MessageStatus } from '@types';
import styles from './MessageThread.module.css';

interface MessageThreadProps {
  conversation: ConversationWithDetails | null;
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  typingUsers?: string[];
  onLoadMore?: () => void;
  onBack?: () => void;
}

/**
 * MessageThread Component
 * Displays messages in a conversation with real-time updates
 */
export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  typingUsers = [],
  onLoadMore,
  onBack,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Get other participant for display
  const otherParticipant = useMemo(() => {
    if (!conversation?.participants) return null;
    return conversation.participants.find((p) => p.user_id !== currentUserId);
  }, [conversation, currentUserId]);

  // Get display name
  const displayName = useMemo(() => {
    if (conversation?.subject) return conversation.subject;
    if (otherParticipant?.user?.profile) {
      return `${otherParticipant.user.profile.first_name} ${otherParticipant.user.profile.last_name}`;
    }
    return otherParticipant?.user?.email || 'Unknown User';
  }, [conversation, otherParticipant]);

  // Get avatar info
  const avatarUrl = otherParticipant?.user?.profile?.photo_url || null;
  const initials = useMemo(() => {
    if (otherParticipant?.user?.profile) {
      const { first_name, last_name } = otherParticipant.user.profile;
      return `${first_name?.[0] || ''}${last_name?.[0] || ''}`.toUpperCase();
    }
    return otherParticipant?.user?.email?.[0]?.toUpperCase() || '?';
  }, [otherParticipant]);

  // Format message timestamp
  const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for separators
  const formatDate = (date: Date | string): string => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.created_at.toString(), messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  // Get typing indicator text
  const typingText = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return 'typing...';
    }
    return `${typingUsers.length} people typing...`;
  }, [typingUsers]);

  // Render message status icon
  const renderMessageStatus = (status: MessageStatus) => {
    if (status === MessageStatus.READ) {
      return (
        <span className={`${styles.messageStatus} ${styles.read}`} title="Read">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
            <path d="M20 12L9 23l-5-5" />
          </svg>
        </span>
      );
    }
    if (status === MessageStatus.DELIVERED) {
      return (
        <span className={`${styles.messageStatus} ${styles.delivered}`} title="Delivered">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      );
    }
    return null;
  };

  // No conversation selected
  if (!conversation) {
    return (
      <div className={styles.noConversation}>
        <div className={styles.emptyIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className={styles.emptyText}>Select a conversation</p>
        <p className={styles.emptySubtext}>Choose from your existing conversations or start a new one</p>
      </div>
    );
  }

  return (
    <div className={styles.messageThread}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack} aria-label="Back to conversations">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className={styles.headerAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className={styles.headerAvatarImage} />
          ) : (
            initials
          )}
        </div>

        <div className={styles.headerInfo}>
          <h2 className={styles.headerName}>{displayName}</h2>
          <p className={`${styles.headerStatus} ${typingText ? styles.typing : ''}`}>
            {typingText || (otherParticipant?.user?.role || '')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer} ref={containerRef}>
        {loading && messages.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className={styles.emptyText}>No messages yet</p>
            <p className={styles.emptySubtext}>Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Load more button */}
            {hasMore && (
              <button
                className={styles.loadMoreButton}
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load earlier messages'}
              </button>
            )}

            {/* Messages grouped by date */}
            {groupedMessages.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <div className={styles.dateSeparator}>
                  <span className={styles.dateSeparatorText}>{formatDate(group.date)}</span>
                </div>

                {group.messages.map((message) => {
                  const isSent = message.sender_id === currentUserId;
                  const isDeleted = message.is_deleted;

                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageWrapper} ${isSent ? styles.sent : styles.received} ${isDeleted ? styles.deleted : ''}`}
                    >
                      <div className={styles.messageBubble}>
                        {isDeleted ? (
                          'This message was deleted'
                        ) : (
                          <>
                            {message.content}
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className={styles.attachments}>
                                {message.attachments.map((attachment, index) => (
                                  <a
                                    key={index}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.attachment}
                                  >
                                    <span className={styles.attachmentIcon}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                      </svg>
                                    </span>
                                    <span className={styles.attachmentName}>{attachment.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <span className={styles.messageTimestamp}>
                        {formatTime(message.created_at)}
                        {isSent && !isDeleted && renderMessageStatus(message.status)}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageThread;
