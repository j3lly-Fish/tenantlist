import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { TopNavigation } from '@components/TopNavigation';
import { MessagesTable } from '@components/MessagesTable';
import { MessageRowData } from '@components/MessagesTableRow';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markConversationAsRead,
} from '@utils/apiClient';
import { messagingWebSocket } from '@utils/messagingWebsocket';
import { ConversationWithDetails, Message, UserRole } from '@types';
import styles from './Messages.module.css';

/**
 * Messages Page
 * Table-based messaging interface with expandable conversation rows
 */
const Messages: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId || '';

  // State
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

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

  // Handle conversation selection (expand/collapse)
  const handleSelectConversation = useCallback(
    async (conversation: ConversationWithDetails) => {
      // If clicking the same conversation, collapse it
      if (selectedConversation?.id === conversation.id) {
        messagingWebSocket.leaveConversation(conversation.id);
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      // Leave previous conversation
      if (selectedConversation) {
        messagingWebSocket.leaveConversation(selectedConversation.id);
      }

      setSelectedConversation(conversation);
      setMessages([]);
      oldestMessageIdRef.current = null;

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
    [selectedConversation, fetchMessages]
  );

  // Handle send message from table row
  const handleSendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!content.trim()) return;

      try {
        setSendingMessage(true);
        const { message } = await sendMessageApi(conversationId, {
          content,
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
    []
  );

  // Generate property data for each conversation
  // In a real app, this would come from the API along with conversation data
  const propertyData = useMemo(() => {
    const data: { [conversationId: string]: MessageRowData } = {};

    conversations.forEach((conv) => {
      // Find the other participant (broker or landlord)
      const otherParticipant = conv.participants?.find((p) => p.user_id !== currentUserId);
      const participantName = otherParticipant?.user?.profile
        ? `${otherParticipant.user.profile.first_name} ${otherParticipant.user.profile.last_name}`
        : otherParticipant?.user?.email || 'Unknown';
      const participantRole = otherParticipant?.user?.role;

      // Determine broker and landlord based on participant roles
      let broker = '-';
      let landlord = '-';

      if (participantRole === UserRole.BROKER) {
        broker = participantName;
        landlord = 'Property Owner'; // Placeholder
      } else if (participantRole === UserRole.LANDLORD) {
        landlord = participantName;
        broker = 'Direct Contact';
      } else {
        broker = participantName;
      }

      // Extract property info from conversation subject or use defaults
      // In production, this would come from linked property_listing or demand_listing
      const propertyName = conv.subject || 'Property Inquiry';
      const address = '-'; // Would come from property listing
      const sqft = '-'; // Would come from property listing
      const location = '-'; // Would come from property listing

      data[conv.id] = {
        broker,
        landlord,
        propertyName,
        address,
        sqft,
        location,
      };
    });

    return data;
  }, [conversations, currentUserId]);

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
        <MessagesTable
          conversations={conversations}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
          onSendMessage={handleSendMessage}
          loading={loadingConversations}
          propertyData={propertyData}
          expandedConversationId={selectedConversation?.id || null}
          expandedMessages={messages}
          loadingMessages={loadingMessages}
        />
      </main>
    </div>
  );
};

export default Messages;
