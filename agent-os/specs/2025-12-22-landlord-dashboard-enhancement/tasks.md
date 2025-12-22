# Task Breakdown: Landlord Dashboard Enhancement

## Overview
**Total Tasks:** 57 sub-tasks across 11 task groups
**Estimated Duration:** 10-14 days
**Feature:** Bring Landlord Dashboard to feature parity with Tenant Dashboard with real-time updates, enhanced KPIs, improved UX, and proper routing.

---

## Task List

### Phase 1: Backend Foundation

#### Task Group 1: Database Schema & Migrations
**Dependencies:** None
**Priority:** Critical
**Estimated Time:** 4-6 hours

- [x] 1.0 Complete database schema updates for property metrics
  - [x] 1.1 Write 2-5 focused tests for property metrics functionality
    - Test days_on_market calculation on property creation
    - Test view_count increment functionality
    - Test inquiry_count increment functionality
    - Test last_activity_at timestamp updates
    - Test trigger function for days_on_market auto-calculation
  - [x] 1.2 Create migration file: `add_property_metrics.sql`
    - Add column: `days_on_market INTEGER`
    - Add column: `view_count INTEGER DEFAULT 0`
    - Add column: `inquiry_count INTEGER DEFAULT 0`
    - Add column: `last_activity_at TIMESTAMP`
    - Location: `/home/anti/Documents/tenantlist/src/database/migrations/020-add-property-metrics.ts`
  - [x] 1.3 Create trigger function for auto-calculating days_on_market
    - Function name: `update_days_on_market()`
    - Logic: Calculate EXTRACT(DAY FROM NOW() - created_at) when status = 'active'
    - Trigger name: `calculate_days_on_market`
    - Trigger timing: BEFORE UPDATE ON properties
  - [x] 1.4 Backfill days_on_market for existing active properties
    - Update WHERE status = 'active' AND days_on_market IS NULL
    - Use same calculation as trigger function
  - [x] 1.5 Run database migration tests
    - Run ONLY the 2-5 tests written in 1.1
    - Verify migration executes without errors
    - Verify trigger functions correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Migration executes successfully on test database
- All 4 new columns added to properties table
- Trigger auto-calculates days_on_market on updates
- Existing properties backfilled correctly
- Tests pass (2-5 tests)

---

#### Task Group 2: PropertyKPIService Implementation
**Dependencies:** Task Group 1
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 2.0 Complete PropertyKPIService with Redis caching
  - [ ] 2.1 Write 3-6 focused tests for PropertyKPIService
    - Test KPI calculation for totalListings
    - Test KPI calculation for activeListings
    - Test avgDaysOnMarket calculation with trend
    - Test responseRate calculation with trend
    - Test Redis cache hit/miss scenarios
    - Test cache invalidation logic
  - [ ] 2.2 Create PropertyKPIService class
    - Location: `/home/anti/Documents/tenantlist/src/backend/services/propertyKPIService.ts`
    - Dependencies: Redis client, database connection
    - Cache key pattern: `property-kpis:${userId}`
    - Cache TTL: 5 minutes (300 seconds)
  - [ ] 2.3 Implement calculateKPIs(userId: string) method
    - Calculate totalListings: COUNT(*) WHERE user_id = userId
    - Calculate activeListings: COUNT(*) WHERE user_id = userId AND status = 'active'
    - Calculate avgDaysOnMarket: AVG(days_on_market) WHERE status = 'active'
    - Calculate responseRate: (SUM(inquiry_count) / SUM(view_count)) * 100
  - [ ] 2.4 Implement trend calculation logic
    - Compare current value vs 7 days ago
    - Calculate percentage change
    - Determine direction: 'up', 'down', or 'neutral'
    - Format: { value: number, direction: string, period: "vs last week" }
  - [ ] 2.5 Implement cacheKPIs(userId: string, kpis: KPIData) method
    - Store in Redis with 5-minute TTL
    - Use JSON.stringify for storage
    - Handle Redis connection errors gracefully
  - [ ] 2.6 Implement getCachedKPIs(userId: string) method
    - Check Redis cache first
    - Return cached data if available and not expired
    - Return null if cache miss
  - [ ] 2.7 Implement invalidateCache(userId: string) method
    - Delete cache key from Redis
    - Log invalidation for monitoring
    - Handle errors gracefully (non-blocking)
  - [ ] 2.8 Run PropertyKPIService tests
    - Run ONLY the 3-6 tests written in 2.1
    - Verify cache hit rate in test scenarios
    - Verify trend calculations are accurate
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Service calculates all 4 KPI metrics correctly
- Trend calculations work (comparing 7 days ago)
- Redis caching works with 5-minute TTL
- Cache invalidation functions properly
- Tests pass (3-6 tests)
- Graceful fallback to DB query on cache failure

