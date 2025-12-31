# Task Breakdown: Broker Dashboard Implementation

## Overview
**Total Tasks:** 52 sub-tasks across 10 task groups
**Estimated Duration:** 8-12 days
**Feature:** Complete broker dashboard with dual view (tenant demands + property listings), real-time updates, KPIs, and broker profile management.

---

## Task List

### Phase 1: Backend Foundation

#### Task Group 1: Database Schema & Migrations
**Dependencies:** None
**Priority:** Critical
**Estimated Time:** 4-6 hours

- [ ] 1.0 Complete database schema for broker profiles and deals
  - [ ] 1.1 Write 2-4 focused tests for broker profile functionality
    - Test broker profile creation
    - Test broker profile updates
    - Test fetching broker profile by user_id
    - Test broker profile constraints (user must have BROKER role)
  - [ ] 1.2 Create migration file: `025-add-broker-profile.ts`
    - Create table: `broker_profiles`
    - Columns: id, user_id, company_name, license_number, license_state, specialties, bio, website_url, years_experience, total_deals_closed, total_commission_earned, created_at, updated_at
    - Foreign key: user_id → users(id) ON DELETE CASCADE
    - Unique constraint on user_id
    - Location: `/src/database/migrations/025-add-broker-profile.ts`
  - [ ] 1.3 Create migration file: `026-add-broker-deals.ts`
    - Create table: `broker_deals`
    - Columns: id, broker_user_id, tenant_business_id, property_id, demand_listing_id, status, commission_percentage, estimated_commission, notes, created_at, updated_at, closed_at
    - Foreign keys: broker_user_id → users(id), tenant_business_id → businesses(id), property_id → property_listings(id), demand_listing_id → demand_listings(id)
    - Index on broker_user_id for fast lookup
    - Index on status for filtering
    - Location: `/src/database/migrations/026-add-broker-deals.ts`
  - [ ] 1.4 Run database migration tests
    - Run ONLY the 2-4 tests written in 1.1
    - Verify migrations execute without errors
    - Verify foreign keys and constraints work
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Migrations execute successfully on test database
- broker_profiles table created with all columns
- broker_deals table created with all columns
- Foreign keys and constraints enforced
- Tests pass (2-4 tests)

---

#### Task Group 2: BrokerKPIService Implementation
**Dependencies:** Task Group 1
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 2.0 Complete BrokerKPIService with Redis caching
  - [ ] 2.1 Write 3-6 focused tests for BrokerKPIService
    - Test KPI calculation for activeDeals
    - Test KPI calculation for commissionPipeline
    - Test responseRate calculation with trend
    - Test propertiesMatched calculation with trend
    - Test Redis cache hit/miss scenarios
    - Test cache invalidation logic
  - [ ] 2.2 Create BrokerKPIService class
    - Location: `/src/services/BrokerKPIService.ts`
    - Dependencies: Redis client, database connection
    - Cache key pattern: `broker-kpis:${userId}`
    - Cache TTL: 5 minutes (300 seconds)
  - [ ] 2.3 Implement calculateKPIs(userId: string) method
    - Calculate activeDeals: COUNT(*) FROM broker_deals WHERE broker_user_id = userId AND status NOT IN ('signed', 'lost')
    - Calculate commissionPipeline: SUM(estimated_commission) FROM broker_deals WHERE status IN ('touring', 'offer_submitted')
    - Calculate responseRate: Calculate from messages sent vs replied (similar to tenant dashboard)
    - Calculate propertiesMatched: COUNT of successful matches facilitated
  - [ ] 2.4 Implement trend calculation logic
    - Compare current value vs 7 days ago
    - Calculate percentage change
    - Determine direction: 'up', 'down', or 'neutral'
    - Format: { value: number, direction: string, period: "vs last week" }
  - [ ] 2.5 Implement cacheKPIs(userId: string, kpis: BrokerKPIData) method
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
  - [ ] 2.8 Run BrokerKPIService tests
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

#### Task Group 3: BrokerDashboardEventService Implementation
**Dependencies:** Task Group 2
**Priority:** Critical
**Estimated Time:** 5-7 hours

