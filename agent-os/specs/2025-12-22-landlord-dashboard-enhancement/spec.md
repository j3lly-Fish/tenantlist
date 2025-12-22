# Landlord Dashboard Enhancement Specification

## Overview
This spec defines the enhancements needed to bring the Landlord Dashboard to feature parity with the Tenant Dashboard, including real-time updates, enhanced KPIs, improved UX patterns, and proper routing.

**Project Path:** /home/anti/Documents/tenantlist/
**Current File:** `src/frontend/pages/LandlordDashboard.tsx`
**Current Route:** `/properties`
**Target Route:** `/landlord-dashboard`

## Tech Stack
- React 18 with TypeScript
- CSS Modules for styling
- WebSocket for real-time updates
- Redis for KPI caching
- Vite for build tooling

---

## Goals

1. **Achieve feature parity** with Tenant Dashboard
2. **Add real-time updates** via WebSocket with polling fallback
3. **Enhance KPIs** with new metrics and trend indicators
4. **Improve UX** with infinite scroll and better loading states
5. **Fix routing** to use `/landlord-dashboard`
6. **Add caching layer** for performance optimization

---

## Current State vs Target State

| Feature | Current | Target |
|---------|---------|--------|
| Route | `/properties` | `/landlord-dashboard` |
| Real-time updates | ❌ None | ✅ WebSocket + Polling |
| Connection indicator | ❌ None | ✅ Yes |
| Pagination | Traditional | Infinite scroll |
| KPI Cards | 4 basic | 4 enhanced with trends |
| KPI Backend | Direct DB query | Cached with Redis (5min TTL) |
| Cache invalidation | ❌ None | ✅ On CRUD events |
| Dashboard events | ❌ None | ✅ WebSocket events |
| Loading states | Basic | Enhanced skeletons |

---

## Priority Breakdown

### Critical Priority

#### 1. Real-Time Updates via WebSocket

**Current State:** No real-time updates. Data only refreshes on page reload.

**Required State:** WebSocket connection with automatic reconnection and polling fallback.

**Implementation:**

1. **Create usePropertyDashboardWebSocket Hook**
   - Location: `src/frontend/hooks/usePropertyDashboardWebSocket.ts`
   - Connect to WebSocket on mount
   - Listen for events:
     - `property-dashboard:kpi-update`
     - `property:created`
     - `property:updated`
     - `property:deleted`
     - `property:status-changed`
   - Auto-reconnect on disconnect (max 3 attempts)
   - Fallback to polling after failed reconnections
   - Return connection status: `connected`, `disconnected`, `reconnecting`

2. **Create PropertyPollingService**
   - Location: `src/frontend/services/propertyPollingService.ts`
   - Poll `/api/dashboard/landlord/kpis` every 10 seconds
   - Only poll when WebSocket is disconnected
   - Auto-stop when WebSocket reconnects

3. **Integrate into LandlordDashboard**
   - Use hook in LandlordDashboard component
   - Update KPIs on events
   - Refresh property list on property events
   - Show ConnectionIndicator

#### 2. Backend WebSocket & Event Service

**Create PropertyDashboardEventService**
- Location: `src/backend/services/propertyDashboardEventService.ts`
- Handle property CRUD events
- Invalidate cache on updates
- Broadcast to connected landlord clients

**Event Types:**
```typescript
interface PropertyDashboardEvent {
  type: 'kpi-update' | 'property-created' | 'property-updated' | 'property-deleted' | 'status-changed';
  userId: string;
  propertyId?: string;
  data?: any;
}
```

**Integration Points:**
- propertyController.ts: Emit events on create, update, delete, status change
- propertyService.ts: Trigger cache invalidation

#### 3. Enhanced KPIs with Caching

**Create PropertyKPIService**
- Location: `src/backend/services/propertyKPIService.ts`
- Calculate and cache KPIs with 5-minute Redis TTL
- Cache key: `property-kpis:${userId}`

**KPI Metrics:**

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Listings | Count all properties for user | Number |
| Active Listings | Count where status = 'active' | Number |
| Avg Days on Market | AVG(NOW() - created_at) for active | Number + trend |
| Response Rate | (inquiries / views) * 100 | Percentage + trend |

**Trend Calculation:**
- Compare current value vs 7 days ago
- Show ↑ or ↓ with percentage change
- Green for positive trends, red for negative

**API Endpoints:**
```
GET /api/dashboard/landlord          - Full dashboard data
GET /api/dashboard/landlord/kpis     - KPIs only (for polling)
```