---

#### Task Group 3: PropertyDashboardEventService Implementation
**Dependencies:** Task Group 2
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 3.0 Complete PropertyDashboardEventService for WebSocket events
  - [ ] 3.1 Write 3-6 focused tests for event service
    - Test property-created event emission
    - Test property-updated event emission
    - Test property-deleted event emission
    - Test status-changed event emission
    - Test kpi-update event emission
    - Test cache invalidation triggering
  - [ ] 3.2 Create PropertyDashboardEventService class
    - Location: `/home/anti/Documents/tenantlist/src/backend/services/propertyDashboardEventService.ts`
    - Dependencies: WebSocket server, PropertyKPIService
    - Define PropertyDashboardEvent interface
  - [ ] 3.3 Define event type interfaces
    ```typescript
    interface PropertyDashboardEvent {
      type: 'kpi-update' | 'property-created' | 'property-updated' | 'property-deleted' | 'status-changed';
      userId: string;
      propertyId?: string;
      data?: any;
    }
    ```
  - [ ] 3.4 Implement emitPropertyCreated(userId, property) method
    - Invalidate KPI cache for userId
    - Broadcast event: { type: 'property-created', userId, property }
    - Use WebSocket to emit to connected landlord clients
  - [ ] 3.5 Implement emitPropertyUpdated(userId, propertyId, property) method
    - Invalidate KPI cache for userId
    - Broadcast event: { type: 'property-updated', userId, propertyId, property }
  - [ ] 3.6 Implement emitPropertyDeleted(userId, propertyId) method
    - Invalidate KPI cache for userId
    - Broadcast event: { type: 'property-deleted', userId, propertyId }
  - [ ] 3.7 Implement emitStatusChanged(userId, propertyId, oldStatus, newStatus) method
    - Invalidate KPI cache for userId
    - Broadcast event: { type: 'status-changed', userId, propertyId, oldStatus, newStatus }
  - [ ] 3.8 Implement emitKPIUpdate(userId, kpis) method
    - Broadcast event: { type: 'kpi-update', userId, kpis }
    - Called after cache invalidation and recalculation
  - [ ] 3.9 Run PropertyDashboardEventService tests
    - Run ONLY the 3-6 tests written in 3.1
    - Verify events are emitted correctly
    - Verify cache invalidation is triggered
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 5 event types can be emitted
- Events broadcast to correct WebSocket clients
- Cache invalidation triggered on mutations
- Tests pass (3-6 tests)
- Event payload format matches spec

---

#### Task Group 4: Landlord Dashboard Controller & Routes
**Dependencies:** Task Groups 2-3
**Priority:** Critical
**Estimated Time:** 4-6 hours