- [ ] 3.0 Complete BrokerDashboardEventService for WebSocket events
  - [ ] 3.1 Write 3-5 focused tests for event service
    - Test deal-created event emission
    - Test deal-updated event emission
    - Test demand-matched event emission
    - Test kpi-update event emission (via triggerKPIUpdate)
    - Test cache invalidation triggering
  - [ ] 3.2 Create BrokerDashboardEventService class
    - Location: `/src/services/BrokerDashboardEventService.ts`
    - Dependencies: WebSocket server (getDashboardSocket), BrokerKPIService
    - Follows same pattern as PropertyDashboardEventService
  - [ ] 3.3 Implement onDealCreated(brokerUserId, deal) method
    - Invalidate KPI cache for brokerUserId
    - Check if user is connected via WebSocket
    - Recalculate KPIs using BrokerKPIService
    - Emit broker:deal-created event
    - Emit broker:kpi-update event with new KPIs
  - [ ] 3.4 Implement onDealUpdated(brokerUserId, dealId, deal) method
    - Invalidate KPI cache for brokerUserId
    - Check if user is connected
    - Recalculate KPIs
    - Emit broker:deal-updated event
    - Emit broker:kpi-update event
  - [ ] 3.5 Implement triggerKPIUpdate(brokerUserId) method
    - Manually trigger KPI recalculation
    - Invalidate cache
    - Check if user is connected
    - Recalculate KPIs
    - Emit broker:kpi-update event
  - [ ] 3.6 Add WebSocket emission methods to DashboardSocketServer
    - Add emitBrokerDealCreated(brokerUserId, deal)
    - Add emitBrokerDealUpdated(brokerUserId, dealId, deal)
    - Add emitBrokerKPIUpdate(brokerUserId, kpis)
    - Location: `/src/websocket/dashboardSocket.ts`
  - [ ] 3.7 Run BrokerDashboardEventService tests
    - Run ONLY the 3-5 tests written in 3.1
    - Verify events emitted correctly
    - Verify cache invalidation triggered
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All event types can be emitted
- Events broadcast to correct WebSocket clients
- Cache invalidation triggered on mutations
- Tests pass (3-5 tests)
- Event payload format matches spec
- WebSocket methods added to DashboardSocketServer

---

#### Task Group 4: Broker API Endpoints
**Dependencies:** Task Groups 2-3
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 4.0 Complete broker dashboard API endpoints
  - [ ] 4.1 Write 4-7 focused tests for broker endpoints
    - Test GET /api/dashboard/broker/kpis returns KPIs only
    - Test GET /api/broker/profile returns broker profile
    - Test PUT /api/broker/profile updates profile
    - Test POST /api/broker/profile creates profile
    - Test GET /api/broker/demands returns tenant demands with pagination
    - Test GET /api/broker/properties returns properties with pagination
    - Test GET /api/broker/deals returns broker deals
  - [ ] 4.2 Create BrokerDashboardController.ts
    - Location: `/src/controllers/BrokerDashboardController.ts`
    - Dependencies: BrokerKPIService, broker profile model, deals model
    - Middleware: requireAuth, requireRole('BROKER')
  - [ ] 4.3 Implement getKPIs() controller method
    - GET /api/dashboard/broker/kpis
    - Get KPIs only from BrokerKPIService
    - Return: { kpis: BrokerKPIData }
    - Used for polling updates
  - [ ] 4.4 Implement getBrokerProfile() controller method
    - GET /api/broker/profile
    - Fetch broker profile by user_id
    - Return profile data or 404 if not found
  - [ ] 4.5 Implement updateBrokerProfile() controller method
    - PUT /api/broker/profile
    - Update existing broker profile
    - Validate input data
    - Return updated profile
  - [ ] 4.6 Implement createBrokerProfile() controller method
    - POST /api/broker/profile
    - Create new broker profile for user
    - Validate user has BROKER role
    - Return created profile
  - [ ] 4.7 Implement getTenantDemands() controller method
    - GET /api/broker/demands
    - Fetch paginated tenant demands/QFPs
    - Support query params: page, limit, location, type, minSqft, maxSqft
    - Return: { demands: DemandListing[], total, hasMore }
  - [ ] 4.8 Implement getProperties() controller method
    - GET /api/broker/properties
    - Fetch paginated property listings
    - Support query params: page, limit, location, type, minSqft, maxSqft
    - May reuse landlord endpoint logic
    - Return: { properties: PropertyListing[], total, hasMore }
  - [ ] 4.9 Implement getDeals() controller method
    - GET /api/broker/deals
    - Fetch broker's deals
    - Support filtering by status
    - Return paginated results
  - [ ] 4.10 Update existing /api/dashboard/broker endpoint
    - Enhance to return full dashboard data (not just basic info)
    - Include KPIs, recent deals, counts
    - Maintain backward compatibility
  - [ ] 4.11 Register new routes in brokerRoutes.ts or dashboardRoutes.ts
    - Define all new routes
    - Apply auth middleware
    - Mount routes properly
  - [ ] 4.12 Run broker API endpoint tests
    - Run ONLY the 4-7 tests written in 4.1
    - Verify endpoints return correct data structure
    - Verify authentication and authorization
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All API endpoints functional and return correct data
- Authentication and authorization enforced
- Pagination works for demands, properties, and deals
- KPI caching integrated correctly
- Tests pass (4-7 tests)
- Routes registered in main app

