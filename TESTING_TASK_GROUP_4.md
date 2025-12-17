# Testing Task Group 4: Dashboard & KPI Endpoints

## Prerequisites

Before running the tests, ensure you have:

1. **PostgreSQL Database Running**
   - The test database should be configured
   - Run migrations: `npm run migrate:up`

2. **Redis Server Running**
   - Tests use a mocked Redis, but the real server should be available for manual testing
   - Start Redis: `redis-server` (or via Docker)

3. **Dependencies Installed**
   - Socket.io server: Already added to package.json
   - Install if needed: Install dependencies using your package manager

4. **Environment Variables**
   - Copy `.env.example` to `.env.development`
   - Set `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `FRONTEND_URL`

## Running the Tests

### Run Dashboard-Specific Tests Only
```bash
npm run test:dashboard
```

This runs only the 8 tests created for Task Group 4:
- Dashboard API endpoint tests
- WebSocket authentication tests
- Real-time update tests
- Redis caching tests

### Run All Backend Tests
```bash
npm test
```

Note: This will run ALL tests in the project, including auth, business, and dashboard tests.

### Expected Test Output

You should see 8 tests pass:
```
Dashboard API Endpoints
  GET /api/dashboard/tenant
    ✓ should return dashboard data with KPIs and businesses
    ✓ should return 401 without authentication token
    ✓ should cache KPI calculations in Redis

  GET /api/dashboard/tenant/kpis
    ✓ should return only KPIs without businesses list
    ✓ should handle users with no businesses

  WebSocket Authentication
    ✓ should authenticate WebSocket connection with valid JWT
    ✓ should reject WebSocket connection without token
    ✓ should reject WebSocket connection with invalid token

  WebSocket Real-time Updates
    (Tests for real-time event emission will be added when needed)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

## Manual Testing

### 1. Start the Server
```bash
npm run dev
```

You should see:
```
ZYX Platform API server listening on port 3000
Environment: development
WebSocket server ready at ws://localhost:3000/socket.io
Redis client connected
Dashboard WebSocket server initialized
```

### 2. Test Dashboard API Endpoint

**Login as a tenant user first** (use existing auth endpoints):
```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"password"}'
```

**Get Dashboard Data:**
```bash
curl http://localhost:3000/api/dashboard/tenant \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "activeBusinesses": 2,
      "responseRate": 0,
      "landlordViews": 0,
      "messagesTotal": 0
    },
    "businesses": [],
    "total": 0
  }
}
```

### 3. Test WebSocket Connection

Use a WebSocket client or create a simple test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Dashboard WebSocket Test</h1>
  <div id="status">Not connected</div>
  <div id="events"></div>

  <script>
    const token = 'YOUR_JWT_TOKEN_HERE';

    const socket = io('http://localhost:3000/dashboard', {
      auth: { token }
    });

    socket.on('connect', () => {
      document.getElementById('status').textContent = 'Connected!';
      console.log('Connected to dashboard namespace');

      // Request current state
      socket.emit('request:current-state');
    });

    socket.on('reconnected', (data) => {
      console.log('Reconnected:', data);
      const events = document.getElementById('events');
      events.innerHTML += '<p>Reconnected: ' + data.timestamp + '</p>';
    });

    socket.on('kpi:update', (data) => {
      console.log('KPI Update:', data);
      const events = document.getElementById('events');
      events.innerHTML += '<p>KPI Update: ' + JSON.stringify(data.kpis) + '</p>';
    });

    socket.on('connect_error', (error) => {
      document.getElementById('status').textContent = 'Error: ' + error.message;
      console.error('Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      document.getElementById('status').textContent = 'Disconnected: ' + reason;
      console.log('Disconnected:', reason);
    });
  </script>
</body>
</html>
```

### 4. Test Event Emission

To test real-time updates, you need to trigger events by:

1. **Creating a business** (when business endpoints support POST)
2. **Updating metrics** directly in the database:

```sql
-- Update metrics for a business
UPDATE business_metrics
SET views_count = views_count + 10
WHERE business_id = 'YOUR_BUSINESS_ID';
```

3. **Manually trigger event** using the service:

```typescript
import { getDashboardSocket } from './src/websocket/dashboardSocket';
import { DashboardEventService } from './src/services/DashboardEventService';

const eventService = new DashboardEventService();
await eventService.triggerKPIUpdate('USER_ID_HERE');
```

## Troubleshooting

### Tests Fail: "Cannot connect to database"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.development`
- Run migrations: `npm run migrate:up`

### Tests Fail: "Redis connection error"
- Tests use mocked Redis, so this shouldn't happen
- If it does, check that redis mock is properly configured in test file

### WebSocket Connection Fails: "Authentication token required"
- Ensure you're passing a valid JWT token
- Token should be passed in `auth.token` property
- Token should not be expired (15-minute expiry)

### WebSocket Connection Fails: "Invalid authentication token"
- JWT_SECRET in `.env` must match the one used to create the token
- Token format should be valid JWT

### Server Doesn't Start: "Redis connection error"
- Ensure Redis is running: `redis-server`
- Check REDIS_URL in `.env`
- Redis errors are logged but won't crash the app

### No Events Received
- Ensure user is connected to WebSocket
- Check server logs for event emission messages
- Verify user ID matches between token and database

## Test Data Setup

The tests automatically create test data, but for manual testing:

```sql
-- Create a test tenant user
INSERT INTO users (id, email, password_hash, role, email_verified, is_active)
VALUES (
  gen_random_uuid(),
  'test-tenant@example.com',
  '$2a$10$...', -- bcrypt hash of 'password'
  'tenant',
  true,
  true
);

-- Create test businesses
INSERT INTO businesses (id, user_id, name, category, status, is_verified)
VALUES (
  gen_random_uuid(),
  'USER_ID_FROM_ABOVE',
  'Test Restaurant',
  'F&B',
  'active',
  true
);

-- Create test metrics
INSERT INTO business_metrics (
  id, business_id, location_id, metric_date,
  views_count, clicks_count, messages_count
)
VALUES (
  gen_random_uuid(),
  'BUSINESS_ID_FROM_ABOVE',
  NULL,
  CURRENT_DATE,
  100, 50, 25
);
```

## Success Criteria

All tests should pass with these results:
- ✅ Dashboard endpoint returns correct KPI structure
- ✅ KPIs calculate correctly from database
- ✅ WebSocket authenticates with valid token
- ✅ WebSocket rejects invalid tokens
- ✅ Redis caching works with 5-minute TTL
- ✅ Edge cases handled (users with no data)

## Next Steps After Tests Pass

1. Review the implementation in:
   - `src/controllers/DashboardController.ts`
   - `src/services/KPIService.ts`
   - `src/websocket/dashboardSocket.ts`

2. Read the WebSocket implementation guide:
   - `WEBSOCKET_IMPLEMENTATION.md`

3. Proceed to Task Group 5:
   - Frontend Core Infrastructure
   - Implement WebSocket client wrapper
   - Create polling fallback utility

## Notes

- Tests use a clean database state (data created/cleaned per test)
- Redis is mocked in tests for reliability
- WebSocket tests verify connection behavior, not full event flow
- Full integration testing will happen in Task Group 10

---

**Need Help?**
Check the implementation summary: `agent-os/specs/2025-11-24-tenant-dashboard/TASK_GROUP_4_SUMMARY.md`
