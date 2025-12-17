import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './app';
import { initializeDashboardSocket } from './websocket/dashboardSocket';
import { initializeMessagingSocket } from './websocket/messagingSocket';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('Starting ZYX Platform API server...');

    // Create Express app
    const app = createApp();
    console.log('Express app created');

    // Create HTTP server
    const server = http.createServer(app);
    console.log('HTTP server created');

    // Initialize WebSocket servers
    try {
      // Initialize dashboard socket first (creates the Socket.IO instance)
      const dashboardSocket = initializeDashboardSocket(server);
      console.log('Dashboard WebSocket server initialized');

      // Initialize messaging socket (reuses the same Socket.IO instance)
      const io = dashboardSocket.getIO();
      initializeMessagingSocket(io);
      console.log('Messaging WebSocket server initialized');
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      // Continue without WebSocket if it fails
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`\n✅ ZYX Platform API server listening on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   WebSocket: ws://localhost:${PORT}/socket.io`);
      console.log(`     - Dashboard namespace: /dashboard`);
      console.log(`     - Messaging namespace: /messaging`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Export server for testing
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
const server = startServer();

// Export server for testing
export default server;
