# Specification: Tenant Dashboard

## Goal
Build a comprehensive tenant dashboard that serves as the primary interface for tenant users, displaying real-time KPIs, business listings management with two-level hierarchy (Business Listings and Demand Listings), and providing role-based access to property search and proposal tracking features.

## User Stories
- As a tenant user, I want to view my business portfolio performance metrics in real-time so that I can track engagement and optimize my property search strategy
- As a tenant user, I want to manage multiple business listings and their associated location-specific demand requirements so that I can efficiently organize expansion plans across different brands and markets

## Specific Requirements

**Dashboard Authentication & Access Control**
- Dashboard route protected by JWT-based authentication middleware verifying tokens from httpOnly cookies or Authorization header
- Role-based access restricted to users with role='tenant' using RoleGuard.require('tenant') middleware
- All tenants must complete full business profile flow before accessing dashboard (enforced by profile_completed boolean flag in user_profiles table)
- JWT token validation on every API request with automatic refresh using RefreshTokenService when access token expires
- WebSocket connections authenticated using JWT extracted from cookies or handshake auth token
- Unauthorized access returns 401 response, forbidden role access returns 403 with clear error messaging
- TokenBlacklistService checks prevent access using revoked tokens

**Real-Time Performance KPI Cards**
- Display 4 KPI cards in horizontal row at top of dashboard: Active Businesses, Response Rate, Landlord Views, Messages Total
- KPIs calculated from aggregated business metrics using KPIService.calculateDashboardKPIs with Redis caching (5-minute TTL)
- WebSocket real-time updates via Socket.io /dashboard namespace using DashboardSocketServer with user-specific rooms (user:{userId})
- Listen for kpi:update events to refresh displayed metrics without page reload
- Graceful fallback to HTTP polling (30-second interval) if WebSocket connection fails or disconnects
- Zero-state handling displays "0" for counts and "0%" for percentages when no data exists
- Landlord Views KPI grayed out with "Upgrade to Pro" badge for Starter tier users (view tracking is Pro/Premium feature)
- Cache invalidation triggers on business/metrics changes via DashboardEventService emitting WebSocket events