- [ ] 4.0 Complete landlord dashboard API endpoints
  - [ ] 4.1 Write 3-6 focused tests for dashboard endpoints
    - Test GET /api/dashboard/landlord returns full data
    - Test GET /api/dashboard/landlord/kpis returns KPIs only
    - Test authentication requirement (401 without auth)
    - Test authorization (LANDLORD role required)
    - Test pagination for properties list
    - Test cache usage vs DB query
  - [ ] 4.2 Create landlordDashboardController.ts
    - Location: `/home/anti/Documents/tenantlist/src/backend/controllers/landlordDashboardController.ts`
    - Dependencies: PropertyKPIService, Property model
    - Middleware: requireAuth, requireRole('LANDLORD')
  - [ ] 4.3 Implement getDashboardData() controller method
    - GET /api/dashboard/landlord
    - Get KPIs from PropertyKPIService (cached or calculated)
    - Get paginated properties list (page 1, limit 20)
    - Return: { kpis, properties, total, hasMore }
    - Use existing pagination pattern
  - [ ] 4.4 Implement getKPIs() controller method
    - GET /api/dashboard/landlord/kpis
    - Get KPIs only from PropertyKPIService
    - Return: { kpis }
    - Used for polling updates
  - [ ] 4.5 Create landlordDashboardRoutes.ts
    - Location: `/home/anti/Documents/tenantlist/src/backend/routes/landlordDashboardRoutes.ts`
    - Define route: GET /api/dashboard/landlord
    - Define route: GET /api/dashboard/landlord/kpis
    - Apply auth middleware to both routes
  - [ ] 4.6 Register routes in src/index.ts
    - Import landlordDashboardRoutes
    - Mount at /api/dashboard/landlord
    - Place before existing property routes to avoid conflicts
  - [ ] 4.7 Run landlord dashboard API tests
    - Run ONLY the 3-6 tests written in 4.1
    - Verify endpoints return correct data structure
    - Verify authentication and authorization
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Both API endpoints functional and return correct data
- Authentication and authorization enforced
- Pagination works for properties list
- KPI caching integrated correctly
- Tests pass (3-6 tests)
- Routes registered in main app

---

#### Task Group 5: Property Controller Integration
**Dependencies:** Task Group 3
**Priority:** Critical
**Estimated Time:** 3-4 hours

- [ ] 5.0 Integrate event emissions into property controller
  - [ ] 5.1 Write 2-4 focused tests for event integration
    - Test property creation emits property-created event
    - Test property update emits property-updated event
    - Test property deletion emits property-deleted event
    - Test status change emits status-changed event
  - [ ] 5.2 Update propertyController.ts create() method
    - Location: `/home/anti/Documents/tenantlist/src/backend/controllers/propertyController.ts`
    - After successful property creation, call eventService.emitPropertyCreated()
    - Pass userId and new property data
  - [ ] 5.3 Update propertyController.ts update() method
    - After successful property update, call eventService.emitPropertyUpdated()
    - Pass userId, propertyId, and updated property data
  - [ ] 5.4 Update propertyController.ts delete() method
    - After successful property deletion, call eventService.emitPropertyDeleted()
    - Pass userId and propertyId
  - [ ] 5.5 Update propertyController.ts updateStatus() method (if exists)
    - Capture oldStatus before update
    - After successful status change, call eventService.emitStatusChanged()
    - Pass userId, propertyId, oldStatus, newStatus
  - [ ] 5.6 Run property controller integration tests
    - Run ONLY the 2-4 tests written in 5.1
    - Verify events are emitted on CRUD operations
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Property CRUD operations emit correct events
- Status changes emit status-changed event
- Event service integrated without breaking existing functionality
- Tests pass (2-4 tests)

---

### Phase 2: Frontend Integration