**Cache Invalidation:**
- On property created/updated/deleted
- On property status change
- On property view/inquiry event

#### 4. Routing Fix

**Changes Needed:**

1. **Update App.tsx**
   ```typescript
   // Change from:
   <Route path="/properties" element={<LandlordDashboard />} />

   // To:
   <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
   ```

2. **Update ProtectedRoute.tsx**
   - Already redirects LANDLORD to `/landlord-dashboard` ✅
   - No changes needed

3. **Update Navigation Links**
   - TopNavigation.tsx: Update any hardcoded `/properties` links
   - Profile dropdown: Update "Dashboard" link for landlords

4. **Add Redirect**
   ```typescript
   // For backward compatibility
   <Route path="/properties" element={<Navigate to="/landlord-dashboard" replace />} />
   ```

#### 5. Infinite Scroll Pagination

**Current:** Traditional pagination with "Load More" button

**Target:** Automatic infinite scroll like Tenant Dashboard

**Implementation:**

1. **Update LandlordDashboard State**
   - Keep `currentPage`, `hasMore`, `isLoadingMore`
   - Remove manual "Load More" button

2. **Add Intersection Observer**
   - Detect when user scrolls near bottom
   - Auto-trigger `loadMoreProperties()`
   - Show loading spinner at bottom

3. **Update PropertyListingsSection**
   - Remove pagination controls
   - Add scroll sentinel element
   - Show "Loading more..." indicator

---

### High Priority

#### 6. Connection Indicator

**Component:** ConnectionIndicator.tsx (already exists for Tenant)

**Integration:**
- Add to LandlordDashboard
- Position: Bottom-right corner (fixed)
- States:
  - Connected (green dot + "Connected")
  - Reconnecting (yellow dot + "Reconnecting...")
  - Disconnected (red dot + "Polling for updates")

#### 7. Enhanced KPICard Component

**Update KPICard.tsx** to support:

1. **Trend Indicators**
   ```typescript
   interface TrendData {
     value: number;        // percentage change
     direction: 'up' | 'down' | 'neutral';
     period: string;       // "vs last week"
   }
   ```

2. **Visual Trend Display**
   - ↑ arrow + percentage (green) for positive
   - ↓ arrow + percentage (red) for negative
   - → dash (gray) for neutral/no change

3. **Loading State**
   - Skeleton loader for value and trend

**Example:**
```
┌─────────────────────────┐
│ Active Listings         │
│                         │
│       42        ↑ 12%   │
│                vs last  │
│                  week   │
└─────────────────────────┘
```

#### 8. Enhanced Property Metrics

**Add to Property Model:**
```typescript
interface PropertyListing {
  // ... existing fields
  days_on_market: number;
  view_count: number;
  inquiry_count: number;
  last_activity_at: Date;
}
```

**Database Migration:**
```sql
ALTER TABLE properties ADD COLUMN days_on_market INTEGER;
ALTER TABLE properties ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN inquiry_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN last_activity_at TIMESTAMP;

-- Trigger to auto-calculate days_on_market
CREATE OR REPLACE FUNCTION update_days_on_market()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    NEW.days_on_market = EXTRACT(DAY FROM NOW() - NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_days_on_market
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_days_on_market();
```

---

### Medium Priority

#### 9. Enhanced Error Handling

**Improvements:**

1. **WebSocket Error Handling**
   - Show toast notification on connection failure
   - Auto-fallback to polling
   - Retry button in ConnectionIndicator

2. **API Error Handling**
   - Specific error messages for different failure types
   - Retry logic with exponential backoff
   - User-friendly error display

3. **Optimistic Updates**
   - Update UI immediately on actions
   - Rollback on API failure
   - Show error toast on rollback

#### 10. Loading State Improvements

**Enhancements:**

1. **PropertyCardSkeleton**
   - Already exists ✅
   - Use for initial load

2. **KPI Loading Skeleton**
   - Show animated skeleton during load
   - Maintain layout during refresh

3. **Infinite Scroll Loading**
   - Bottom spinner for loading more
   - Smooth transition on new items

#### 11. Property Card Enhancements

**Add to PropertyCard.tsx:**

1. **Activity Indicator**
   - "New" badge for properties created in last 7 days
   - "Hot" badge for properties with >10 inquiries
   - "Updated" badge for recently modified

2. **Performance Metrics**
   - Days on market badge
   - View/Inquiry ratio indicator

3. **Quick Actions Menu**
   - Already has three-dot menu ✅
   - Add "Mark as Featured"
   - Add "Duplicate Listing"
   - Add "Download Report"

