import React, { useState, useRef, useEffect } from 'react';
import { ConversationWithDetails, Message } from '@types';
import styles from './MessagesTableRow.module.css';

export interface MessageRowData {
  broker: string;
  landlord: string;
  propertyName: string;
  address: string;
  sqft: string;
  location: string;
}

interface MessagesTableRowProps {
  conversation: ConversationWithDetails;
  rowData: MessageRowData;
  currentUserId: string;
  isExpanded: boolean;
  onToggleExpand: (conversationId: string) => void;
  messages: Message[];
  onSendMessage: (conversationId: string, content: string) => void;
  loadingMessages?: boolean;
}

/**
 * MessagesTableRow Component
 * A single row in the messages table that can expand to show conversation thread
 */
export const MessagesTableRow: React.FC<MessagesTableRowProps> = ({
  conversation,
  rowData,
  currentUserId,
  isExpanded,
  onToggleExpand,
  messages,
  onSendMessage,
  loadingMessages = false,
}) => {
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUnread = (conversation.unreadCount || 0) > 0;

  // Format date for display
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Format timestamp for messages
  const formatTimestamp = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get sender display name
  const getSenderName = (message: Message): string => {
    if (message.sender?.profile) {
      return `${message.sender.profile.first_name} ${message.sender.profile.last_name}`;
    }
    return message.sender?.email || 'Unknown';
  };

  // Handle send reply
  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onSendMessage(conversation.id, replyText.trim());
    setReplyText('');
    textareaRef.current?.focus();
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isExpanded]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [replyText]);

  const displayDate = conversation.lastMessage
    ? formatDate(conversation.lastMessage.created_at)
    : formatDate(conversation.created_at);

  return (
    <>
      {/* Main row */}
      <tr className={`${styles.tableRow} ${isUnread ? styles.unread : ''} ${isExpanded ? styles.expanded : ''}`}>
        <td className={styles.tableCell}>
          <div className={styles.dateCell}>
            {isUnread && (
              <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
            )}
            <span>{displayDate}</span>
          </div>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.truncate} title={rowData.broker}>
            {rowData.broker}
          </span>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.truncate} title={rowData.landlord}>
            {rowData.landlord}
          </span>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.truncate} title={rowData.propertyName}>
            {rowData.propertyName}
          </span>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.truncate} title={rowData.address}>
            {rowData.address}
          </span>
        </td>
        <td className={styles.tableCell}>{rowData.sqft}</td>
        <td className={styles.tableCell}>
          <span className={styles.truncate} title={rowData.location}>
            {rowData.location}
          </span>
        </td>
        <td className={`${styles.tableCell} ${styles.expandCell}`}>
          <button
            className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
            onClick={() => onToggleExpand(conversation.id)}
            aria-label={isExpanded ? 'Collapse conversation' : 'Expand conversation'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </td>
      </tr>

      {/* Expanded content row */}
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={8}>
            <div className={styles.expandedContent}>
              {/* Messages container */}
              <div className={styles.messagesContainer}>
                {loadingMessages ? (
                  <div className={styles.emptyMessages}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    No messages in this conversation
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const senderName = getSenderName(message);
                      const initials = message.sender?.profile
                        ? `${message.sender.profile.first_name[0]}${message.sender.profile.last_name[0]}`.toUpperCase()
                        : senderName.substring(0, 2).toUpperCase();
                      const photoUrl = message.sender?.profile?.photo_url;

                      return (
                        <div key={message.id} className={styles.messageItem}>
                          <div className={styles.messageAvatar}>
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={senderName}
                                className={styles.messageAvatarImage}
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className={styles.messageBody}>
                            <div className={styles.messageHeader}>
                              <span className={styles.messageSender}>{senderName}</span>
                              <span className={styles.messageTimestamp}>
                                {formatTimestamp(message.created_at)}
                              </span>
                            </div>
                            <p className={styles.messageContent}>
                              {message.is_deleted ? (
                                <em>This message was deleted</em>
                              ) : (
                                message.content
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply input section */}
              <div className={styles.replySection}>
                <textarea
                  ref={textareaRef}
                  className={styles.replyInput}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  rows={1}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  aria-label="Send reply"
                  title="Send"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default MessagesTableRow;