#### Task Group 6: WebSocket Hook & Polling Service
**Dependencies:** Task Groups 3-4
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 6.0 Complete WebSocket and polling infrastructure
  - [ ] 6.1 Write 3-6 focused tests for WebSocket hook
    - Test WebSocket connection establishment
    - Test event listener registration for all 5 event types
    - Test auto-reconnection logic (max 3 attempts)
    - Test fallback to polling after failed reconnects
    - Test connection status updates (connected, disconnected, reconnecting)
    - Test cleanup on unmount
  - [ ] 6.2 Create usePropertyDashboardWebSocket.ts hook
    - Location: `/home/anti/Documents/tenantlist/src/frontend/hooks/usePropertyDashboardWebSocket.ts`
    - Connect to WebSocket on mount
    - Return connection status: 'connected' | 'disconnected' | 'reconnecting'
    - Return event handlers object
  - [ ] 6.3 Implement WebSocket event listeners
    - Listen for: `property-dashboard:kpi-update`
    - Listen for: `property:created`
    - Listen for: `property:updated`
    - Listen for: `property:deleted`
    - Listen for: `property:status-changed`
  - [ ] 6.4 Implement auto-reconnection logic
    - Max reconnection attempts: 3
    - Exponential backoff: 1s, 2s, 4s
    - Set status to 'reconnecting' during attempts
    - Fall back to polling after 3 failed attempts
  - [ ] 6.5 Create propertyPollingService.ts
    - Location: `/home/anti/Documents/tenantlist/src/frontend/services/propertyPollingService.ts`
    - Poll GET /api/dashboard/landlord/kpis every 10 seconds
    - Only poll when WebSocket is disconnected
    - Export startPolling() and stopPolling() functions
  - [ ] 6.6 Integrate polling with WebSocket hook
    - Start polling when WebSocket fails after 3 reconnect attempts
    - Stop polling when WebSocket reconnects successfully
    - Update KPIs from polling responses
  - [ ] 6.7 Run WebSocket hook and polling service tests
    - Run ONLY the 3-6 tests written in 6.1
    - Verify connection lifecycle works correctly
    - Verify polling starts/stops appropriately
    - Do NOT run entire test suite

**Acceptance Criteria:**
- WebSocket connects successfully on mount
- All 5 event types handled correctly
- Auto-reconnection works (max 3 attempts)
- Polling fallback activates after failed reconnects
- Connection status accurate
- Tests pass (3-6 tests)

---

#### Task Group 7: LandlordDashboard WebSocket Integration
**Dependencies:** Task Group 6
**Priority:** Critical
**Estimated Time:** 4-6 hours

- [ ] 7.0 Integrate WebSocket into LandlordDashboard component
  - [ ] 7.1 Write 2-5 focused tests for dashboard WebSocket integration
    - Test KPI updates on kpi-update event
    - Test property list refresh on property-created event
    - Test property list update on property-updated event
    - Test property removal on property-deleted event
    - Test ConnectionIndicator displays correct status
  - [ ] 7.2 Update LandlordDashboard.tsx to use WebSocket hook
    - Location: `/home/anti/Documents/tenantlist/src/frontend/pages/LandlordDashboard.tsx`
    - Import and use usePropertyDashboardWebSocket hook
    - Destructure connectionStatus from hook
  - [ ] 7.3 Implement kpi-update event handler
    - Update local KPI state when event received
    - Maintain existing KPI data structure
    - Smooth transition without flicker
  - [ ] 7.4 Implement property-created event handler
    - Refresh property list (call existing fetch function)
    - Show success toast notification
    - Update total count
  - [ ] 7.5 Implement property-updated event handler
    - Find and update property in local state
    - Use optimistic update pattern
    - Fall back to refresh if property not found
  - [ ] 7.6 Implement property-deleted event handler
    - Remove property from local state
    - Update total count
    - Adjust pagination if needed
  - [ ] 7.7 Implement status-changed event handler
    - Update property status in local state
    - Refresh KPIs (status change affects activeListings KPI)
  - [ ] 7.8 Run LandlordDashboard integration tests
    - Run ONLY the 2-5 tests written in 7.1
    - Verify all event handlers work correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Dashboard receives and handles all WebSocket events
- KPIs update in real-time
- Property list updates without full page refresh
- UI updates are smooth (no flickering)
- Tests pass (2-5 tests)

---

#### Task Group 8: Infinite Scroll Implementation
**Dependencies:** Task Group 7
**Priority:** Critical
**Estimated Time:** 4-5 hours

