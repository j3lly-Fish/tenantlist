import { io, Socket } from 'socket.io-client';
import { Message, ConversationWithDetails } from '@types';

/**
 * Messaging WebSocket event types
 */
export interface NewMessageEvent {
  message: Message;
  timestamp: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  conversationId: string;
  timestamp: string;
}

export interface NewConversationEvent {
  conversation: ConversationWithDetails;
  timestamp: string;
}

export interface ConversationUpdatedEvent {
  conversationId: string;
  lastMessage: Message;
  timestamp: string;
}

export interface UnreadUpdateEvent {
  unreadCount: number;
  timestamp: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
}

export interface MessageReadEvent {
  conversationId: string;
  userId: string;
  timestamp: string;
}

/**
 * Messaging WebSocket Client
 *
 * Features:
 * - Connects to /messaging namespace with JWT authentication
 * - Handles real-time message events
 * - Supports typing indicators
 * - Manages conversation rooms
 */
class MessagingWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelays = [1000, 2000, 4000, 8000, 16000];
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  /**
   * Connect to messaging WebSocket namespace
   */
  connect(onConnectionFailed?: () => void): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('Messaging WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? '';

    try {
      this.socket = io(`${wsBaseUrl}/messaging`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Messaging WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Messaging WebSocket connection error:', error.message);
        this.isConnecting = false;
        this.handleReconnect(onConnectionFailed);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Messaging WebSocket disconnected:', reason);
        this.isConnecting = false;

        if (reason !== 'io client disconnect') {
          this.handleReconnect(onConnectionFailed);
        }
      });

      this.socket.on('error', (error: any) => {
        console.error('Messaging WebSocket error:', error);
        if (error?.message?.includes('authentication')) {
          console.error('Messaging WebSocket authentication failed');
          this.disconnect();
          if (onConnectionFailed) {
            onConnectionFailed();
          }
        }
      });

      this.reattachEventHandlers();
    } catch (error) {
      console.error('Failed to create Messaging WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect(onConnectionFailed);
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(onConnectionFailed?: () => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Messaging WebSocket: Max reconnection attempts reached');
      if (onConnectionFailed) {
        onConnectionFailed();
      }
      return;
    }

    const delayIndex = Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1);
    const delay = Math.min(this.reconnectDelays[delayIndex], this.maxReconnectDelay);

    console.log(`Messaging WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(onConnectionFailed);
    }, delay);
  }

  /**
   * Reattach event handlers after reconnection
   */
  private reattachEventHandlers(): void {
    if (!this.socket) return;

    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler as any);
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.eventHandlers.clear();
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Messaging socket not connected');
      return;
    }
    this.socket.emit('conversation:join', conversationId);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Messaging socket not connected');
      return;
    }
    this.socket.emit('conversation:leave', conversationId);
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:start', conversationId);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:stop', conversationId);
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string, messageId?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message:read', { conversationId, messageId });
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (data: NewMessageEvent) => void): () => void {
    return this.addEventListener('message:new', callback);
  }

  /**
   * Listen for message deleted events
   */
  onMessageDeleted(callback: (data: MessageDeletedEvent) => void): () => void {
    return this.addEventListener('message:deleted', callback);
  }

  /**
   * Listen for new conversation events
   */
  onNewConversation(callback: (data: NewConversationEvent) => void): () => void {
    return this.addEventListener('conversation:new', callback);
  }

  /**
   * Listen for conversation updated events
   */
  onConversationUpdated(callback: (data: ConversationUpdatedEvent) => void): () => void {
    return this.addEventListener('conversation:updated', callback);
  }

  /**
   * Listen for unread count updates
   */
  onUnreadUpdate(callback: (data: UnreadUpdateEvent) => void): () => void {
    return this.addEventListener('unread:update', callback);
  }

  /**
   * Listen for typing start events
   */
  onTypingStart(callback: (data: TypingEvent) => void): () => void {
    return this.addEventListener('typing:start', callback);
  }

  /**
   * Listen for typing stop events
   */
  onTypingStop(callback: (data: TypingEvent) => void): () => void {
    return this.addEventListener('typing:stop', callback);
  }

  /**
   * Listen for message read events
   */
  onMessageRead(callback: (data: MessageReadEvent) => void): () => void {
    return this.addEventListener('message:read', callback);
  }

  /**
   * Listen for conversation joined confirmation
   */
  onConversationJoined(callback: (data: { conversationId: string }) => void): () => void {
    return this.addEventListener('conversation:joined', callback);
  }

  /**
   * Generic event listener helper
   */
  private addEventListener<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      console.warn('Messaging socket not connected');
      return () => {};
    }

    const handler = (data: T) => {
      callback(data);
    };

    this.socket.on(event, handler);

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);

    return () => {
      this.socket?.off(event, handler);
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const messagingWebSocket = new MessagingWebSocketClient();

export default messagingWebSocket;
