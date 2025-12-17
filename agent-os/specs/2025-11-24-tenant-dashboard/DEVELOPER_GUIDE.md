# Developer Guide
## Tenant Dashboard Feature

**Version:** 1.0.0
**Last Updated:** 2025-11-24
**Maintainer:** Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Key Components](#key-components)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Custom Hooks](#custom-hooks)
8. [Database Schema](#database-schema)
9. [State Management](#state-management)
10. [Testing](#testing)
11. [Common Tasks](#common-tasks)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Tenant Dashboard is the primary interface for tenant users after authentication. It provides:

- **Real-time KPI monitoring** (Active Businesses, Response Rate, Landlord Views, Messages Total)
- **Business listings management** with search and filter capabilities
- **Infinite scroll pagination** for large datasets
- **WebSocket-based real-time updates** with polling fallback
- **Role-based access control** (tenant users only)

### Technology Stack

- **Frontend:** React 18, TypeScript, Vite, CSS Modules
- **Backend:** Node.js, Express, PostgreSQL, Redis
- **Real-time:** Socket.io
- **Authentication:** JWT (httpOnly cookies)
- **Testing:** Jest, React Testing Library, Supertest

---

## Architecture

### High-Level Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS (REST API)
       ├──────────────────────┐
       │                      │
       │ WebSocket (Socket.io)│
       ├──────────────────────┤
       │                      │
┌──────▼──────┐      ┌────────▼────────┐
│   Express   │      │  Socket.io      │
│   Server    │      │  Server         │
└──────┬──────┘      └────────┬────────┘
       │                      │
       ├──────────────────────┤
       │                      │
┌──────▼──────┐      ┌────────▼────────┐
│ PostgreSQL  │      │     Redis       │
│  Database   │      │     Cache       │
└─────────────┘      └─────────────────┘
```

### Data Flow

1. **Initial Load:**
   - User navigates to `/dashboard`
   - ProtectedRoute checks authentication
   - Dashboard component fetches data from `/api/dashboard/tenant`
   - WebSocket connection established for real-time updates

2. **Real-time Updates:**
   - Metrics change in database
   - Server emits `kpi:update` event via WebSocket
   - Frontend updates KPIs without page refresh
   - Fallback to polling if WebSocket fails

3. **Pagination:**
   - User scrolls to bottom
   - Intersection Observer detects threshold
   - Fetches next page from `/api/businesses?page=N`
   - Appends new businesses to list

---

## Project Structure

```
src/
├── frontend/
│   ├── components/
│   │   ├── TopNavigation.tsx        # Main navigation bar
│   │   ├── Logo.tsx                 # Brand logo component
│   │   ├── NavigationTabs.tsx       # Dashboard/Trends/Applications tabs
│   │   ├── TierBadge.tsx           # Subscription tier badge
│   │   ├── AddBusinessButton.tsx    # Primary CTA button
│   │   ├── ProfileDropdown.tsx      # User profile menu
│   │   ├── DashboardHeader.tsx      # Dashboard page header
│   │   ├── PerformanceKPIs.tsx      # KPI cards container
│   │   ├── KPICard.tsx             # Individual KPI card
│   │   ├── BusinessListingsSection.tsx  # Business list container
│   │   ├── BusinessCard.tsx         # Individual business card
│   │   ├── StatusBadge.tsx         # Business status indicator
│   │   ├── CategoryBadge.tsx       # Business category label
│   │   ├── SearchInput.tsx         # Search with debounce
│   │   ├── FilterDropdown.tsx      # Status filter dropdown
│   │   ├── EmptyState.tsx          # Empty list placeholder
│   │   ├── WarningBanner.tsx       # Alert/warning messages
│   │   ├── LoadingSpinner.tsx      # Loading indicator
│   │   ├── ProtectedRoute.tsx      # Route guard component
│   │   ├── PlaceholderPage.tsx     # Reusable placeholder
│   │   ├── ErrorBoundary.tsx       # React error boundary
│   │   └── *.module.css            # Component styles
│   ├── pages/
│   │   ├── Dashboard.tsx           # Main dashboard page
│   │   ├── Trends.tsx              # Trends placeholder
│   │   ├── Applications.tsx        # Applications placeholder
│   │   ├── BusinessDetail.tsx      # Business detail placeholder
│   │   ├── Settings.tsx            # Settings placeholder
│   │   └── Profile.tsx             # Profile placeholder
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state
│   ├── hooks/
│   │   ├── useBusinessFilter.ts    # Search/filter logic
│   │   ├── useInfiniteScroll.ts    # Infinite scroll logic
│   │   ├── useDashboardWebSocket.ts # WebSocket management
│   │   └── useOnlineStatus.ts      # Network status detection
│   ├── utils/
│   │   ├── apiClient.ts            # Axios instance with interceptors
│   │   ├── websocketClient.ts      # Socket.io client wrapper
│   │   ├── pollingService.ts       # Fallback polling service
│   │   ├── debounce.ts             # Debounce utility
│   │   └── errorLogger.ts          # Error logging utility
│   ├── App.tsx                     # Root component with routing
│   └── main.tsx                    # Entry point
├── routes/
│   └── businessRoutes.ts           # Business API routes
├── controllers/
│   ├── BusinessController.ts       # Business CRUD operations
│   └── DashboardController.ts      # Dashboard KPI calculations
├── services/
│   ├── KPIService.ts               # KPI calculation logic
│   └── DashboardEventService.ts    # WebSocket event emission
├── websocket/
│   └── dashboardSocket.ts          # Socket.io server setup
├── database/
│   ├── models/
│   │   ├── Business.ts             # Business model
│   │   ├── BusinessLocation.ts     # Location model
│   │   └── BusinessMetrics.ts      # Metrics model
│   └── migrations/
│       ├── YYYYMMDDHHMMSS_create_businesses_table.ts
│       ├── YYYYMMDDHHMMSS_create_business_locations_table.ts
│       └── YYYYMMDDHHMMSS_create_business_metrics_table.ts
├── middleware/
│   ├── authMiddleware.ts           # JWT validation
│   ├── roleGuard.ts                # Role-based access control
│   └── errorHandler.ts             # Global error handler
├── types/
│   └── index.ts                    # TypeScript type definitions
└── __tests__/
    ├── database/
    │   └── businessModels.test.ts  # Model tests
    ├── api/
    │   ├── businessEndpoints.test.ts     # Business API tests
    │   └── dashboardEndpoints.test.ts    # Dashboard API tests
    ├── e2e/
    │   └── tenantDashboard.e2e.test.ts   # E2E tests
    └── frontend/
        ├── CoreInfrastructure.test.tsx   # Auth, routing tests
        ├── SharedComponents.test.tsx     # UI component tests
        ├── TopNavigation.test.tsx        # Navigation tests
        ├── Dashboard.test.tsx            # Dashboard page tests
        └── PlaceholderPages.test.tsx     # Placeholder tests
```

---

## Key Components

### Dashboard Page

**File:** `/src/frontend/pages/Dashboard.tsx`

Main container component that orchestrates the dashboard functionality.

```typescript
export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    loadDashboardData();

    // Connect WebSocket
    websocketClient.connectToDashboard();
    const unsubscribe = websocketClient.onKPIUpdate(setKpis);

    return () => {
      unsubscribe();
      websocketClient.disconnect();
    };
  }, []);

  return (
    <div>
      <TopNavigation />
      <DashboardHeader />
      <PerformanceKPIs kpis={kpis} loading={loading} />
      <BusinessListingsSection businesses={businesses} />
    </div>
  );
}
```

**Props:** None
**State:** KPIs, businesses, loading, error
**Side Effects:** API calls, WebSocket connection

### KPICard Component

**File:** `/src/frontend/components/KPICard.tsx`

Displays a single KPI metric with formatted value.

```typescript
interface KPICardProps {
  title: string;          // e.g., "Active Businesses"
  value: number;          // e.g., 25
  format: 'number' | 'percentage';  // Display format
  loading?: boolean;      // Show loading state
}

export const KPICard = memo<KPICardProps>(({ title, value, format, loading }) => {
  const formattedValue = format === 'percentage'
    ? `${value}%`
    : value.toLocaleString();

  return (
    <div className={styles.kpiCard}>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{formattedValue}</div>
    </div>
  );
});
```

**Props:**
- `title` (string): KPI label
- `value` (number): Numeric value
- `format` ('number' | 'percentage'): Display format
- `loading` (boolean, optional): Show loading spinner

**Memoization:** Uses React.memo with custom comparison for performance

### BusinessCard Component

**File:** `/src/frontend/components/BusinessCard.tsx`

Displays business information with action buttons.

```typescript
interface BusinessCardProps {
  business: Business;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddLocations: (id: string) => void;
  onVerify: (id: string) => void;
}

export const BusinessCard = memo<BusinessCardProps>(({ business, onEdit, onDelete, onAddLocations, onVerify }) => {
  return (
    <div className={styles.businessCard}>
      <div className={styles.header}>
        <h3>{business.name}</h3>
        <CategoryBadge category={business.category} />
        <StatusBadge status={business.status} />
      </div>
      {!business.is_verified && (
        <WarningBanner
          message="Business visibility is restricted until verification is complete"
          variant="warning"
        />
      )}
      <div className={styles.actions}>
        <button onClick={() => onEdit(business.id)}>Edit</button>
        <button onClick={() => onDelete(business.id)}>Delete Business</button>
        <button onClick={() => onAddLocations(business.id)}>Add Locations</button>
        <button onClick={() => onVerify(business.id)}>Verify Business</button>
      </div>
    </div>
  );
});
```

**Props:**
- `business` (Business): Business object
- `onEdit` (function): Edit button handler
- `onDelete` (function): Delete button handler
- `onAddLocations` (function): Add locations handler
- `onVerify` (function): Verify business handler

---

## API Endpoints

### GET /api/dashboard/tenant

**Description:** Get dashboard data including KPIs and businesses

**Authentication:** Required (JWT in cookie)

**Authorization:** Role: `tenant`

**Query Parameters:**
- None

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "activeBusinesses": 25,
      "responseRate": 78.5,
      "landlordViews": 1250,
      "messagesTotal": 42
    },
    "businesses": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "Test Restaurant",
        "category": "F&B",
        "status": "active",
        "is_verified": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Errors:**
- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Not a tenant user
- `500 SERVER_ERROR`: Internal error

### GET /api/businesses

**Description:** Get paginated list of businesses

**Authentication:** Required

**Authorization:** Role: `tenant`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `search` (string, optional): Search query (name)
- `status` (string, optional): Filter by status (`active`, `pending_verification`, `stealth_mode`)

**Response:**
```json
{
  "success": true,
  "data": {
    "businesses": [...],
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### GET /api/businesses/:id

**Description:** Get single business with details

**Authentication:** Required

**Authorization:** Must own the business

**Path Parameters:**
- `id` (string): Business UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "business": {...},
    "locations": [...],
    "metrics": {
      "total_views": 1000,
      "total_clicks": 500,
      "total_messages": 50
    }
  }
}
```

### GET /api/businesses/:id/locations

**Description:** Get locations for a business

**Authentication:** Required

**Authorization:** Must own the business

**Response:**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "uuid",
        "business_id": "uuid",
        "city": "Miami",
        "state": "FL",
        "address": "123 Main St",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/businesses/:id/locations/:locationId/metrics

**Description:** Get metrics for a specific location

**Authentication:** Required

**Authorization:** Must own the business

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "uuid",
        "business_id": "uuid",
        "location_id": "uuid",
        "metric_date": "2024-01-01",
        "views_count": 100,
        "clicks_count": 50,
        "property_invites_count": 10,
        "declined_count": 2,
        "messages_count": 8,
        "qfps_submitted_count": 3
      }
    ]
  }
}
```

---

## WebSocket Events

### Namespace: `/dashboard`

**Authentication:** JWT token passed in `auth.token` during connection

### Client → Server Events

#### `request:current-state`
Request current KPI state (useful for reconnection)

**Payload:** None

**Response:** Server emits `reconnected` event

### Server → Client Events

#### `kpi:update`
Emitted when KPIs change

**Payload:**
```typescript
{
  activeBusinesses: number;
  responseRate: number;
  landlordViews: number;
  messagesTotal: number;
}
```

**Example:**
```typescript
socket.on('kpi:update', (data) => {
  console.log('KPIs updated:', data);
  setKpis(data);
});
```

#### `business:created`
Emitted when a new business is created

**Payload:**
```typescript
{
  business: Business;
}
```

#### `business:updated`
Emitted when a business is updated

**Payload:**
```typescript
{
  business: Business;
}
```

#### `business:deleted`
Emitted when a business is deleted

**Payload:**
```typescript
{
  businessId: string;
}
```

#### `reconnected`
Emitted when client reconnects successfully

**Payload:**
```typescript
{
  timestamp: string;
}
```

---

## Custom Hooks

### useBusinessFilter

**File:** `/src/frontend/hooks/useBusinessFilter.ts`

**Purpose:** Client-side filtering of businesses with debounced search

**Usage:**
```typescript
const {
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredBusinesses,
  clearFilters,
} = useBusinessFilter(businesses);
```

**Parameters:**
- `businesses` (Business[]): Array of businesses to filter

**Returns:**
- `searchQuery` (string): Current search query
- `setSearchQuery` (function): Update search query
- `statusFilter` (string): Current status filter
- `setStatusFilter` (function): Update status filter
- `filteredBusinesses` (Business[]): Filtered results
- `clearFilters` (function): Reset all filters

**Features:**
- Debounced search (300ms)
- Case-insensitive name matching
- Status filtering
- Memoized results

### useInfiniteScroll

**File:** `/src/frontend/hooks/useInfiniteScroll.ts`

**Purpose:** Detect when user scrolls near bottom to trigger pagination

**Usage:**
```typescript
const sentinelRef = useInfiniteScroll(
  fetchMoreBusinesses,
  hasMore,
  loading
);

// In JSX
<div ref={sentinelRef} />
```

**Parameters:**
- `fetchMore` (function): Callback to fetch next page
- `hasMore` (boolean): Whether more data exists
- `loading` (boolean): Whether currently loading

**Returns:**
- `sentinelRef` (React.RefObject): Ref to attach to sentinel element

**Features:**
- Uses Intersection Observer API
- 200px trigger threshold
- Automatic cleanup
- Performance optimized

### useDashboardWebSocket

**File:** `/src/frontend/hooks/useDashboardWebSocket.ts`

**Purpose:** Manage WebSocket connection and event handlers

**Usage:**
```typescript
const { kpis, connectionStatus } = useDashboardWebSocket(userId);
```

**Parameters:**
- `userId` (string): Current user ID

**Returns:**
- `kpis` (DashboardKPIs | null): Real-time KPIs
- `connectionStatus` ('connected' | 'connecting' | 'disconnected' | 'error'): Connection state

**Features:**
- Automatic reconnection
- Exponential backoff
- Fallback to polling
- Throttled updates

---

## Database Schema

### businesses table

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'pending_verification', 'stealth_mode')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_created_at ON businesses(created_at DESC);
```

### business_locations table

```sql
CREATE TABLE business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_business_locations_business_id ON business_locations(business_id);
```

### business_metrics table

```sql
CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  property_invites_count INTEGER DEFAULT 0,
  declined_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  qfps_submitted_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, location_id, metric_date)
);