**Two-Level Business Data Hierarchy**
- Top level: Business Listings representing companies/brands stored in businesses table (e.g., Starbucks, Ceviche House)
- Nested level: Demand Listings (QFPs) representing specific location requirements stored in demand_listings table with business_id foreign key
- Each business can have multiple demand listings for different cities/locations (e.g., McDonald's with 50 locations = 1 business + 50 demand listings)
- Business cards display aggregated counts from related data: Listings (demand_listings count), States (distinct states count), Invites (business_invites count)
- Dashboard displays Business Listings as primary grid view, demand listings accessed via "Manage Locations" drill-down navigation
- Database schema enforces CASCADE delete: deleting business removes all associated demand listings and metrics

**Business Card Components**
- Business logo/image displayed at card top from logo_url field, lazy loaded with loading="lazy" attribute
- Business name displayed as prominent heading with category badge next to it (e.g., "F&B", "Retail", "Office")
- Status badge with color coding using StatusBadge component: Active (green #28A745), Pending Verification (yellow #FFC107), Stealth Mode (gray #6C757D)
- Three metric badges displayed in horizontal row using MetricBadge component: Listings count, States count, Invites count
- Three-dot menu icon (ThreeDotsMenu component) with dropdown options: Stealth mode toggle, Edit Business, Delete Business
- Two action buttons at card bottom: "View Performance" (primary blue button), "Manage Locations" (secondary gray button)
- Unverified businesses (is_verified=false) show WarningBanner component: "Business visibility is restricted until verification is complete"
- Card click handler navigates to Business Detail View at route /dashboard/business/:id

**Search & Filter Controls**
- Status filter dropdown (FilterDropdown component) positioned in controls bar with options: All Status, Active, Pending Verification, Stealth Mode
- Client-side filtering by status using useBusinessFilter custom hook maintaining filter state
- Search input field (SearchInput component) filters businesses by name with 300ms debounce using lodash.debounce
- Backend search uses PostgreSQL ILIKE query in BusinessModel.searchByName for case-insensitive matching
- Real-time filtering updates business grid as user types without page reload
- Filter and search state persisted in URL query parameters (?status=active&search=starbucks) for deep linking and browser back/forward navigation
- Section header updates count dynamically: "Your Business Listings (5)" based on filtered results

**Infinite Scroll Pagination**
- Initial load fetches first 20 businesses using BusinessModel.findByUserIdPaginated(userId, 20, 0)
- Intersection Observer API monitors scroll position and triggers load when user scrolls within 200px of bottom
- Next page fetch uses offset parameter: page 2 loads businesses 21-40, page 3 loads 41-60, etc.
- Loading indicator displays at grid bottom during data fetch showing spinner and "Loading more businesses..." text
- End-of-list state shows "No more businesses to load" message when businesses.length >= total count
- Virtual scrolling optimization using react-window library if business count exceeds 100 to maintain performance
- Smooth scroll behavior with skeleton loader cards (BusinessCardSkeleton component) as placeholders during fetch

**Top Navigation Bar**
- Left: "zyx" logo component linking to /dashboard route
- Center: Primary navigation tabs (Dashboard, Trends, Proposals) with active state styling using CSS class .active
- Dashboard tab has active state, Trends and Proposals show as clickable but route to placeholder pages
- Right section: Tier badge displays current subscription from user_profiles.subscription_tier (e.g., "Free Plan", "Pro", "Premium", "Enterprise")
- "Add Business" primary CTA button (blue background) opens AddBusinessModal component (placeholder action in MVP)
- Settings icon opens dropdown menu with options: Account Settings, Notification Preferences, Billing (all route to placeholders)
- "Go to Profile" link navigates to /profile route showing user profile page (placeholder in MVP)
- Responsive hamburger menu icon displays on mobile viewports (<768px) collapsing navigation to slide-out drawer

**WebSocket Real-Time Updates**
- Socket.io client connection established to /dashboard namespace on Dashboard component mount using useDashboardWebSocket hook
- User-specific room subscription via socket.join(user:{userId}) for targeted event delivery preventing cross-user data leaks
- Event listeners registered: kpi:update (refresh KPI cards), business:created (add card to grid), business:updated (update card data), business:deleted (remove card from grid), metrics:updated (refresh specific business metrics)
- Exponential backoff reconnection strategy on disconnect: 1s delay, then 2s, 4s, 8s, 16s max delay with 5 max attempts
- Connection state indicator in top-right corner: green dot (connected), red dot (disconnected), yellow pulsing dot (reconnecting)
- Automatic state reconciliation on reconnect by emitting request:current-state event triggering full dashboard data refresh
- Clean disconnect on component unmount calling socket.disconnect() to prevent memory leaks and orphaned connections

**Tier-Based Feature Gating**
- Starter tier ($0/month): View dashboard, manage up to 2 businesses, basic KPIs except view tracking, no match percentages
- Pro tier ($99/month): Aggregated view tracking data, Kanban board access, performance funnel analytics, comparison of 2 properties
- Premium tier ($199/month): Detailed view tracking with landlord profile visibility, video uploads (15-second clips), comparison of 3 properties, advanced heatmaps
- Enterprise tier ($999/month): Full audit logs, stealth mode toggle functionality, API access, white-label options, dedicated support
- Grayed-out locked features display upgrade prompts via TierGateModal component showing tier pricing comparison table
- Feature gating enforced on both frontend (UI elements disabled/hidden) and backend (API endpoints return 403 if insufficient tier)
- Tier verification uses subscription_tier field from user_profiles table checked in middleware

**Business Detail View (Placeholder)**
- Business selector dropdown at top switches between user's multiple businesses maintaining selected business in URL parameter
- Location tabs display each demand listing city horizontally (e.g., Miami, NYC, Buffalo) with active tab styling
- Performance funnel visualization structure displays conversion metrics: Views → Clicks → Property Invites → Declined → Messages → QFPs Submitted with percentages
- Match percentage displays "N/A" text until matching algorithm implementation (roadmap item #3)
- Tab routing structure: /dashboard/business/:businessId/location/:locationId for deep linking to specific location analytics
- Breadcrumb navigation: Dashboard > Business Name > Location Name with clickable links for quick navigation

**Placeholder Pages**
- Trends Page: Market insights dashboard route /dashboard/trends with "Coming Soon" heading and description of future vacancy rates, absorption trends charts
- Proposals Page: Kanban deal pipeline route /dashboard/proposals showing placeholder for stages: Favorites → To Tour → Offer → Signed (roadmap item #10)
- Settings Page: Route /settings with placeholder sections for Account, Notifications, Team, Billing
- Profile Page: Route /profile with placeholder for user profile editing and photo upload functionality
- All tabs navigation functional with routing but components display "This feature is coming soon" message with expected tier availability

**Database Schema Requirements**
- businesses table: id (UUID PK), user_id (UUID FK to users), name (VARCHAR 255), logo_url (VARCHAR 500 nullable), category (VARCHAR 50), status (ENUM active/pending_verification/stealth_mode), is_verified (BOOLEAN default false), stealth_mode_enabled (BOOLEAN default false), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- demand_listings table: id (UUID PK), business_id (UUID FK to businesses CASCADE), location_name (VARCHAR 255), city (VARCHAR 100), state (VARCHAR 50), address (TEXT nullable), sqft_min (INTEGER nullable), sqft_max (INTEGER nullable), budget_min (DECIMAL nullable), budget_max (DECIMAL nullable), asset_type (VARCHAR 50), requirements (JSONB for additional fields), match_percentage (VARCHAR default "N/A"), status (ENUM active/pending/closed), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- business_metrics table: id (UUID PK), business_id (UUID FK to businesses CASCADE), demand_listing_id (UUID FK to demand_listings nullable), metric_date (DATE), views_count (INTEGER default 0), clicks_count (INTEGER default 0), property_invites_count (INTEGER default 0), declined_count (INTEGER default 0), messages_count (INTEGER default 0), qfps_submitted_count (INTEGER default 0), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- business_invites table: id (UUID PK), business_id (UUID FK to businesses CASCADE), invited_by_user_id (UUID FK to users), invited_user_email (VARCHAR 255), status (ENUM pending/accepted/declined), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- Indexes: CREATE INDEX idx_businesses_user_id ON businesses(user_id); CREATE INDEX idx_demand_listings_business_id ON demand_listings(business_id); CREATE INDEX idx_business_metrics_business_id ON business_metrics(business_id)

**API Endpoints**
- GET /api/dashboard/tenant: Returns DashboardData object with kpis (DashboardKPIs) and businesses array (Business[]) and total count, uses DashboardController.getTenantDashboard
- GET /api/businesses?page=1&limit=20&status=active&search=starbucks: Paginated business listings with filters, returns {businesses: Business[], total: number, page: number, limit: number}
- GET /api/businesses/:id: Business detail returns Business object with aggregated metrics and demand_listings_count
- GET /api/businesses/:id/demand-listings: Returns DemandListing[] array for specific business
- GET /api/businesses/:id/locations/:locationId/metrics: Returns location-specific BusinessMetrics with funnel data
- GET /api/profile: Returns User and UserProfile data for top navigation tier badge and profile dropdown
- WebSocket ws://localhost:PORT/socket.io/?EIO=4&transport=websocket namespace /dashboard with events: kpi:update, business:created, business:updated, business:deleted, metrics:updated

**Responsive Design Breakpoints**
- Desktop (1200px+): KPI cards 4-column grid using CSS Grid (grid-template-columns: repeat(4, 1fr)), business cards 3-column grid (repeat(3, 1fr))
- Tablet (768px-1199px): KPI cards 2x2 grid (repeat(2, 1fr)), business cards 2-column grid (repeat(2, 1fr))
- Mobile (<768px): KPI cards stacked vertically (grid-template-columns: 1fr), business cards single column (1fr)
- Touch-friendly minimum button size 44x44px on mobile devices for accessibility
- Navigation collapses to hamburger menu icon with slide-out drawer animation
- Font scaling uses rem units (1rem = 16px base) for accessibility and user preferences respect

**Error Handling & Loading States**
- API error states display toast notifications using react-toastify with retry button triggering refetch
- Network failure triggers automatic retry with exponential backoff (3 attempts max with 1s, 2s, 4s delays)
- WebSocket disconnection shows persistent banner at top: "Connection lost. Reconnecting..." with dismiss button
- Empty state when no businesses displays EmptyState component: "Get started by adding your first business" with "Add Business" CTA button
- Skeleton loader cards (BusinessCardSkeleton component) during initial data fetch showing pulsing gray rectangles
- Error boundary component (ErrorBoundary) catches React rendering errors and displays fallback UI with "Something went wrong" message and reload button

**Performance Optimizations**
- React.memo wraps KPICard and BusinessCard components preventing re-renders when props unchanged
- Debounced search input (300ms) using useDebouncedValue custom hook or lodash.debounce function
- Image lazy loading for business logos using loading="lazy" attribute and Intersection Observer polyfill
- Code splitting: Dashboard page lazy loaded with React.lazy and Suspense showing loading spinner during chunk load
- Redis caching for KPI calculations (5-minute TTL) reduces database load from repeated calculations
- PostgreSQL query optimization with composite indexes on (user_id, status, created_at) for filtered queries
- Gzip/Brotli compression for API responses configured in nginx reverse proxy
- Bundle size optimization using tree-shaking, minification, and splitting vendor chunks

**Accessibility (WCAG AA Compliance)**
- Semantic HTML structure: <header>, <main>, <nav>, <section>, <article> elements for screen reader navigation
- ARIA labels on all interactive elements: buttons (aria-label), links (aria-label), form controls (aria-labelledby)
- Keyboard navigation support: Tab (focus next), Shift+Tab (focus previous), Enter (activate), Escape (close modals)
- Focus indicators with 3px solid blue (#1E90FF) outline on all focusable elements visible when :focus-visible
- Screen reader announcements for KPI updates using aria-live="polite" region updating with new values
- Color contrast ratios minimum 4.5:1 for text on backgrounds, 3:1 for UI components like buttons and badges
- Skip to main content link visible on keyboard focus allowing bypass of navigation

**Security Measures**
- CSRF protection via CsrfService double-submit cookie pattern on POST/PUT/DELETE endpoints
- Rate limiting: 100 requests per 15 minutes per user IP on dashboard endpoints using RateLimitService
- Input sanitization for search queries escaping special characters to prevent SQL injection
- XSS prevention via React's automatic escaping and DOMPurify library sanitizing user-generated content before rendering
- JWT tokens stored in httpOnly secure sameSite=strict cookies preventing JavaScript access and CSRF attacks
- Content Security Policy headers: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
- HTTPS enforcement in production (FORCE_HTTPS=true) redirecting HTTP to HTTPS

## Visual Design

**`planning/visuals/DemandCRE-design.pdf`**
- Brand identity: "zyx" logo in modern sans-serif typeface (Inter or similar) with clean minimalist aesthetic
- Primary color: Blue (#1E90FF or #007BFF) for CTAs, links, active states, and primary buttons
- Secondary colors: Gray scale (#F8F9FA light backgrounds, #6C757D neutral elements, #212529 text)
- Status badge colors: Green (#28A745) for Active, Yellow (#FFC107) for Pending Verification, Gray (#6C757D) for Stealth Mode
- Card-based layout with white (#FFFFFF) backgrounds, subtle drop shadows (box-shadow: 0px 2px 8px rgba(0,0,0,0.1)), 8px border-radius
- KPI cards display large metric value (font-size: 48px, font-weight: 700) with label below (font-size: 14px, font-weight: 400, color: #6C757D)
- Business cards use vertical layout with 16px padding, 24px gap between grid items
- Typography hierarchy: Page title (32px bold), Section headers (24px semibold), Card headers (18px semibold), Body text (16px regular), Small text (14px regular)

## Existing Code to Leverage

**Business Model (src/database/models/Business.ts)**
- CRUD operations with proper error handling: create, findById, findByUserId, findByUserIdPaginated, update, delete methods
- Pagination support with total count in findByUserIdPaginated returning {businesses: Business[], total: number}
- Search functionality in searchByName using PostgreSQL ILIKE for case-insensitive filtering
- Status filtering in findByUserIdAndStatus for business card grid filtering by status
- Active business count in countActiveBusinesses for KPI card calculation
- Reuse these methods in BusinessController for API endpoints serving dashboard data

**User Model (src/database/models/User.ts)**
- User authentication queries: findByEmail for login, findById for profile data
- Email verification flow with setEmailVerificationToken and verifyEmail methods
- Last login timestamp tracking via updateLastLogin for analytics
- Role-based access using role field (tenant, landlord, broker) for RoleGuard middleware
- Leverage these methods for dashboard authentication and user profile display in top navigation

**KPI Service (src/services/KPIService.ts)**
- Redis caching with 5-minute TTL (cacheTTL: 300) for dashboard KPI calculations reducing database load
- Aggregated metrics calculation in calculateKPIs fetching from BusinessMetricsModel.aggregateByUserId
- Response rate calculation algorithm: (messages/invites * 100) capped at 100% rounded to 1 decimal
- Cache invalidation methods: invalidateCache for single user, invalidateCacheForUsers for bulk invalidation
- Fallback to direct calculation if Redis unavailable handling errors gracefully
- Use this service in DashboardController.getTenantDashboard and listen to WebSocket kpi:update events

**Dashboard WebSocket Server (src/websocket/dashboardSocket.ts)**
- Socket.io /dashboard namespace with JWT authentication via authenticateSocket middleware
- User-specific room subscription pattern: socket.join(user:{userId}) for targeted message delivery
- Event emission methods: emitKPIUpdate, emitBusinessCreated, emitBusinessUpdated, emitBusinessDeleted, emitMetricsUpdated
- Connection state management with handleConnection binding and disconnect event logging
- Cookie-based token extraction with fallback to handshake.auth.token or handshake.query.token
- Integrate this WebSocket server with useDashboardWebSocket hook on frontend establishing connection on Dashboard mount

**Authentication Middleware (src/middleware/authMiddleware.ts)**
- JWT token verification from httpOnly cookies (req.cookies.accessToken) or Authorization header as fallback
- Token blacklist checking via TokenBlacklistService.isBlacklisted preventing revoked token usage
- Automatic token refresh using RefreshTokenService.rotateRefreshToken when access token expires
- Role-based authorization via RoleGuard.require('tenant') middleware checking req.user.role
- Request object extension with user data: req.user = {userId, email, role} for controller access
- Apply AuthMiddleware and RoleGuard to all dashboard routes protecting against unauthorized access

**Business Card Component (src/frontend/components/BusinessCard.tsx)**
- Reusable React.FC component accepting BusinessCardProps interface: business, onEdit, onDelete, onAddLocations, onVerify, onClick handlers
- StatusBadge and CategoryBadge subcomponents rendering with appropriate styling based on status/category props
- Action button handlers with event.stopPropagation preventing card click when buttons clicked
- WarningBanner component conditionally rendered when business.is_verified === false
- ARIA labels for accessibility: aria-label={`Business: ${business.name}`} on article element
- Extend this component to match updated design with three-dot menu and updated action buttons layout

## Out of Scope
- Full CRUD operations for business creation, editing, deletion (buttons present but show "Coming soon" modal)
- Stealth mode toggle functionality in three-dot menu (menu option visible but disabled with tooltip explaining Enterprise tier requirement)
- Manage Locations button functionality (placeholder action showing "Coming soon" modal)
- Add Business CTA functionality (button present but opens modal explaining feature coming soon)
- Profile editing and photo upload interface (link routes to placeholder page with "Profile editing coming soon")
- Settings page full implementation with account, notification, team, billing sections (icon routes to placeholder)
- Trends page with market insights data visualization using D3.js or Recharts (tab routes to placeholder)
- Proposals page Kanban board with drag-and-drop functionality (tab routes to placeholder)
- Business Detail View full implementation with real performance data and funnel visualization (structure and routing only)
- Performance metrics calculations beyond basic aggregation (funnel conversion rates, trend analysis)
- Messaging system UI integration (Messages Total KPI displays count but no chat interface or message threads)
- Demand listing CRUD operations (POST /api/businesses/:id/demand-listings, PUT, DELETE endpoints)
- Location-specific analytics drill-down beyond placeholder structure (no real data calculations)
- Property matching algorithm implementation replacing "N/A" placeholder (roadmap item #3)
- LOI submission functionality in Document Vault (roadmap item #29)
- View tracking implementation for Pro/Premium tiers (Landlord Views shows 0 for Starter with upgrade prompt)
- Advanced analytics charts and data visualizations (D3.js/Recharts integration deferred)
- Notification system for match alerts, messages, tour reminders (notification preferences placeholder only)
- Calendar integration for tour scheduling (roadmap item #11)
- Team collaboration features with invitation system and role management (roadmap item #9)
- Subscription tier upgrade flow and Stripe payment integration (roadmap item #6)
- Email notification templates for transactional emails (roadmap item #7)
- Mobile app considerations and React Native implementation (web only)
- Multi-language support (i18n/internationalization)
- Dark mode theme toggle (light theme only)
- Export functionality for reports and data downloads
- Bulk operations on multiple businesses (select all, bulk delete, bulk status update)