- [ ] 8.0 Implement infinite scroll pagination
  - [ ] 8.1 Write 2-4 focused tests for infinite scroll
    - Test Intersection Observer triggers loadMore
    - Test loading state during fetch
    - Test hasMore flag prevents unnecessary fetches
    - Test scroll position maintained after new items load
  - [ ] 8.2 Update LandlordDashboard state management
    - Keep existing: currentPage, hasMore, isLoadingMore
    - Remove manual "Load More" button logic
    - Add scrollSentinelRef for Intersection Observer
  - [ ] 8.3 Implement Intersection Observer logic
    - Create ref for scroll sentinel element
    - Set up observer in useEffect
    - Trigger loadMoreProperties() when sentinel visible
    - Disconnect observer on unmount
    - Threshold: 0.5 (trigger when 50% visible)
  - [ ] 8.4 Update loadMoreProperties() function
    - Check if already loading or no more items
    - Increment currentPage
    - Fetch next page of properties
    - Append to existing properties list
    - Update hasMore based on response
  - [ ] 8.5 Update PropertyListingsSection.tsx
    - Location: `/home/anti/Documents/tenantlist/src/frontend/components/PropertyListingsSection.tsx`
    - Remove traditional pagination controls
    - Add scroll sentinel div at bottom of list
    - Show loading spinner when isLoadingMore = true
    - Show "No more properties" when hasMore = false
  - [ ] 8.6 Run infinite scroll tests
    - Run ONLY the 2-4 tests written in 8.1
    - Verify scroll triggers load correctly
    - Verify loading states display properly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Infinite scroll triggers automatically near bottom
- New properties append smoothly to list
- Loading spinner shows during fetch
- No duplicate fetches when already loading
- Tests pass (2-4 tests)
- Pattern matches Tenant Dashboard implementation

---

#### Task Group 9: Connection Indicator Integration
**Dependencies:** Task Group 6
**Priority:** High
**Estimated Time:** 2-3 hours

- [ ] 9.0 Add ConnectionIndicator to LandlordDashboard
  - [ ] 9.1 Write 2-3 focused tests for ConnectionIndicator
    - Test shows "Connected" when status = 'connected'
    - Test shows "Reconnecting..." when status = 'reconnecting'
    - Test shows "Polling for updates" when status = 'disconnected'
  - [ ] 9.2 Import ConnectionIndicator component
    - Component location: `/home/anti/Documents/tenantlist/src/frontend/components/ConnectionIndicator.tsx`
    - Component already exists (used in Tenant Dashboard)
    - Import into LandlordDashboard.tsx
  - [ ] 9.3 Add ConnectionIndicator to LandlordDashboard render
    - Pass connectionStatus from WebSocket hook
    - Position: fixed bottom-right corner
    - Z-index: ensure above property cards
  - [ ] 9.4 Update ConnectionIndicator status messages
    - Connected: Green dot + "Connected"
    - Reconnecting: Yellow dot + "Reconnecting..."
    - Disconnected: Red dot + "Polling for updates"
  - [ ] 9.5 Run ConnectionIndicator integration tests
    - Run ONLY the 2-3 tests written in 9.1
    - Verify indicator displays correct status
    - Do NOT run entire test suite

**Acceptance Criteria:**
- ConnectionIndicator visible in bottom-right
- Status updates match WebSocket connection state
- Visual states (colors, text) correct
- Tests pass (2-3 tests)

---

### Phase 3: UI Enhancements

#### Task Group 10: KPICard Trend Indicators
**Dependencies:** Task Group 7
**Priority:** High
**Estimated Time:** 4-5 hours