CREATE INDEX idx_business_metrics_business_id ON business_metrics(business_id);
CREATE INDEX idx_business_metrics_metric_date ON business_metrics(metric_date DESC);
```

---

## State Management

The dashboard uses React Context for global state and local useState for component-specific state.

### AuthContext

**File:** `/src/frontend/contexts/AuthContext.tsx`

**Purpose:** Manage authentication state across the app

**Provided Values:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User | null) => void;
}
```

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.email}</div>;
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Dashboard.test.tsx

# Run E2E tests
npm test tenantDashboard.e2e.test.ts
```

### Test Organization

- **Unit Tests:** Individual component/function tests
- **Integration Tests:** API endpoint tests
- **E2E Tests:** Full user workflow tests

### Example Test

```typescript
// Component test
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/KPICard';

test('renders KPI card with number format', () => {
  render(
    <KPICard
      title="Active Businesses"
      value={25}
      format="number"
    />
  );

  expect(screen.getByText('Active Businesses')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
});
```

---

## Common Tasks

### Adding a New KPI

1. **Update TypeScript types** (`src/types/index.ts`):
```typescript
export interface DashboardKPIs {
  activeBusinesses: number;
  responseRate: number;
  landlordViews: number;
  messagesTotal: number;
  newKPI: number;  // Add new KPI
}
```

2. **Update KPI calculation** (`src/services/KPIService.ts`):
```typescript
async calculateDashboardKPIs(userId: string): Promise<DashboardKPIs> {
  // ... existing calculations

  const newKPI = await this.calculateNewKPI(userId);

  return {
    activeBusinesses,
    responseRate,
    landlordViews,
    messagesTotal,
    newKPI,
  };
}
```

3. **Update frontend** (`src/frontend/components/PerformanceKPIs.tsx`):
```typescript
<KPICard
  title="New KPI"
  value={kpis.newKPI}
  format="number"
/>
```

4. **Add tests** for new KPI calculation and display

### Adding a New Filter

1. **Update filter options** (`src/frontend/hooks/useBusinessFilter.ts`):
```typescript
export const useBusinessFilter = (businesses: Business[]) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(business => {
      // ... existing filters

      if (categoryFilter !== 'all' && business.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [businesses, searchQuery, statusFilter, categoryFilter]);

  return {
    // ... existing returns
    categoryFilter,
    setCategoryFilter,
  };
};
```

2. **Add FilterDropdown** to UI:
```typescript
<FilterDropdown
  options={categoryOptions}
  value={categoryFilter}
  onChange={setCategoryFilter}
  label="Category Filter"
/>
```

### Modifying WebSocket Events

1. **Server-side** (`src/websocket/dashboardSocket.ts`):
```typescript
export const emitNewEvent = (userId: string, data: any) => {
  io.of('/dashboard').to(`user:${userId}`).emit('new:event', data);
};
```

2. **Client-side** (`src/frontend/utils/websocketClient.ts`):
```typescript
onNewEvent(callback: (data: any) => void): () => void {
  this.socket?.on('new:event', callback);
  return () => this.socket?.off('new:event', callback);
}
```

3. **Use in component**:
```typescript
const unsubscribe = websocketClient.onNewEvent((data) => {
  console.log('New event:', data);
});
```

---

## Troubleshooting

### WebSocket Not Connecting

**Symptoms:** KPIs don't update in real-time

**Solutions:**
1. Check WebSocket URL in `.env`: `VITE_WS_BASE_URL`
2. Verify JWT token is valid
3. Check browser console for connection errors
4. Ensure Socket.io server is running
5. Check CORS settings on server

**Debug:**
```javascript
// In browser console
websocketClient.socket?.connected  // Should be true
```

### Infinite Scroll Not Working

**Symptoms:** More businesses don't load when scrolling

**Solutions:**
1. Check `hasMore` flag in state
2. Verify sentinel element is rendered
3. Check if `loading` state is stuck as `true`
4. Verify API returns correct pagination data

**Debug:**
```javascript
// Check sentinel element
document.querySelector('[data-sentinel]')

// Check Intersection Observer
console.log(observerRef.current)
```

### Performance Issues

**Symptoms:** Dashboard is slow or laggy

**Solutions:**
1. Check React DevTools Profiler for slow components
2. Ensure `React.memo` is applied to `KPICard` and `BusinessCard`
3. Verify debouncing is working on search input
4. Check for memory leaks (Event listeners not cleaned up)
5. Reduce WebSocket event frequency (throttling)

**Debug:**
```javascript
// In browser console
performance.memory  // Check memory usage
```

### Authentication Errors

**Symptoms:** 401 errors on API calls

**Solutions:**
1. Check if JWT token is expired
2. Verify `accessToken` cookie is present
3. Test token refresh mechanism
4. Check AuthContext state

**Debug:**
```javascript
// Check cookies
document.cookie

// Check auth state
JSON.parse(localStorage.getItem('auth'))
```

### Database Query Slow

**Symptoms:** API responses take >1 second

**Solutions:**
1. Verify database indexes are created
2. Check Redis cache is working
3. Run `EXPLAIN ANALYZE` on slow queries
4. Reduce pagination limit if needed

**Debug SQL:**
```sql
EXPLAIN ANALYZE
SELECT * FROM businesses
WHERE user_id = 'uuid'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Useful Commands

```bash
# Development
npm run dev                  # Start backend
npm run dev:frontend         # Start frontend (separate terminal)

# Database
npm run migrate:up           # Run migrations
npm run migrate:down         # Rollback migrations

# Build
npm run build               # Build backend
npm run build:frontend      # Build frontend

# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Specific test suites
npm run test:dashboard      # Dashboard tests only
npm run test:models         # Database model tests
```

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## Contributing

When making changes to the dashboard feature:

1. **Create a feature branch:** `git checkout -b feature/your-feature`
2. **Write tests first** (TDD approach)
3. **Update TypeScript types** as needed
4. **Add inline comments** for complex logic
5. **Update this documentation** if API/architecture changes
6. **Run tests:** `npm test`
7. **Check accessibility:** WCAG AA compliance
8. **Create PR** with detailed description

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-24
**Next Review:** When major features are added