---

### Low Priority (Nice to Have)

#### 12. Dashboard Customization

**Features:**
- Rearrangeable KPI cards (drag & drop)
- Show/hide KPI cards
- Save preferences to user settings

#### 13. Bulk Operations

**Features:**
- Multi-select properties (checkboxes)
- Bulk status update
- Bulk delete
- Bulk export to CSV

#### 14. Analytics Integration

**Features:**
- Property performance chart
- Inquiry trends graph
- Market comparison widget

---

## API Specification

### New Endpoints

#### GET /api/dashboard/landlord
**Description:** Get full landlord dashboard data
**Auth:** Required (LANDLORD role)
**Response:**
```json
{
  "kpis": {
    "totalListings": { "value": 42, "trend": { "value": 12, "direction": "up" } },
    "activeListings": { "value": 35, "trend": { "value": 5, "direction": "up" } },
    "avgDaysOnMarket": { "value": 28, "trend": { "value": -8, "direction": "down" } },
    "responseRate": { "value": 15.5, "trend": { "value": 2.3, "direction": "up" } }
  },
  "properties": [...],
  "total": 42,
  "hasMore": false
}
```

#### GET /api/dashboard/landlord/kpis
**Description:** Get KPIs only (for polling)
**Auth:** Required (LANDLORD role)
**Response:**
```json
{
  "kpis": {
    "totalListings": { "value": 42, "trend": { "value": 12, "direction": "up" } },
    "activeListings": { "value": 35, "trend": { "value": 5, "direction": "up" } },
    "avgDaysOnMarket": { "value": 28, "trend": { "value": -8, "direction": "down" } },
    "responseRate": { "value": 15.5, "trend": { "value": 2.3, "direction": "up" } }
  }
}
```

### WebSocket Events

#### Server → Client

**property-dashboard:kpi-update**
```json
{
  "type": "kpi-update",
  "userId": "user-123",
  "kpis": { ... }
}
```

**property:created**
```json
{
  "type": "property-created",
  "userId": "user-123",
  "property": { ... }
}
```

**property:updated**
```json
{
  "type": "property-updated",
  "userId": "user-123",
  "propertyId": "prop-456",
  "property": { ... }
}
```

**property:deleted**
```json
{
  "type": "property-deleted",
  "userId": "user-123",
  "propertyId": "prop-456"
}
```

**property:status-changed**
```json
{
  "type": "status-changed",
  "userId": "user-123",
  "propertyId": "prop-456",
  "oldStatus": "active",
  "newStatus": "leased"
}
```

---

## File Structure

### Files to Create

```
Frontend:
  src/frontend/hooks/
    └── usePropertyDashboardWebSocket.ts  ❌ To create

  src/frontend/services/
    └── propertyPollingService.ts         ❌ To create

Backend:
  src/backend/controllers/
    └── landlordDashboardController.ts    ❌ To create

  src/backend/services/
    ├── propertyKPIService.ts             ❌ To create
    └── propertyDashboardEventService.ts  ❌ To create

  src/backend/routes/
    └── landlordDashboardRoutes.ts        ❌ To create

Database:
  src/backend/migrations/
    └── add_property_metrics.sql          ❌ To create
```

### Files to Modify

```
Frontend:
  src/frontend/pages/
    └── LandlordDashboard.tsx             ✏️ Add WebSocket, infinite scroll, ConnectionIndicator

  src/frontend/components/
    ├── KPICard.tsx                       ✏️ Add trend support
    ├── PropertyListingsSection.tsx       ✏️ Add infinite scroll
    └── PropertyCard.tsx                  ✏️ Add activity badges, metrics

  src/frontend/App.tsx                    ✏️ Update route from /properties to /landlord-dashboard

Backend:
  src/backend/controllers/
    └── propertyController.ts             ✏️ Emit dashboard events

  src/backend/services/
    └── propertyService.ts                ✏️ Integrate KPI cache invalidation

  src/index.ts                            ✏️ Register landlord dashboard routes
```

---

## Success Criteria

### Functional Requirements

- [ ] Landlord Dashboard routed at `/landlord-dashboard`
- [ ] Real-time property updates via WebSocket
- [ ] Polling fallback when WebSocket fails
- [ ] Connection indicator showing status
- [ ] 4 enhanced KPI cards with trend indicators
- [ ] Infinite scroll pagination
- [ ] KPIs cached in Redis with 5-minute TTL
- [ ] Cache invalidated on property CRUD events
- [ ] Property metrics tracked (views, inquiries, days on market)