---

### Phase 2: Frontend Components

#### Task Group 5: Broker Dashboard Page & Layout
**Dependencies:** Task Group 4
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 5.0 Create BrokerDashboard page component
  - [ ] 5.1 Write 3-5 focused tests for BrokerDashboard
    - Test dashboard renders with KPIs
    - Test dual view toggle switches views
    - Test WebSocket connection established
    - Test loading and error states
    - Test navigation to broker profile
  - [ ] 5.2 Create BrokerDashboard.tsx file
    - Location: `/src/frontend/pages/BrokerDashboard.tsx`
    - Import necessary components and hooks
    - Set up state management (KPIs, view mode, loading, etc.)
  - [ ] 5.3 Create BrokerDashboard.module.css file
    - Location: `/src/frontend/pages/BrokerDashboard.module.css`
    - Use design tokens from design-tokens.css
    - Follow same layout pattern as landlord dashboard
  - [ ] 5.4 Implement initial data fetching
    - useEffect to fetch dashboard data on mount
    - Fetch KPIs, broker profile, initial demands/properties
    - Handle loading and error states
  - [ ] 5.5 Add route to App.tsx
    - Add route: `/broker-dashboard`
    - Element: <BrokerDashboard />
    - Wrap with ProtectedRoute
    - Add role check (BROKER only)
  - [ ] 5.6 Update navigation for broker users
    - TopNavigation should show appropriate links for brokers
    - Check if TopNavigation needs broker-specific menu items
  - [ ] 5.7 Run BrokerDashboard page tests
    - Run ONLY the 3-5 tests written in 5.1
    - Verify page renders correctly
    - Verify routing works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- BrokerDashboard page accessible at /broker-dashboard
- Page renders with loading state initially
- Error states handled gracefully
- Route protected (BROKER role required)
- Tests pass (3-5 tests)

---

#### Task Group 6: Broker KPI Cards
**Dependencies:** Task Group 5
**Priority:** Critical
**Estimated Time:** 4-5 hours

- [ ] 6.0 Implement broker KPI cards section
  - [ ] 6.1 Write 2-4 focused tests for BrokerKPISection
    - Test renders 4 KPI cards
    - Test displays correct values
    - Test loading skeleton displays during fetch
    - Test trend indicators show correct direction
  - [ ] 6.2 Create BrokerKPISection.tsx component
    - Location: `/src/frontend/components/BrokerDashboard/BrokerKPISection.tsx`
    - Reuse KPICard component from shared components
    - Display 4 cards: Active Deals, Commission Pipeline, Response Rate, Properties Matched
  - [ ] 6.3 Create BrokerKPISection.module.css
    - Use design tokens
    - Grid layout for 4 cards (2x2 on mobile, 1x4 on desktop)
  - [ ] 6.4 Integrate KPIs into BrokerDashboard
    - Pass KPI data from BrokerDashboard state
    - Handle loading state (show skeletons)
    - Update KPIs on WebSocket events
  - [ ] 6.5 Add trend indicators to KPI cards
    - Show up/down arrows with percentage
    - Green for positive trends, red for negative
    - "vs last week" period text
  - [ ] 6.6 Run BrokerKPISection tests
    - Run ONLY the 2-4 tests written in 6.1
    - Verify cards display correctly
    - Verify trends calculate properly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- 4 KPI cards render with correct data
- Trend indicators display correctly
- Loading skeletons work
- Responsive layout (mobile and desktop)
- Tests pass (2-4 tests)

---

#### Task Group 7: Dual View Toggle & Views
**Dependencies:** Task Group 6
**Priority:** Critical
**Estimated Time:** 6-8 hours

