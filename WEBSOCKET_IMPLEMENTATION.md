# WebSocket Implementation Guide

## Overview

The TenantList platform implements real-time dashboard updates using Socket.io with a polling fallback mechanism for reliability.

## Architecture

### Server-Side Components

1. **DashboardSocketServer** (`src/websocket/dashboardSocket.ts`)
   - Socket.io server with `/dashboard` namespace
   - JWT-based authentication
   - User-specific rooms: `user:${userId}`
   - Event emitters for KPI and business updates

2. **DashboardEventService** (`src/services/DashboardEventService.ts`)
   - Triggers WebSocket events when data changes
   - Handles KPI invalidation and recalculation
   - Emits events only to connected users

3. **KPIService** (`src/services/KPIService.ts`)
   - Calculates dashboard KPIs
   - Redis caching with 5-minute TTL
   - Cache invalidation on data changes

## WebSocket Events

### Client → Server Events

- `request:current-state`: Request full dashboard state after reconnection

### Server → Client Events

- `kpi:update`: KPI data has been updated
- `business:created`: New business created
- `business:updated`: Business data updated
- `business:deleted`: Business deleted
- `metrics:updated`: Business metrics updated
- `reconnected`: Confirms successful reconnection

## Event Payloads

### kpi:update
```json
{
  "kpis": {
    "activeBusinesses": 5,
    "responseRate": 75.5,
    "landlordViews": 1234,
    "messagesTotal": 89
  },
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

### business:created / business:updated
```json
{
  "business": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Business Name",
    "category": "F&B",
    "status": "active",
    "is_verified": true
  },
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

### business:deleted
```json
{
  "businessId": "uuid",
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

## Client Implementation Strategy

### 1. WebSocket Connection

```typescript
import io from 'socket.io-client';

// Connect to dashboard namespace with JWT
const socket = io('http://localhost:3000/dashboard', {
  auth: {
    token: accessToken
  },
  transports: ['websocket', 'polling']
});

// Handle connection
socket.on('connect', () => {
  console.log('WebSocket connected');
  // Request current state after reconnection
  socket.emit('request:current-state');
});
```

### 2. Event Listeners

```typescript
// Listen for KPI updates
socket.on('kpi:update', (data) => {
  updateDashboardKPIs(data.kpis);
});

// Listen for business changes
socket.on('business:created', (data) => {
  addBusinessToList(data.business);
});

socket.on('business:updated', (data) => {
  updateBusinessInList(data.business);
});

socket.on('business:deleted', (data) => {
  removeBusinessFromList(data.businessId);
});

// Handle reconnection
socket.on('reconnected', () => {
  // Fetch full dashboard state via HTTP
  fetchDashboardData();
});
```

### 3. Reconnection Logic (Built-in Socket.io)

Socket.io automatically handles reconnection with exponential backoff:
- 1st retry: immediate
- 2nd retry: 1 second
- 3rd retry: 2 seconds
- 4th retry: 4 seconds
- 5th retry: 8 seconds
- Max: 30 seconds

No additional code needed - built into Socket.io client.

### 4. Polling Fallback Mechanism

Implement polling fallback if WebSocket fails after 3 reconnection attempts:

```typescript
let reconnectionAttempts = 0;
let pollingInterval: NodeJS.Timeout | null = null;

socket.on('connect_error', (error) => {
  reconnectionAttempts++;
  console.error('WebSocket connection error:', error);

  // After 3 failed attempts, start polling
  if (reconnectionAttempts >= 3 && !pollingInterval) {
    console.log('Starting polling fallback');
    startPolling();
  }
});

socket.on('connect', () => {
  reconnectionAttempts = 0;

  // Stop polling if WebSocket reconnects
  if (pollingInterval) {
    console.log('WebSocket reconnected, stopping polling');
    stopPolling();
  }
});

function startPolling() {
  // Poll every 30 seconds
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/dashboard/tenant/kpis', {
        credentials: 'include'
      });
      const data = await response.json();
      updateDashboardKPIs(data.data);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 30000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Clean up on component unmount
function cleanup() {
  stopPolling();
  socket.disconnect();
}
```

## Server-Side Reconnection Handling

The server gracefully handles client reconnections:

1. **Authentication**: Every connection is authenticated via JWT
2. **Room Rejoining**: User automatically rejoins their user-specific room
3. **State Sync**: Client requests current state via `request:current-state` event
4. **Event Buffering**: No server-side buffering - client fetches fresh data on reconnect

## Security

### JWT Authentication
- Every WebSocket connection requires valid JWT token
- Token verified on connection
- User data attached to socket for authorization

### User-Specific Rooms
- Each user has isolated room: `user:${userId}`
- Events only emitted to authorized user's room
- No cross-user data leakage

### CORS Configuration
- Configured to allow frontend origin only
- Credentials enabled for cookie-based auth

## Performance Considerations

### Redis Caching
- KPI calculations cached for 5 minutes
- Cache invalidated on data changes
- Reduces database load for real-time updates

### Connected User Check
- Events only emitted to connected users
- Reduces unnecessary calculations
- Checks connection before emitting

### Namespace Isolation
- `/dashboard` namespace separate from other features
- Independent scaling and management

## Testing

### Unit Tests
```bash
npm run test:dashboard
```

Tests cover:
- Dashboard API endpoint with KPI calculations
- WebSocket authentication (valid/invalid tokens)
- WebSocket event emission
- Redis caching behavior
- Reconnection handling

### Manual Testing

1. **Connect and Receive Updates**:
   - Login as tenant user
   - Open dashboard
   - Update business metrics in database
   - Verify KPI update received

2. **Reconnection Test**:
   - Disconnect network
   - Wait 10 seconds
   - Reconnect network
   - Verify dashboard refreshes

3. **Polling Fallback**:
   - Disable WebSocket (block port)
   - Verify polling starts after 3 attempts
   - Unblock WebSocket
   - Verify switch back to WebSocket

## Troubleshooting

### WebSocket Not Connecting

1. Check JWT token is valid
2. Verify FRONTEND_URL environment variable
3. Check server logs for authentication errors
4. Verify firewall/proxy allows WebSocket connections

### Events Not Received

1. Check user is authenticated
2. Verify user room membership: `user:${userId}`
3. Check DashboardEventService is triggering events
4. Verify data changes are calling event methods

### Polling Not Starting

1. Verify 3+ connection errors occurred
2. Check browser console for polling logs
3. Verify `/api/dashboard/tenant/kpis` endpoint accessible

## Future Enhancements

1. **Message Queuing**: Add Redis pub/sub for multi-server deployments
2. **Event Buffering**: Buffer events for offline users
3. **Compression**: Enable Socket.io message compression
4. **Binary Protocol**: Use msgpack for smaller payloads
5. **Presence**: Track user online/offline status
6. **Metrics**: Add WebSocket connection metrics

## References

- Socket.io Documentation: https://socket.io/docs/v4/
- Redis Documentation: https://redis.io/docs/
- JWT Authentication: https://jwt.io/