### Non-Functional Requirements

- [ ] Dashboard loads in <2 seconds
- [ ] KPI updates in <500ms
- [ ] WebSocket reconnection in <3 seconds
- [ ] Polling interval: 10 seconds
- [ ] Cache hit rate: >90%
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessible (WCAG 2.1 AA)

### Testing Requirements

- [ ] Unit tests for all new services (>80% coverage)
- [ ] Integration tests for WebSocket events
- [ ] E2E tests for dashboard interactions
- [ ] Load testing for KPI caching
- [ ] WebSocket connection/reconnection tests

---

## Technical Considerations

### Performance

1. **KPI Caching Strategy**
   - Redis cache with 5-minute TTL
   - Cache key includes user ID
   - Invalidate on property mutations
   - Pre-warm cache on login

2. **WebSocket Scaling**
   - Use Redis pub/sub for multi-server setup
   - Sticky sessions for WebSocket connections
   - Graceful degradation to polling

3. **Infinite Scroll Optimization**
   - Virtual scrolling for 100+ properties
   - Lazy load images
   - Debounce scroll events

### Security

1. **WebSocket Authentication**
   - Validate JWT token on connection
   - Enforce user ID matching
   - Rate limit events per connection

2. **API Authorization**
   - Verify user owns properties
   - Role-based access control
   - Input validation on all endpoints

### Error Handling

1. **WebSocket Failures**
   - Auto-reconnect with exponential backoff
   - Fallback to polling after 3 failed attempts
   - User notification on persistent failures

2. **Cache Failures**
   - Fallback to direct DB query
   - Log cache misses for monitoring
   - Graceful degradation

---

## Migration & Deployment

### Database Migration

```sql
-- Migration: add_property_metrics
-- Run before deploying new code

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS days_on_market INTEGER,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Backfill days_on_market for existing properties
UPDATE properties
SET days_on_market = EXTRACT(DAY FROM NOW() - created_at)
WHERE status = 'active' AND days_on_market IS NULL;

-- Create trigger
CREATE OR REPLACE FUNCTION update_days_on_market()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    NEW.days_on_market = EXTRACT(DAY FROM NOW() - NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_days_on_market
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_days_on_market();

COMMIT;
```

### Deployment Steps

1. **Pre-deployment**
   - Run database migration
   - Verify Redis connection
   - Test WebSocket server

2. **Deployment**
   - Deploy backend changes first
   - Deploy frontend changes
   - Verify WebSocket connections

3. **Post-deployment**
   - Monitor error rates
   - Check cache hit rates
   - Verify WebSocket connections
   - Test on staging with real data

4. **Rollback Plan**
   - Keep `/properties` redirect active
   - Redis cache is optional (degrades gracefully)
   - WebSocket failures fall back to polling

---

## Timeline Estimate

### Phase 1: Backend Foundation (3-4 days)
- Day 1: Database migration + PropertyKPIService
- Day 2: PropertyDashboardEventService + WebSocket setup
- Day 3: landlordDashboardController + API endpoints
- Day 4: Testing + bug fixes

### Phase 2: Frontend Integration (3-4 days)
- Day 1: usePropertyDashboardWebSocket hook + polling service
- Day 2: LandlordDashboard WebSocket integration
- Day 3: Infinite scroll + ConnectionIndicator
- Day 4: Testing + bug fixes

### Phase 3: Enhancements (2-3 days)
- Day 1: KPICard trend indicators
- Day 2: PropertyCard enhancements + activity badges
- Day 3: Error handling improvements + loading states

### Phase 4: Testing & Polish (2-3 days)
- Day 1: Unit tests + integration tests
- Day 2: E2E tests + load testing
- Day 3: Bug fixes + documentation

**Total: 10-14 days**

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket scaling issues | High | Medium | Use Redis pub/sub, load test before prod |
| Cache consistency | Medium | Medium | Strict invalidation rules, monitoring |
| Breaking existing users | High | Low | Keep `/properties` redirect, gradual rollout |
| Performance degradation | Medium | Low | Load testing, caching strategy, optimization |
| Database migration failure | High | Low | Test on staging, have rollback script ready |

---

## Future Enhancements (Out of Scope)

1. Portfolio management (group properties)
2. Lease expiration calendar
3. Tenant application pipeline
4. Financial analytics
5. Market comparison tools
6. Bulk operations
7. Advanced filtering
8. Custom dashboard layouts

These will be addressed in future specs.

---

**End of Specification**