- [ ] 10.0 Enhance KPICard component with trend indicators
  - [ ] 10.1 Write 2-4 focused tests for KPICard trends
    - Test trend indicator shows up arrow for positive trends
    - Test trend indicator shows down arrow for negative trends
    - Test trend indicator shows dash for neutral trends
    - Test loading skeleton displays during data fetch
  - [ ] 10.2 Update KPICard.tsx component interface
    - Location: `/home/anti/Documents/tenantlist/src/frontend/components/KPICard.tsx`
    - Add optional trend prop:
    ```typescript
    interface TrendData {
      value: number;        // percentage change
      direction: 'up' | 'down' | 'neutral';
      period: string;       // "vs last week"
    }
    ```
  - [ ] 10.3 Implement trend indicator visual display
    - Up trend: ↑ arrow + percentage (green text)
    - Down trend: ↓ arrow + percentage (red text)
    - Neutral: → dash + 0% (gray text)
    - Font size: smaller than main value
    - Position: below main KPI value
  - [ ] 10.4 Add trend period text
    - Display period text (e.g., "vs last week")
    - Style: small, muted text
    - Position: below trend indicator
  - [ ] 10.5 Implement loading skeleton for KPICard
    - Show skeleton during initial load
    - Animate skeleton (shimmer effect)
    - Maintain card layout during load
    - Match existing skeleton pattern from PropertyCardSkeleton
  - [ ] 10.6 Update LandlordDashboard to pass trend data
    - Map KPI response data to include trend
    - Pass trend prop to each KPICard
    - Handle missing trend gracefully (don't show indicator)
  - [ ] 10.7 Run KPICard enhancement tests
    - Run ONLY the 2-4 tests written in 10.1
    - Verify trends display correctly
    - Verify colors match direction
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Trend indicators display for all 4 KPI cards
- Colors correct (green up, red down, gray neutral)
- Period text shows "vs last week"
- Loading skeleton works
- Tests pass (2-4 tests)

---

#### Task Group 11: PropertyCard Enhancements & Activity Badges
**Dependencies:** Task Group 1
**Priority:** High
**Estimated Time:** 4-5 hours

- [ ] 11.0 Enhance PropertyCard with activity badges and metrics
  - [ ] 11.1 Write 2-4 focused tests for PropertyCard enhancements
    - Test "New" badge shows for properties created <7 days ago
    - Test "Hot" badge shows for properties with >10 inquiries
    - Test "Updated" badge shows for recently modified properties
    - Test days on market displays correctly
  - [ ] 11.2 Update PropertyCard.tsx component
    - Location: `/home/anti/Documents/tenantlist/src/frontend/components/PropertyCard.tsx`
    - Add activity badge logic
    - Add performance metrics display
  - [ ] 11.3 Implement "New" badge
    - Show when property.created_at is within last 7 days
    - Style: blue badge with "New" text
    - Position: top-right corner of card
  - [ ] 11.4 Implement "Hot" badge
    - Show when property.inquiry_count > 10
    - Style: red/orange badge with "Hot" text
    - Position: top-right corner (below "New" if both present)
  - [ ] 11.5 Implement "Updated" badge
    - Show when property.updated_at is within last 24 hours AND updated_at != created_at
    - Style: green badge with "Updated" text
    - Position: top-right corner
  - [ ] 11.6 Add days on market indicator
    - Display property.days_on_market as badge
    - Text: "X days on market"
    - Position: bottom of card or near status
    - Only show for active properties
  - [ ] 11.7 Add view/inquiry ratio indicator (optional)
    - Calculate ratio: inquiry_count / view_count
    - Display as percentage or icon-based indicator
    - Show only if view_count > 0
  - [ ] 11.8 Run PropertyCard enhancement tests
    - Run ONLY the 2-4 tests written in 11.1
    - Verify badges show under correct conditions
    - Verify metrics display correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Activity badges display based on property data
- Badge styling distinct and visually clear
- Days on market shows for active properties
- Tests pass (2-4 tests)
- Badges don't overlap or cause layout issues

---

#### Task Group 12: Routing Updates
**Dependencies:** None (can run in parallel with other groups)
**Priority:** Critical
**Estimated Time:** 2-3 hours

- [ ] 12.0 Update routing from /properties to /landlord-dashboard
  - [ ] 12.1 Write 2-3 focused tests for routing
    - Test /landlord-dashboard route renders LandlordDashboard
    - Test /properties redirects to /landlord-dashboard
    - Test navigation links point to correct route
  - [ ] 12.2 Update App.tsx route definition
    - Location: `/home/anti/Documents/tenantlist/src/frontend/App.tsx`
    - Change route path from "/properties" to "/landlord-dashboard"
    - Keep element: <LandlordDashboard />
  - [ ] 12.3 Add backward compatibility redirect
    - Add new route: path="/properties"
    - Element: <Navigate to="/landlord-dashboard" replace />
    - Ensures old bookmarks still work
  - [ ] 12.4 Update TopNavigation.tsx links (if applicable)
    - Location: Search for TopNavigation component
    - Update any hardcoded "/properties" links to "/landlord-dashboard"
    - Check dashboard navigation links for landlord role
  - [ ] 12.5 Update any other navigation components
    - Search codebase for "/properties" references
    - Update to "/landlord-dashboard" where appropriate
    - Keep API endpoints unchanged (only frontend routes)
  - [ ] 12.6 Run routing tests
    - Run ONLY the 2-3 tests written in 12.1
    - Verify new route works
    - Verify redirect works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- /landlord-dashboard route active and working
- /properties redirects to /landlord-dashboard
- All navigation links updated
- Tests pass (2-3 tests)
- No broken links in UI

---

### Phase 4: Testing & Polish

#### Task Group 13: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-12
**Priority:** High
**Estimated Time:** 6-8 hours

- [ ] 13.0 Review existing tests and fill critical gaps only
  - [ ] 13.1 Review tests from all previous task groups
    - Database migrations: 2-5 tests (Task 1.1)
    - PropertyKPIService: 3-6 tests (Task 2.1)
    - PropertyDashboardEventService: 3-6 tests (Task 3.1)
    - Landlord dashboard controller: 3-6 tests (Task 4.1)
    - Property controller integration: 2-4 tests (Task 5.1)
    - WebSocket hook: 3-6 tests (Task 6.1)
    - Dashboard WebSocket integration: 2-5 tests (Task 7.1)
    - Infinite scroll: 2-4 tests (Task 8.1)
    - ConnectionIndicator: 2-3 tests (Task 9.1)
    - KPICard trends: 2-4 tests (Task 10.1)
    - PropertyCard enhancements: 2-4 tests (Task 11.1)
    - Routing: 2-3 tests (Task 12.1)
    - **Total existing tests: approximately 29-56 tests**
  - [ ] 13.2 Analyze test coverage gaps for this feature only
    - Focus on integration points between services
    - Identify critical end-to-end user workflows lacking coverage
    - Prioritize: Dashboard load → WebSocket connection → Real-time update → UI refresh
    - Check: Error handling scenarios (WebSocket failure, API errors, cache misses)
    - Check: Edge cases (empty state, very large property lists, simultaneous updates)
    - Do NOT assess entire application test coverage
  - [ ] 13.3 Write up to 10 additional strategic tests maximum
    - End-to-end: Full dashboard load with cached KPIs
    - End-to-end: WebSocket disconnect → polling fallback → reconnect
    - Integration: Property creation → cache invalidation → KPI update → WebSocket event
    - Integration: Infinite scroll pagination with real-time updates
    - Error handling: API failure during KPI fetch (fallback to DB)
    - Error handling: Redis cache unavailable (graceful degradation)
    - Error handling: WebSocket auth failure
    - Performance: KPI cache hit rate > 90%
    - Performance: Dashboard load time < 2 seconds
    - Accessibility: Keyboard navigation through property cards
    - **Add ONLY tests for critical gaps, max 10 total**
  - [ ] 13.4 Run feature-specific test suite
    - Run ALL tests related to this feature (Tasks 1-12 + new tests)
    - Expected total: approximately 39-66 tests maximum
    - Verify critical workflows pass
    - Check test coverage report (aim for >80% on new code)
    - Do NOT run entire application test suite
  - [ ] 13.5 Fix any failing tests
    - Debug and fix test failures
    - Update test expectations if requirements changed
    - Ensure tests are stable (no flakiness)
  - [ ] 13.6 Document test coverage
    - Note test coverage percentage for new code
    - List any known gaps with justification
    - Document test execution time

**Acceptance Criteria:**
- All feature tests pass (approximately 39-66 tests total)
- Critical user workflows covered end-to-end
- Error handling scenarios tested
- No more than 10 additional tests added
- Test coverage >80% on new code
- Tests run in reasonable time (<5 minutes)

---

## Execution Order & Dependencies

### Recommended Implementation Sequence:

**Week 1: Backend Foundation**
1. Task Group 1: Database Schema & Migrations (Day 1)
2. Task Group 2: PropertyKPIService Implementation (Day 1-2)
3. Task Group 3: PropertyDashboardEventService Implementation (Day 2-3)
4. Task Group 4: Landlord Dashboard Controller & Routes (Day 3)
5. Task Group 5: Property Controller Integration (Day 4)

**Week 2: Frontend Integration & UI**
6. Task Group 12: Routing Updates (Day 5 - can run in parallel)
7. Task Group 6: WebSocket Hook & Polling Service (Day 5-6)
8. Task Group 7: LandlordDashboard WebSocket Integration (Day 6-7)
9. Task Group 8: Infinite Scroll Implementation (Day 7)
10. Task Group 9: Connection Indicator Integration (Day 8)
11. Task Group 10: KPICard Trend Indicators (Day 8-9)
12. Task Group 11: PropertyCard Enhancements (Day 9-10)

**Week 2-3: Testing & Polish**
13. Task Group 13: Test Review & Gap Analysis (Day 10-12)

### Parallel Execution Opportunities:

- Task Group 12 (Routing) can run in parallel with Task Groups 1-5
- Task Groups 10 and 11 (UI enhancements) can run in parallel if different developers
- Frontend tests (Task Groups 6-12) can be written while backend is being implemented

---

## Critical Path

The following task groups are on the critical path and must be completed sequentially:

1. Task Group 1 (Database) → Task Group 2 (KPI Service) → Task Group 3 (Event Service) → Task Group 6 (WebSocket Hook) → Task Group 7 (Dashboard Integration)

Any delays in these groups will delay the entire project.

---

## Testing Strategy

### Test Distribution:
- **Unit Tests:** 20-30 tests (services, utilities, hooks)
- **Integration Tests:** 10-15 tests (API endpoints, WebSocket events, component integration)
- **E2E Tests:** 5-10 tests (critical user workflows)
- **Total:** 35-55 tests from development + max 10 gap-filling tests = **45-65 tests**

### Test Focus Areas:
1. Real-time update flow (WebSocket → event → state update → UI refresh)
2. Cache invalidation and KPI recalculation
3. Polling fallback when WebSocket fails
4. Infinite scroll pagination
5. Error handling and graceful degradation

---

## Performance Targets

- [ ] Dashboard initial load: <2 seconds
- [ ] KPI update latency: <500ms
- [ ] WebSocket reconnection: <3 seconds
- [ ] Cache hit rate: >90%
- [ ] Infinite scroll: <300ms per page load

---

## Acceptance Checklist

### Functional Requirements
- [ ] Landlord Dashboard accessible at /landlord-dashboard
- [ ] Real-time property updates via WebSocket
- [ ] Polling fallback when WebSocket disconnected
- [ ] Connection indicator showing accurate status
- [ ] 4 KPI cards with trend indicators
- [ ] Infinite scroll pagination (no manual Load More)
- [ ] KPIs cached in Redis (5-minute TTL)
- [ ] Cache invalidated on property CRUD events
- [ ] Property metrics tracked (days_on_market, view_count, inquiry_count)

### Non-Functional Requirements
- [ ] Dashboard loads in <2 seconds
- [ ] KPI updates in <500ms
- [ ] WebSocket reconnects in <3 seconds
- [ ] Mobile responsive (320px - 1920px)
- [ ] Tests pass (45-65 total tests)
- [ ] Test coverage >80% on new code

### Code Quality
- [ ] TypeScript types defined for all interfaces
- [ ] Error handling implemented for all async operations
- [ ] Loading states implemented for all data fetches
- [ ] WebSocket cleanup on component unmount
- [ ] No console errors in browser
- [ ] Code follows existing patterns in codebase

---

**End of Task Breakdown**
