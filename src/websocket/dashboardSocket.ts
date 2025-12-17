import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DashboardKPIs, Business } from '../types';

/**
 * Interface for decoded JWT token
 */
interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

/**
 * Interface for WebSocket authentication data
 */
interface SocketData {
  userId: string;
  email: string;
  role: string;
}

/**
 * Dashboard WebSocket server
 * Handles real-time updates for dashboard KPIs and business changes
 */
export class DashboardSocketServer {
  private io: SocketIOServer;
  private namespace: any;

  constructor(server: HttpServer) {
    // Initialize Socket.io server
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
    });

    // Create /dashboard namespace
    this.namespace = this.io.of('/dashboard');

    // Set up authentication middleware
    this.namespace.use(this.authenticateSocket.bind(this));

    // Set up connection handler
    this.namespace.on('connection', this.handleConnection.bind(this));

    console.log('Dashboard WebSocket server initialized');
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
      // Fall back to auth.token or query.token for backward compatibility
      const cookies = socket.handshake.headers.cookie;
      let token: string | undefined;

      if (cookies) {
        // Parse cookies manually to extract accessToken
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
      console.error('WebSocket authentication error:', error.message);
      next(new Error('Invalid authentication token'));
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    const socketData = socket.data as SocketData;
    const userId = socketData.userId;

    console.log(`Dashboard WebSocket connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    console.log(`Socket ${socket.id} joined room: ${userRoom}`);

    // Handle reconnection - send current state
    socket.on('request:current-state', async () => {
      console.log(`Current state requested by socket ${socket.id}`);
      // Client can request full KPI state after reconnection
      // This will be handled by the client making an HTTP request
      socket.emit('reconnected', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(
        `Dashboard WebSocket disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`
      );
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`WebSocket error for socket ${socket.id}:`, error);
    });
  }

  /**
   * Emit KPI update event to a specific user
   */
  public emitKPIUpdate(userId: string, kpis: DashboardKPIs): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('kpi:update', {
      kpis,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted kpi:update to room ${userRoom}`);
  }

  /**
   * Emit business created event to a specific user
   */
  public emitBusinessCreated(userId: string, business: Business): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('business:created', {
      business,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted business:created to room ${userRoom}`);
  }

  /**
   * Emit business updated event to a specific user
   */
  public emitBusinessUpdated(userId: string, business: Business): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('business:updated', {
      business,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted business:updated to room ${userRoom}`);
  }

  /**
   * Emit business deleted event to a specific user
   */
  public emitBusinessDeleted(userId: string, businessId: string): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('business:deleted', {
      businessId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted business:deleted to room ${userRoom}`);
  }

  /**
   * Emit metrics updated event to a specific user
   */
  public emitMetricsUpdated(userId: string, businessId: string): void {
    const userRoom = `user:${userId}`;
    this.namespace.to(userRoom).emit('metrics:updated', {
      businessId,
      timestamp: new Date().toISOString(),
    });
    console.log(`Emitted metrics:updated to room ${userRoom}`);
  }

  /**
   * Get Socket.io server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get namespace instance
   */
  public getNamespace(): any {
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

  /**
   * Get number of connected clients for a user
   */
  public async getUserConnectionCount(userId: string): Promise<number> {
    const userRoom = `user:${userId}`;
    const sockets = await this.namespace.in(userRoom).fetchSockets();
    return sockets.length;
  }
}

// Singleton instance
let dashboardSocketServer: DashboardSocketServer | null = null;

/**
 * Initialize Dashboard WebSocket server
 */
export function initializeDashboardSocket(
  server: HttpServer
): DashboardSocketServer {
  if (!dashboardSocketServer) {
    dashboardSocketServer = new DashboardSocketServer(server);
  }
  return dashboardSocketServer;
}

/**
 * Get Dashboard WebSocket server instance
 */
export function getDashboardSocket(): DashboardSocketServer | null {
  return dashboardSocketServer;
}