- [ ] 7.0 Implement dual view toggle and content switching
  - [ ] 7.1 Write 3-5 focused tests for dual view
    - Test DualViewToggle renders with both options
    - Test clicking toggle switches active view
    - Test Tenant View shows tenant demands
    - Test Landlord View shows property listings
    - Test view state persists across KPI updates
  - [ ] 7.2 Create DualViewToggle.tsx component
    - Location: `/src/frontend/components/BrokerDashboard/DualViewToggle.tsx`
    - Segmented control with two buttons
    - Active state styling (gray-700 background)
    - Icons: 👤 for Tenant, 🏢 for Landlord
  - [ ] 7.3 Create DualViewToggle.module.css
    - Use design tokens
    - Segmented control styling
    - Active/inactive states
    - Smooth transitions
  - [ ] 7.4 Implement view state management in BrokerDashboard
    - Add state: const [currentView, setCurrentView] = useState<'tenant' | 'landlord'>('tenant')
    - Pass to DualViewToggle component
    - Conditionally render content based on currentView
  - [ ] 7.5 Create TenantDemandsSection.tsx component
    - Location: `/src/frontend/components/BrokerDashboard/TenantDemandsSection.tsx`
    - List of tenant demands/QFPs
    - Display: business name, location, sqft, type, budget, match score
    - "Send QFP" button for each demand
    - Search and filter controls
  - [ ] 7.6 Create TenantDemandsSection.module.css
    - Use design tokens
    - Card or table layout
    - Responsive design
  - [ ] 7.7 Reuse PropertyListingsSection for Landlord View
    - Import PropertyListingsSection from landlord dashboard
    - May need to adjust for broker context
    - Fetch properties from /api/broker/properties
  - [ ] 7.8 Implement infinite scroll for both views
    - Tenant View: load more demands
    - Landlord View: load more properties
    - Use useInfiniteScroll hook
  - [ ] 7.9 Run dual view tests
    - Run ONLY the 3-5 tests written in 7.1
    - Verify toggle works
    - Verify views render correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Dual view toggle functional
- Clicking toggle switches between views
- Tenant View shows demands list
- Landlord View shows properties list
- Infinite scroll works in both views
- Tests pass (3-5 tests)

---

#### Task Group 8: Broker Profile Management
**Dependencies:** Task Group 4
**Priority:** High
**Estimated Time:** 4-5 hours

- [ ] 8.0 Implement broker profile modal
  - [ ] 8.1 Write 2-4 focused tests for BrokerProfileModal
    - Test modal opens and closes
    - Test form validates required fields
    - Test saving profile calls API
    - Test displays existing profile data
  - [ ] 8.2 Create BrokerProfileModal.tsx component
    - Location: `/src/frontend/components/BrokerDashboard/BrokerProfileModal.tsx`
    - Form fields: company_name, license_number, license_state, specialties, bio, website_url, years_experience
    - Validation for required fields
    - Submit handler
  - [ ] 8.3 Create BrokerProfileModal.module.css
    - Use design tokens
    - Modal styling matching other modals (QFP, EditBusiness, etc.)
    - Form grid layout
  - [ ] 8.4 Integrate profile modal into BrokerDashboard
    - Add "Edit Profile" button in header or settings menu
    - Open modal on button click
    - Fetch profile data when modal opens
    - Save profile on submit
  - [ ] 8.5 Handle profile creation vs. update
    - Check if profile exists (GET /api/broker/profile)
    - If exists: PUT /api/broker/profile
    - If not exists: POST /api/broker/profile
  - [ ] 8.6 Run BrokerProfileModal tests
    - Run ONLY the 2-4 tests written in 8.1
    - Verify modal works correctly
    - Verify form validation
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Broker profile modal opens and closes
- Form validates input
- Profile saves successfully
- Existing profile data pre-populated
- Tests pass (2-4 tests)

---

#### Task Group 9: WebSocket Integration
**Dependencies:** Task Groups 3, 5
**Priority:** Critical
**Estimated Time:** 5-6 hours

