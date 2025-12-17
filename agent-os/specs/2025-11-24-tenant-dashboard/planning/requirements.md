# Spec Requirements: Tenant Dashboard

## Initial Description
Build a comprehensive tenant dashboard that serves as the primary interface for tenant users after authentication. The dashboard will display key performance metrics, business listings management, and location-specific analytics. Implementation will follow a phased approach starting with Starter tier features, with clear visual indicators for premium tier-gated functionality.

## Requirements Discussion

### First Round Questions

**Q1: Should we implement the full dashboard with all tier features at once, or take an iterative approach starting with Starter tier?**
**Answer:** Start with Starter tier first (iterative approach)

**Q2: For the dashboard layout, should we follow the exact design from the Figma PDF or do you want to propose layout alternatives?**
**Answer:** Follow the design from the Figma PDF

**Q3: How should we handle tier gating - should premium features be completely hidden or shown as "locked" with upgrade prompts?**
**Answer:** Show locked features grayed out with upgrade prompts

**Q4: For the business listings data loading, should we implement pagination, infinite scroll, or load all at once?**
**Answer:** Infinite scroll, 20 properties per page

**Q5: Should the performance KPI cards update in real-time via WebSockets or refresh on page load/periodic polling?**
**Answer:** WebSocket connections for real-time updates

**Q6: What's the scope for this initial dashboard implementation - just the view, or include full CRUD operations for businesses and locations?**
**Answer:** Create dashboard with placeholders for future features. Tenant user should be able to login and access the dashboard page. Will continue with additional features later.

**Q7: Are there existing frontend components in your codebase we should reference or reuse?**
**Answer:** No frontend components exist yet (backend only)

**Q8: Do you have design mockups or wireframes to guide development?**
**Answer:** Design specified in `/home/anti/Documents/tenantlist/docs/DemandCRE.pdf`

### Follow-up Questions

**Follow-up 1: For the tenant onboarding flow, should all tenants complete the full business profile creation (company name, industry, locations) before accessing the dashboard, or can they skip and complete later?**
**Answer:** All tenants must complete full business profile flow before accessing the dashboard.

**Follow-up 2: The roadmap mentions "QFPs" (Qualified Facility Profiles). Should these be managed at the Business level or at the Location level? In other words, does each business have one QFP, or does each location within a business have its own QFP?**
**Answer:** Two-level system:
- Business Listings (top level) - the company/brand
- Demand Listings (nested under each business) - specific location requirements/QFPs
- Each business can have multiple demand listings
- Dashboard shows Business Listings as cards, each card displays count of demand listings underneath

**Follow-up 3: For the dashboard UI flow between Business Listings and Demand Listings, should we show Business Listings as the primary view with a way to drill down into each business's Demand Listings, or display both levels simultaneously?**
**Answer:** Show Business Listings in a card grid view, where each card represents a business and displays:
- Business logo/image
- Business name
- Counts for: "Listings" (demand listings count), "States" (geographic spread), "Invites" (invitation count)
- Menu options: Stealth mode, Edit Business, Delete Business
- Bottom buttons: "View Performance", "Manage Locations"

This matches the layout shown in the user-provided screenshot.

**Follow-up 4: For the matching algorithm, should we display placeholder match percentages (e.g., "85% match") in the initial implementation, or wait until the actual algorithm is built?**
**Answer:** Show "N/A" for match percentages until the algorithm is built.

**Follow-up 5: The roadmap mentions "LOI" (Letter of Intent) features in the Document Vault. Should LOI functionality be available to all tiers, or gated to Pro/Premium?**
**Answer:** LOI available to all tiers (Starter included).

**Follow-up 6: For the messaging system implementation, should we build it using the Stream API mentioned in the roadmap, or use a simpler internal system for MVP?**
**Answer:** Use simple internal messaging system (NOT Stream API). Stream API migration is scheduled for later optimization phase.

**Follow-up 7: The roadmap mentions "Page View Tracking" as an Enterprise feature. Should view tracking be completely unavailable for lower tiers, or should lower tiers see aggregate/anonymized view data?**
**Answer:** View tracking available on Pro/Premium tiers only:
- Pro tier: Aggregated view data
- Premium tier: Detailed view data with profile visibility
- Enterprise tier: Full tracking with audit logs
- Starter tier: No view tracking

**Follow-up 8: For the Kanban deal pipeline tab, the design shows "Applications" as a tab name. Should we use "Applications", "Proposals", or "Deal Pipeline" as the label?**
**Answer:** Use "Proposals" as the tab name.

