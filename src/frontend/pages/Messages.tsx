import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { TopNavigation } from '@components/TopNavigation';
import { ConversationList } from '@components/ConversationList';
import { MessageThread } from '@components/MessageThread';
import { MessageInput } from '@components/MessageInput';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markConversationAsRead,
} from '@utils/apiClient';
import { messagingWebSocket } from '@utils/messagingWebsocket';
import { ConversationWithDetails, Message } from '@types';
import styles from './Messages.module.css';

/**
 * Messages Page
 * Full messaging interface with conversation list and chat view
 */
const Messages: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId || '';

  // State
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Loading states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Pagination
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const oldestMessageIdRef = useRef<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection state
  const [isConnected, setIsConnected] = useState(false);

  // Mobile view state
  const [showSidebar, setShowSidebar] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      setConversations(data.conversations);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, before?: string) => {
    try {
      setLoadingMessages(true);
      const data = await getMessages(conversationId, { limit: 50, before });

      if (before) {
        // Append older messages
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        // Replace messages
        setMessages(data.messages);
      }

      setHasMoreMessages(data.hasMore);

      // Track oldest message for pagination
      if (data.messages.length > 0) {
        oldestMessageIdRef.current = data.messages[0].id;
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    messagingWebSocket.connect(() => {
      setIsConnected(false);
      setError('Lost connection to messaging server');
    });

    // Set up event listeners
    const unsubscribeNewMessage = messagingWebSocket.onNewMessage((data) => {
      // Add new message to current conversation
      if (selectedConversation && data.message.conversation_id === selectedConversation.id) {
        setMessages((prev) => [...prev, data.message]);

        // Mark as read since we're viewing the conversation
        markConversationAsRead(selectedConversation.id).catch(console.error);
      }

      // Update conversation list
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === data.message.conversation_id) {
            return {
              ...conv,
              lastMessage: data.message,
              unreadCount:
                selectedConversation?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });

        // Sort by last message time
        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.created_at || a.created_at;
          const bTime = b.lastMessage?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      });
    });

    const unsubscribeTypingStart = messagingWebSocket.onTypingStart((data) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    const unsubscribeTypingStop = messagingWebSocket.onTypingStop((data) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    const unsubscribeNewConversation = messagingWebSocket.onNewConversation((data) => {
      setConversations((prev) => [data.conversation, ...prev]);
    });

    const unsubscribeUnreadUpdate = messagingWebSocket.onUnreadUpdate((data) => {
      // Could update a global unread badge here
      console.log('Unread count updated:', data.unreadCount);
    });

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(messagingWebSocket.isConnected());
    }, 1000);

    return () => {
      unsubscribeNewMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeNewConversation();
      unsubscribeUnreadUpdate();
      clearInterval(checkConnection);
      messagingWebSocket.disconnect();
    };
  }, [currentUserId, selectedConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    async (conversation: ConversationWithDetails) => {
      setSelectedConversation(conversation);
      setMessages([]);
      oldestMessageIdRef.current = null;
      setShowSidebar(false);

      // Fetch messages
      await fetchMessages(conversation.id);

      // Join WebSocket room
      messagingWebSocket.joinConversation(conversation.id);

      // Mark as read
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        try {
          await markConversationAsRead(conversation.id);
          setConversations((prev) =>
            prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
          );
        } catch (err) {
          console.error('Failed to mark conversation as read:', err);
        }
      }
    },
    [fetchMessages]
  );

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string, attachments?: any[]) => {
      if (!selectedConversation) return;

      try {
        setSendingMessage(true);
        const { message } = await sendMessageApi(selectedConversation.id, {
          content,
          attachments,
        });

        // Message will be added via WebSocket, but add optimistically for better UX
        setMessages((prev) => [...prev, message]);
      } catch (err: any) {
        console.error('Failed to send message:', err);
        setError('Failed to send message. Please try again.');
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedConversation]
  );

  // Handle load more messages
  const handleLoadMore = useCallback(() => {
    if (selectedConversation && oldestMessageIdRef.current && !loadingMessages) {
      fetchMessages(selectedConversation.id, oldestMessageIdRef.current);
    }
  }, [selectedConversation, fetchMessages, loadingMessages]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (selectedConversation) {
      messagingWebSocket.startTyping(selectedConversation.id);
    }
  }, [selectedConversation]);

  const handleTypingStop = useCallback(() => {
    if (selectedConversation) {
      messagingWebSocket.stopTyping(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Handle back button on mobile
  const handleBack = useCallback(() => {
    setShowSidebar(true);
    if (selectedConversation) {
      messagingWebSocket.leaveConversation(selectedConversation.id);
    }
    setSelectedConversation(null);
    setMessages([]);
  }, [selectedConversation]);

  return (
    <div className={styles.messagesPage}>
      <TopNavigation />

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button className={styles.retryButton} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Connection status */}
      {!isConnected && !loadingConversations && (
        <div className={styles.connectionStatus}>
          <span className={styles.connectionDot} />
          <span>Connecting to messaging server...</span>
        </div>
      )}

      <main className={styles.mainContent}>
        {/* Conversation list sidebar */}
        <aside className={`${styles.sidebar} ${!showSidebar ? styles.hidden : ''}`}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            currentUserId={currentUserId}
            loading={loadingConversations}
            onSelectConversation={handleSelectConversation}
          />
        </aside>

        {/* Chat area */}
        <section className={`${styles.chatArea} ${showSidebar ? styles.hidden : ''}`}>
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId}
            loading={loadingMessages}
            hasMore={hasMoreMessages}
            typingUsers={typingUsers}
            onLoadMore={handleLoadMore}
            onBack={handleBack}
          />

          {selectedConversation && (
            <MessageInput
              onSend={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={sendingMessage}
              placeholder="Type a message..."
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default Messages;