- [ ] 9.0 Integrate WebSocket into BrokerDashboard
  - [ ] 9.1 Write 2-4 focused tests for WebSocket integration
    - Test WebSocket connection established
    - Test KPI updates on broker:kpi-update event
    - Test deal list refreshes on broker:deal-created event
    - Test connection indicator shows correct status
  - [ ] 9.2 Create useBrokerDashboardWebSocket.ts hook
    - Location: `/src/frontend/hooks/useBrokerDashboardWebSocket.ts`
    - Connect to WebSocket on mount
    - Listen for broker-specific events
    - Return connection status and event handlers
  - [ ] 9.3 Implement WebSocket event listeners
    - Listen for: `broker:kpi-update`
    - Listen for: `broker:deal-created`
    - Listen for: `broker:deal-updated`
    - Listen for: `broker:demand-matched`
    - Listen for: `broker:property-matched`
  - [ ] 9.4 Implement auto-reconnection logic
    - Max reconnection attempts: 3
    - Exponential backoff: 1s, 2s, 4s
    - Fall back to polling after 3 failed attempts
  - [ ] 9.5 Create brokerPollingService.ts
    - Location: `/src/frontend/services/brokerPollingService.ts`
    - Poll GET /api/dashboard/broker/kpis every 30 seconds
    - Only poll when WebSocket is disconnected
  - [ ] 9.6 Integrate WebSocket hook into BrokerDashboard
    - Use useBrokerDashboardWebSocket hook
    - Handle KPI updates
    - Handle deal updates
    - Update connection indicator
  - [ ] 9.7 Run WebSocket integration tests
    - Run ONLY the 2-4 tests written in 9.1
    - Verify connection works
    - Verify events handled correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- WebSocket connects on dashboard mount
- All broker events handled correctly
- Auto-reconnection works (max 3 attempts)
- Polling fallback activates after failed reconnects
- Connection indicator accurate
- Tests pass (2-4 tests)

---

#### Task Group 10: Connection Indicator & Polish
**Dependencies:** Task Group 9
**Priority:** Medium
**Estimated Time:** 2-3 hours

- [ ] 10.0 Add connection indicator and final polish
  - [ ] 10.1 Reuse ConnectionIndicator component
    - Import ConnectionIndicator from shared components
    - Position in BrokerDashboard header
    - Pass connection status from WebSocket hook
  - [ ] 10.2 Add loading skeletons
    - KPI cards loading skeleton
    - Demands/properties list loading skeleton
    - Use existing skeleton patterns
  - [ ] 10.3 Add empty states
    - "No demands available" when Tenant View is empty
    - "No properties available" when Landlord View is empty
    - "Complete your broker profile" prompt
  - [ ] 10.4 Responsive design review
    - Test on mobile (320px - 480px)
    - Test on tablet (481px - 768px)
    - Test on desktop (769px+)
    - Adjust layouts as needed
  - [ ] 10.5 Accessibility review
    - Keyboard navigation works
    - Screen reader friendly
    - Focus states visible
    - ARIA labels where needed

**Acceptance Criteria:**
- Connection indicator visible and functional
- Loading skeletons display during fetch
- Empty states show appropriate messages
- Responsive on all screen sizes
- Accessible via keyboard and screen reader

---

### Phase 3: Testing & Integration

#### Task Group 11: End-to-End Testing & Bug Fixes
**Dependencies:** All previous task groups
**Priority:** High
**Estimated Time:** 6-8 hours

- [ ] 11.0 Complete end-to-end testing and fixes
  - [ ] 11.1 Write 3-5 E2E tests for broker dashboard
    - Test broker login → dashboard loads
    - Test broker views demands → switches to properties
    - Test broker edits profile → saves successfully
    - Test broker receives real-time KPI update
    - Test broker uses infinite scroll
  - [ ] 11.2 Manual testing checklist
    - Broker can log in and see dashboard
    - KPIs display with correct data
    - Dual view toggle works
    - Tenant demands load and display
    - Properties load and display
    - Profile modal works
    - WebSocket connection established
    - Real-time updates work
    - Infinite scroll works
    - Mobile responsive
  - [ ] 11.3 Fix any bugs discovered during testing
    - Document bugs
    - Fix critical bugs
    - Create tickets for non-critical bugs
  - [ ] 11.4 Run full test suite for broker dashboard
    - Run all tests from task groups 1-10
    - Expected total: approximately 35-50 tests
    - Verify all tests pass
    - Check test coverage (aim for >80% on new code)
  - [ ] 11.5 Performance testing
    - Test dashboard load time (<2 seconds)
    - Test KPI update latency (<500ms)
    - Test WebSocket reconnection (<3 seconds)
    - Test infinite scroll performance (<300ms per page)
  - [ ] 11.6 Documentation
    - Update README with broker dashboard info
    - Document API endpoints
    - Document WebSocket events
    - Add broker dashboard to user guide (if applicable)