**Follow-up 9: When a tenant has multiple locations for one business (e.g., McDonald's with 50 locations), should each location be a separate listing in the system, or one business listing with location metadata?**
**Answer:** Multi-location = separate demand listings under one business. Each location gets its own demand listing with specific requirements.

### Existing Code to Reference

**Similar Features Identified:**
No similar existing features identified for reference. This is the first frontend implementation for the platform.

**Backend Foundation:**
- Authentication system with JWT and role-based access control exists
- User profiles with role selection (Tenant/Landlord/Broker) implemented
- PostgreSQL database with user accounts and sessions

## Visual Assets

### Files Provided:
- `DemandCRE-design.pdf`: Complete Figma design export showing all dashboard layouts, component specifications, and user flows (51.7MB file copied to visuals folder for reference)

### Visual Insights:

**Fidelity Level:** High-fidelity design mockup with complete specifications

**Design System Elements:**
- Brand name: "zyx" with clean, modern typography
- Color scheme: Professional with blue accents for primary actions, gray for secondary elements
- Status badges: Color-coded (green for "Active", yellow for "Pending Verification", neutral for "Stealth mode")
- Category badges: Industry-specific tags (e.g., "F&B" for Food & Beverage)

**Layout Structure:**

1. **Top Navigation Bar:**
   - Left: "zyx" logo
   - Center: Primary navigation tabs ("Dashboard", "Trends", "Proposals")
   - Right: Tier badge ("Free Plan"), "Add Business" CTA button, Settings icon, "Go to Profile" link
   - Active tab styling: "Dashboard" shown as selected state

2. **Dashboard Home View:**
   - Page header: "Tenant Dashboard" title
   - Subtitle: "Manage your space requirements and track proposals"
   - 4-card KPI row displaying key metrics horizontally
   - Business listings section with filtering and search controls
   - Grid layout for business cards with action buttons

3. **Performance KPI Cards (4 cards in row):**
   - Active Businesses: Count of user's active business listings
   - Response Rate: Percentage metric for landlord responses
   - Landlord Views: Total views on user's business profiles
   - Messages Total: Count of messages received/sent

4. **Business Listings Section:**
   - Section header: "Your Business Listings ([count])"
   - Controls bar: Status filter dropdown ("All Status") + Search input field
   - Business cards displayed in responsive grid
   - Each card shows: Business logo, Business name, Metrics (Listings count, States count, Invites count), Menu options, Action buttons
   - Empty state: "No Active Listings" message with instructional text

5. **Business Card Components (Updated based on screenshot):**
   - Business logo/image (top)
   - Business name (prominent heading)
   - Three metric badges in a row:
     - "Listings" count (number of demand listings under this business)
     - "States" count (geographic spread)
     - "Invites" count (invitation count)
   - Three-dot menu icon with options:
     - Stealth mode toggle
     - Edit Business
     - Delete Business
   - Bottom row with two buttons:
     - "View Performance" (primary action)
     - "Manage Locations" (secondary action)

6. **Business Detail View (Separate view when business selected):**
   - Business selector dropdown at top (switch between multiple businesses)
   - Location tabs (e.g., "Miami", "NYC", "Buffalo")
   - Performance metrics funnel visualization showing:
     - Views: [number]
     - Clicks: [number] ([percentage]%)
     - Property Invites: [number] ([percentage]%)
     - Declined: [number] ([percentage]%)
     - People messaged: [number] ([percentage]%)
     - QFP's submitted: [number] ([percentage]%)

7. **Profile Creation Page (Referenced in PDF):**
   - Profile photo upload component (320x320px, JPG/PNG/GIF, max 10MB)
   - First Name field
   - Last Name field
   - Contact information section
   - Instructional note: "Create your personal profile, you will then be able to create your business profile"

**User Flow Patterns:**
- All tenants must complete full business profile flow before accessing dashboard
- Dashboard serves as main hub after login
- Users can create/manage multiple businesses from dashboard
- Each business can have multiple demand listings (locations)
- Location-specific metrics available via tabs on business detail view
- Profile creation is prerequisite to business creation
- Two-level hierarchy: Business Listings → Demand Listings

**Component Hierarchy:**
```
Dashboard (Main Container)
├── TopNavigation
│   ├── Logo
│   ├── NavigationTabs (Dashboard, Trends, Proposals)
│   ├── TierBadge
│   ├── AddBusinessButton
│   ├── SettingsIcon
│   └── ProfileLink
├── DashboardHeader
│   ├── Title
│   └── Subtitle
├── PerformanceKPIs
│   ├── KPICard (Active Businesses)
│   ├── KPICard (Response Rate)
│   ├── KPICard (Landlord Views)
│   └── KPICard (Messages Total)
└── BusinessListingsSection
    ├── SectionHeader
    ├── ControlsBar
    │   ├── StatusFilter
    │   └── SearchInput
    └── BusinessGrid
        ├── BusinessCard (repeated)
        │   ├── BusinessLogo
        │   ├── BusinessName
        │   ├── MetricBadges (Listings, States, Invites)
        │   ├── MenuOptions (Stealth mode, Edit, Delete)
        │   └── ActionButtons (View Performance, Manage Locations)
        └── EmptyState (conditional)
```

## Requirements Summary

### Functional Requirements

**Core Dashboard Functionality (Starter Tier):**

1. **Authentication & Access:**
   - Tenant users must authenticate to access dashboard
   - Dashboard is role-specific (only visible to users with "Tenant" role)
   - Dashboard is the landing page after successful login for tenant users
   - All tenants must complete full business profile flow before accessing dashboard

2. **Performance KPI Display:**
   - Display 4 real-time KPI cards in horizontal row:
     - Active Businesses: Count of user's business listings
     - Response Rate: Percentage of landlord responses to tenant inquiries
     - Landlord Views: Total profile/listing views from landlords (Pro/Premium only)
     - Messages Total: Aggregate message count
   - KPIs update in real-time via WebSocket connections
   - Handle zero-state gracefully (display "0" or appropriate empty values)

3. **Business Listings Management (Two-Level System):**
   - **Business Listings** (top level): Represents companies/brands
   - **Demand Listings** (nested): Specific location requirements/QFPs under each business
   - Display all businesses owned by authenticated user
   - Show business count in section header
   - Each business card displays:
     - Business logo/image
     - Business name
     - Metric badges:
       - "Listings" count (number of demand listings)
       - "States" count (geographic spread)
       - "Invites" count (invitation count)
     - Three-dot menu with options:
       - Stealth mode toggle
       - Edit Business
       - Delete Business
     - Action buttons:
       - "View Performance" (primary)
       - "Manage Locations" (secondary)
   - Empty state when no businesses: "No Active Listings" with instructional text

4. **Search & Filter Controls:**
   - Status filter dropdown: "All Status" default, filters by business status
   - Search input: Filter businesses by name (client-side search)
   - Real-time filtering as user types

5. **Infinite Scroll Implementation:**
   - Load 20 businesses per page initially
   - Implement infinite scroll to load additional businesses as user scrolls
   - Loading indicator when fetching more data
   - Handle end-of-list state

6. **Top Navigation:**
   - Display "zyx" logo (left side)
   - Primary navigation tabs: Dashboard (active), Trends, Proposals
   - User tier badge: Display current subscription tier (e.g., "Free Plan")
   - "Add Business" primary CTA button
   - Settings icon (opens settings menu)
   - "Go to Profile" link

7. **Placeholders for Future Features:**
   - Business Detail View: When "View Performance" clicked, show placeholder view with business selector dropdown and location tabs
   - Performance Funnel: Display placeholder metrics structure (Views → Clicks → Invites → Messages → QFPs)
   - "Manage Locations" button: Wire up to show "Coming soon" or navigate to placeholder
   - Trends Page: Tab exists but routes to placeholder
   - Proposals Page: Tab exists but routes to placeholder (Kanban deal pipeline)
   - Matching algorithm: Display "N/A" for match percentages until algorithm is built

8. **Multi-Location Management:**
   - Each business can have multiple demand listings (locations)
   - Each location = separate demand listing with specific requirements
   - Example: McDonald's (business) with 50 locations = 1 business listing + 50 demand listings

### Reusability Opportunities
- No existing frontend components to reuse (greenfield frontend implementation)
- Backend authentication and role-based access control already implemented and should be leveraged
- User profiles database schema exists and should be used
- JWT token validation and session management ready to integrate

**Components to Build for Reusability:**
- KPICard: Reusable metric display component
- BusinessCard: Reusable business listing card with logo, metrics, menu, and action buttons
- MetricBadge: Reusable badge component for displaying counts (Listings, States, Invites)
- SearchInput: Reusable search component
- FilterDropdown: Reusable filter component
- StatusBadge: Reusable badge component with color variants
- CategoryBadge: Reusable badge component for industry tags
- ActionButton: Reusable button component with variants
- EmptyState: Reusable empty state component
- TopNavigation: Reusable navigation bar component
- TierBadge: Reusable subscription tier indicator
- ThreeDotsMenu: Reusable dropdown menu component

### Scope Boundaries

**In Scope:**
- Complete dashboard layout matching Figma design and user-provided screenshot
- Top navigation with all elements (logo, tabs, tier badge, CTA, settings, profile link)
- 4 KPI cards displaying real-time metrics via WebSocket
- Business listings section with search and filter controls
- Business cards with all metadata:
  - Business logo/image
  - Business name
  - Three metric badges (Listings count, States count, Invites count)
  - Three-dot menu (Stealth mode, Edit Business, Delete Business)
  - Two action buttons (View Performance, Manage Locations)
- Infinite scroll for business listings (20 per page)
- Empty states for zero businesses
- Placeholder pages/views for:
  - Business Detail View with business selector and location tabs
  - Performance metrics funnel visualization structure
  - Trends page
  - Proposals page (Kanban pipeline)
- Responsive layout (desktop-first, mobile-responsive)
- Real-time data updates via WebSocket connections
- Client-side search and filtering
- Role-based access control (tenant users only)
- Required business profile completion before dashboard access
- Two-level data hierarchy: Business Listings → Demand Listings

**Out of Scope (Future Enhancements):**
- Full CRUD operations for businesses (Edit, Delete functionality wired but not implemented)
- Stealth mode toggle functionality (menu option present but not functional)
- Manage Locations functionality (button present but not functional)
- Business creation flow (Add Business button present but not functional)
- Profile editing functionality (link present but not functional)
- Settings page implementation
- Trends page implementation with market insights
- Proposals page implementation (Kanban deal pipeline)
- Business Detail View full implementation with real data
- Performance metrics calculations and data visualization
- Location-specific analytics and metrics
- Team collaboration features
- Document vault
- Messaging system integration (Messages Total KPI shows count but no message interface)
- Tier gating UI for premium features (grayed out with upgrade prompts)
- Profile creation flow (shown in design but separate from dashboard)
- Advanced analytics and charts
- Notification system
- Calendar integration
- Property matching algorithm implementation (show "N/A" for now)
- LOI submission functionality (available to all tiers but not yet built)
- View tracking implementation (Pro/Premium feature, not yet built)

### Technical Considerations

**Frontend Technology Stack (To Be Implemented):**
- **Framework:** React 18.x (TypeScript) as specified in tech stack
- **Build Tool:** Vite or Webpack (to be decided during implementation)
- **Routing:** React Router for navigation between Dashboard, Trends, Proposals
- **State Management:** TBD (Context API, Redux Toolkit, or Zustand)
- **UI Component Library:** TBD (Material-UI, Ant Design, or custom components)
- **WebSocket Client:** Socket.io client or native WebSocket API for real-time KPI updates
- **HTTP Client:** Axios or Fetch API for REST API calls
- **Styling Approach:** TBD (CSS Modules, Styled Components, Tailwind CSS)
- **Infinite Scroll Library:** react-infinite-scroll-component or Intersection Observer API
- **Form Handling:** TBD (React Hook Form, Formik)

**API Endpoints Required:**

1. **Dashboard Data:**
   - `GET /api/dashboard/tenant` - Main dashboard data including KPI metrics
   - Response: `{ kpis: { activeBusinesses, responseRate, landlordViews, messagesTotal }, businesses: [...] }`

2. **Business Management:**
   - `GET /api/businesses?page=1&limit=20` - List user's businesses with pagination
   - `GET /api/businesses/:id` - Business detail with metrics
   - `POST /api/businesses` - Create new business (future)
   - `PUT /api/businesses/:id` - Update business (future)
   - `DELETE /api/businesses/:id` - Delete business (future)

3. **Demand Listings (QFPs):**
   - `GET /api/businesses/:id/demand-listings` - List demand listings for a business
   - `GET /api/demand-listings/:id` - Specific demand listing details
   - `POST /api/businesses/:id/demand-listings` - Create demand listing (future)
   - `PUT /api/demand-listings/:id` - Update demand listing (future)
   - `DELETE /api/demand-listings/:id` - Delete demand listing (future)

4. **Business Locations:**
   - `GET /api/businesses/:id/locations` - List locations for a business
   - `GET /api/businesses/:id/locations/:locationId/metrics` - Location-specific performance data
   - `POST /api/businesses/:id/locations` - Add location to business (future)

5. **User Profile:**
   - `GET /api/profile` - User profile data for top navigation
   - `PUT /api/profile` - Update user profile (future)
   - `POST /api/profile/photo` - Upload profile photo (future)

6. **WebSocket Events:**
   - `ws://api/dashboard/stream` - WebSocket endpoint for real-time notifications
   - Events to listen for:
     - `kpi:update` - KPI metrics updated
     - `business:created` - New business added
     - `business:updated` - Business status changed
     - `business:deleted` - Business removed
     - `demand-listing:created` - New demand listing added
     - `demand-listing:updated` - Demand listing updated

**Database Schema Additions Needed:**

Current schema has `users` and `user_profiles` tables. Need to add:

1. **businesses table:**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- name (VARCHAR, business name)
- logo_url (VARCHAR, nullable, business logo image)
- category (VARCHAR, e.g., "F&B", "Retail", "Office")
- status (ENUM: 'active', 'pending_verification', 'stealth_mode')
- is_verified (BOOLEAN, default false)
- stealth_mode_enabled (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

2. **demand_listings table (QFPs):**
```sql
- id (UUID, primary key)
- business_id (UUID, foreign key to businesses)
- location_name (VARCHAR, e.g., "Miami Downtown")
- city (VARCHAR)
- state (VARCHAR)
- address (TEXT, optional)
- sqft_min (INTEGER, nullable)
- sqft_max (INTEGER, nullable)
- budget_min (DECIMAL, nullable)
- budget_max (DECIMAL, nullable)
- asset_type (VARCHAR, e.g., "Retail", "Office")
- requirements (JSONB, additional requirements)
- match_percentage (VARCHAR, default "N/A")
- status (ENUM: 'active', 'pending', 'closed')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

3. **business_metrics table:**
```sql
- id (UUID, primary key)
- business_id (UUID, foreign key to businesses)
- demand_listing_id (UUID, foreign key to demand_listings, nullable)
- metric_date (DATE)
- views_count (INTEGER, default 0)
- clicks_count (INTEGER, default 0)
- property_invites_count (INTEGER, default 0)
- declined_count (INTEGER, default 0)
- messages_count (INTEGER, default 0)
- qfps_submitted_count (INTEGER, default 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

4. **business_invites table:**
```sql
- id (UUID, primary key)
- business_id (UUID, foreign key to businesses)
- invited_by_user_id (UUID, foreign key to users)
- invited_user_email (VARCHAR)
- status (ENUM: 'pending', 'accepted', 'declined')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

5. **Update user_profiles table:**
```sql
- Add photo_url (VARCHAR, nullable) - for profile photo storage (if not already present)
- Add profile_completed (BOOLEAN, default false) - tracks if business profile flow completed
```

**Authentication & Authorization:**
- Leverage existing JWT authentication system
- Dashboard route protected by authentication middleware
- Role-based access control: Only users with `role = 'tenant'` can access tenant dashboard
- JWT token must be validated on every API request
- WebSocket connections must authenticate using JWT token
- Enforce business profile completion before dashboard access

**Real-Time Updates Strategy:**
- Establish WebSocket connection on dashboard mount
- Subscribe to user-specific channel for KPI updates
- Graceful fallback to polling if WebSocket connection fails
- Reconnection logic with exponential backoff
- Close WebSocket connection on dashboard unmount

**Performance Considerations:**
- Implement virtual scrolling or windowing if business count exceeds 100
- Debounce search input (300ms delay)
- Cache API responses in memory (5 minute TTL)
- Lazy load images in business cards (logo_url)
- Code splitting: Dashboard component lazy loaded
- Optimize bundle size: Tree shake unused dependencies
- Minimize re-renders using React.memo for KPICard and BusinessCard

**Responsive Design:**
- Desktop-first approach (design shows desktop layout)
- Breakpoints:
  - Desktop: 1200px+
  - Tablet: 768px - 1199px (KPI cards 2x2 grid, business cards 2 columns)
  - Mobile: < 768px (KPI cards stacked vertically, business cards single column)
- Navigation: Hamburger menu on mobile
- Touch-friendly button sizes (minimum 44x44px)

**Error Handling:**
- Display error states for failed API requests
- Retry mechanism for network failures
- Toast notifications for temporary errors
- Error boundary component for React errors
- WebSocket disconnection notification

**Accessibility:**
- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators on all focusable elements
- Screen reader support for KPI cards and business cards
- Semantic HTML structure (header, main, nav, section)
- Color contrast meeting WCAG AA standards

**Testing Strategy:**
- Unit tests for components (KPICard, BusinessCard, SearchInput, MetricBadge, ThreeDotsMenu)
- Integration tests for dashboard page
- API mocking for component tests
- WebSocket mocking for real-time update tests
- Snapshot tests for UI components
- E2E tests for critical user flows (login → complete profile → view dashboard)
- 6-8 focused tests on critical paths as per tech stack guidelines

**Starter Tier Features to Implement:**
1. View dashboard with KPI cards
2. View business listings (up to 2 business listings per Starter tier pricing)
3. View demand listings (QFPs) under each business
4. Search and filter business listings
5. View business metrics (Listings count, States count, Invites count)
6. Basic profile display in top navigation
7. Tier badge showing "Free Plan"
8. Navigation between Dashboard, Trends, Proposals (placeholder pages)
9. Empty states for new users with no businesses
10. Infinite scroll for business listings
11. Real-time KPI updates via WebSocket
12. Match percentage display as "N/A" until algorithm built
13. LOI functionality available (when built in future)

**Features to Show as Grayed Out Placeholders (Tier-Gated):**
- Business Detail View analytics (Pro tier): Show metrics structure but display "Upgrade to Pro" overlay
- Advanced Analytics (Pro tier): Funnel visualization grayed out with upgrade prompt
- Kanban Board View (Pro tier): Proposals tab accessible but shows upgrade prompt
- Team Collaboration (Pro+ tiers): Settings option grayed out
- View Tracking (Pro tier): Landlord Views KPI grayed out for Starter tier
- Video Uploads (Premium tier): Upload button grayed out
- AI Scoring (Premium tier): Score display grayed out
- Heatmaps (Premium tier): Map visualization grayed out
- Stealth Mode Toggle (Enterprise tier): Menu option visible but disabled for lower tiers
- Comparison Tools (Enterprise tier): Button grayed out

**Messaging System Implementation:**
- Use simple internal messaging system (NOT Stream API)
- Stream API migration planned for later optimization phase (roadmap item #31)
- Build basic message threading, read receipts, and notifications
- Messages Total KPI displays count but full messaging interface out of scope for initial dashboard

**View Tracking Implementation:**
- Pro tier: Aggregated view data
- Premium tier: Detailed view data with profile visibility
- Enterprise tier: Full tracking with audit logs
- Starter tier: No view tracking (Landlord Views KPI grayed out)

**Integration Points:**
- Backend authentication system: JWT token validation
- User profiles: Fetch user data for navigation and tier badge
- Business data: CRUD operations via REST API
- Demand listings: Nested under businesses, separate API endpoints
- WebSocket server: Real-time notifications for KPI updates
- File storage (AWS S3): Business logos and profile photos (future)
- Subscription management (Stripe): Tier verification for feature gating (future)
- Messaging system: Simple internal system for Messages Total KPI

**Migration Considerations:**
- No existing frontend to migrate from (greenfield implementation)
- Backend API must be designed to support two-level hierarchy (Business → Demand Listings)
- Database schema should support all tier features even if not exposed in UI initially
- WebSocket infrastructure should be scalable for real-time features across platform
- Component library should be built with reusability across Tenant, Landlord, Broker dashboards

**Security Requirements:**
- CSRF protection on all API endpoints
- Rate limiting on dashboard API endpoints
- Input sanitization for search queries
- XSS prevention in business name/description rendering
- JWT token stored securely (httpOnly cookies preferred over localStorage)
- WebSocket connections authenticated with token
- Role validation on both frontend (UI hiding) and backend (API enforcement)
- Business profile completion enforcement on backend

**Browser Support:**
- Modern browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- No IE11 support required
- ES6+ features okay (transpile with Babel if needed)

**Deployment Considerations:**
- Static asset hosting via CDN (CloudFront or Cloudflare)
- API endpoint: Base URL configurable via environment variables
- WebSocket endpoint: Configurable separately from REST API
- Build optimization: Minification, compression, tree-shaking
- Environment-specific configs (development, staging, production)

**Future Technical Debt to Address:**
- Business CRUD operations implementation
- Demand listing CRUD operations
- Profile editing and photo upload
- Business logo upload
- Settings page implementation
- Messaging system full interface
- Notification system
- Calendar integration for tour scheduling
- Document vault for lease documents (LOI submission)
- Advanced analytics and charting libraries
- Matching algorithm implementation (replace "N/A" with actual percentages)
- View tracking implementation for Pro/Premium tiers
- Mobile app considerations (React Native potential)
- Stealth mode toggle functionality
