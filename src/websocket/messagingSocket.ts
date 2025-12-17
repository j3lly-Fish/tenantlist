import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message, ConversationWithDetails } from '../types';
import { ConversationModel } from '../database/models/Conversation';

/**
 * Interface for decoded JWT token
 */
interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

/**
 * Interface for WebSocket socket data
 */
interface SocketData {
  userId: string;
  email: string;
  role: string;
}

/**
 * Messaging WebSocket server
 * Handles real-time messaging updates for conversations and messages
 */
export class MessagingSocketServer {
  private io: SocketIOServer;
  private namespace: Namespace;
  private conversationModel: ConversationModel;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.conversationModel = new ConversationModel();

    // Create /messaging namespace
    this.namespace = this.io.of('/messaging');

    // Set up authentication middleware
    this.namespace.use(this.authenticateSocket.bind(this));

    // Set up connection handler
    this.namespace.on('connection', this.handleConnection.bind(this));

    console.log('Messaging WebSocket server initialized');
  }

  /**
   * Authenticate WebSocket connection using JWT token
   */
  private async authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      // Get token from cookies first (preferred for httpOnly security)
      const cookies = socket.handshake.headers.cookie;
      let token: string | undefined;

      if (cookies) {
        const cookieArray = cookies.split(';').map(c => c.trim());
        const accessTokenCookie = cookieArray.find(c => c.startsWith('accessToken='));
        if (accessTokenCookie) {
          token = accessTokenCookie.split('=')[1];
        }
      }

      // Fall back to auth or query token if cookie not found
      if (!token) {
        token = socket.handshake.auth.token || socket.handshake.query.token as string;
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET not configured');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token as string, jwtSecret) as DecodedToken;

      // Attach user data to socket
      (socket.data as SocketData) = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error: any) {
      console.error('Messaging WebSocket authentication error:', error.message);
      next(new Error('Invalid authentication token'));
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(socket: Socket): Promise<void> {
    const socketData = socket.data as SocketData;
    const userId = socketData.userId;

    console.log(`Messaging WebSocket connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room for personal notifications
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // Auto-join all conversation rooms the user is a participant of
    try {
      const { conversations } = await this.conversationModel.findByUserId(userId, { limit: 100 });
      for (const conv of conversations) {
        const conversationRoom = `conversation:${conv.id}`;
        socket.join(conversationRoom);
      }
      console.log(`User ${userId} joined ${conversations.length} conversation rooms`);
    } catch (error) {
      console.error(`Failed to load conversations for user ${userId}:`, error);
    }

    // Handle joining a specific conversation room
    socket.on('conversation:join', async (conversationId: string) => {
      try {
        // Verify user is a participant
        const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant in this conversation' });
          return;
        }

        const conversationRoom = `conversation:${conversationId}`;
        socket.join(conversationRoom);
        socket.emit('conversation:joined', { conversationId });
        console.log(`Socket ${socket.id} joined conversation room: ${conversationRoom}`);
      } catch (error) {
        console.error('Error joining conversation room:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving a specific conversation room
    socket.on('conversation:leave', (conversationId: string) => {
      const conversationRoom = `conversation:${conversationId}`;
      socket.leave(conversationRoom);
      socket.emit('conversation:left', { conversationId });
      console.log(`Socket ${socket.id} left conversation room: ${conversationRoom}`);
    });

    // Handle typing indicators
    socket.on('typing:start', async (conversationId: string) => {
      try {
        const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) return;

        const conversationRoom = `conversation:${conversationId}`;
        socket.to(conversationRoom).emit('typing:start', {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error('Error with typing indicator:', error);
      }
    });

    socket.on('typing:stop', async (conversationId: string) => {
      try {
        const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) return;

        const conversationRoom = `conversation:${conversationId}`;
        socket.to(conversationRoom).emit('typing:stop', {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error('Error with typing indicator:', error);
      }
    });

    // Handle message read acknowledgment
    socket.on('message:read', async (data: { conversationId: string; messageId?: string }) => {
      try {
        const { conversationId } = data;
        const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) return;

        // Mark conversation as read
        await this.conversationModel.markAsRead(conversationId, userId);

        // Notify other participants
        const conversationRoom = `conversation:${conversationId}`;
        socket.to(conversationRoom).emit('message:read', {
          conversationId,
          userId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(
        `Messaging WebSocket disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`
      );
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Messaging WebSocket error for socket ${socket.id}:`, error);
    });
  }

  /**
   * Emit a new message to all participants in a conversation
   */
  public emitNewMessage(conversationId: string, message: Message): void {
    const conversationRoom = `conversation:${conversationId}`;
    this.namespace.to(conversationRoom).emit('message:new', {
      message,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted message:new to room ${conversationRoom}`);
  }

  /**
   * Emit message deleted event to a conversation
   */
  public emitMessageDeleted(conversationId: string, messageId: string): void {
    const conversationRoom = `conversation:${conversationId}`;
    this.namespace.to(conversationRoom).emit('message:deleted', {
      messageId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted message:deleted to room ${conversationRoom}`);
  }

  /**
   * Emit new conversation event to specific users
   */
  public emitNewConversation(userIds: string[], conversation: ConversationWithDetails): void {
    for (const userId of userIds) {
      const userRoom = `user:${userId}`;
      this.namespace.to(userRoom).emit('conversation:new', {
        conversation,
        timestamp: new Date().toISOString(),
      });
    }
    console.log(`Emitted conversation:new to ${userIds.length} users`);
  }

  /**
   * Emit unread count update to a specific user
   */
  public emitUnreadCountUpdate(userId: string, unreadCount: number): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('unread:update', {
      unreadCount,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted unread:update to user ${userId}: ${unreadCount}`);
  }

  /**
   * Emit conversation updated event (e.g., new message preview)
   */
  public emitConversationUpdated(userIds: string[], conversationId: string, lastMessage: Message): void {
    for (const userId of userIds) {
      const userRoom = `user:${userId}`;
      this.namespace.to(userRoom).emit('conversation:updated', {
        conversationId,
        lastMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get namespace instance
   */
  public getNamespace(): Namespace {
    return this.namespace;
  }

  /**
   * Check if a user is connected
   */
  public async isUserConnected(userId: string): Promise<boolean> {
    const userRoom = `user:${userId}`;
    const sockets = await this.namespace.in(userRoom).fetchSockets();
    return sockets.length > 0;
  }
}

// Singleton instance
let messagingSocketServer: MessagingSocketServer | null = null;

/**
 * Initialize Messaging WebSocket server
 */
export function initializeMessagingSocket(io: SocketIOServer): MessagingSocketServer {
  if (!messagingSocketServer) {
    messagingSocketServer = new MessagingSocketServer(io);
  }
  return messagingSocketServer;
}

/**
 * Get Messaging WebSocket server instance
 */
export function getMessagingSocket(): MessagingSocketServer | null {
  return messagingSocketServer;
}