**Acceptance Criteria:**
- All E2E tests pass (3-5 tests)
- Manual testing checklist completed
- Critical bugs fixed
- Full test suite passes (35-50 tests)
- Performance targets met
- Documentation updated

---

## Execution Order & Dependencies

### Recommended Implementation Sequence:

**Week 1: Backend Foundation**
1. Task Group 1: Database Schema & Migrations (Day 1)
2. Task Group 2: BrokerKPIService Implementation (Day 1-2)
3. Task Group 3: BrokerDashboardEventService Implementation (Day 2-3)
4. Task Group 4: Broker API Endpoints (Day 3-4)

**Week 2: Frontend Implementation**
5. Task Group 5: Broker Dashboard Page & Layout (Day 5-6)
6. Task Group 6: Broker KPI Cards (Day 6)
7. Task Group 7: Dual View Toggle & Views (Day 7-8)
8. Task Group 8: Broker Profile Management (Day 8-9)
9. Task Group 9: WebSocket Integration (Day 9-10)
10. Task Group 10: Connection Indicator & Polish (Day 10)

**Week 2: Testing & Polish**
11. Task Group 11: End-to-End Testing & Bug Fixes (Day 10-12)

### Parallel Execution Opportunities:
- Task Group 8 (Broker Profile) can run in parallel with Task Group 7 (Dual View)
- Frontend tests (Task Groups 5-10) can be written while backend is being implemented

---

## Critical Path

The following task groups are on the critical path and must be completed sequentially:

1. Task Group 1 (Database) → Task Group 2 (KPI Service) → Task Group 3 (Event Service) → Task Group 4 (API Endpoints) → Task Group 9 (WebSocket Integration)

Any delays in these groups will delay the entire project.

---

## Testing Strategy

### Test Distribution:
- **Unit Tests:** 15-25 tests (services, utilities, hooks)
- **Integration Tests:** 10-15 tests (API endpoints, WebSocket events, component integration)
- **E2E Tests:** 3-5 tests (critical user workflows)
- **Total:** 28-45 tests

### Test Focus Areas:
1. Broker KPI calculations
2. Dual view toggle functionality
3. WebSocket real-time updates
4. Infinite scroll pagination for demands and properties
5. Broker profile CRUD operations

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
- [ ] Broker Dashboard accessible at /broker-dashboard
- [ ] Real-time updates via WebSocket
- [ ] Polling fallback when WebSocket disconnected
- [ ] Connection indicator showing accurate status
- [ ] 4 KPI cards with trend indicators
- [ ] Dual view toggle (Tenant View | Landlord View)
- [ ] Tenant View shows demands/QFPs list
- [ ] Landlord View shows properties list
- [ ] Infinite scroll pagination for both views
- [ ] Broker profile modal functional
- [ ] KPIs cached in Redis (5-minute TTL)
- [ ] Cache invalidated on deal CRUD events

### Non-Functional Requirements
- [ ] Dashboard loads in <2 seconds
- [ ] KPI updates in <500ms
- [ ] WebSocket reconnects in <3 seconds
- [ ] Mobile responsive (320px - 1920px)
- [ ] Tests pass (28-45 total tests)
- [ ] Test coverage >80% on new code

### Code Quality
- [ ] TypeScript types defined for all interfaces
- [ ] Error handling implemented for all async operations
- [ ] Loading states implemented for all data fetches
- [ ] WebSocket cleanup on component unmount
- [ ] No console errors in browser
- [ ] Code follows existing patterns in codebase

---

## Conflicts with Existing Plans

### ✅ No Major Conflicts Identified
The Broker Dashboard implementation:
- **Reuses** existing patterns from Tenant and Landlord dashboards
- **Follows** the same design system (design tokens)
- **Leverages** existing WebSocket infrastructure
- **Maintains** consistency with other dashboards

### Key Differences:
- **Dual View**: Unique to brokers - allows switching between tenant demands and property listings
- **Deals Tracking**: New feature specific to brokers (Phase 2 or future work)
- **Commission Metrics**: Broker-specific KPIs not present in other dashboards

---

**End of Task Breakdown**
