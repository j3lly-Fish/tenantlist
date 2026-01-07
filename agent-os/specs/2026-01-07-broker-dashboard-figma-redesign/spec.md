# Specification: Broker Dashboard Figma Redesign

## Goal
Complete rebuild of the broker dashboard to match Figma designs with multi-page architecture, sidebar navigation, brokerage business profiles, team management, and public tenant profile system.

## User Stories
- As a broker, I want to navigate between different dashboard sections using a sidebar menu so that I can easily access tenant listings, property listings, performance metrics, and matches
- As a broker, I want to create a brokerage business profile with team members so that I can manage my brokerage's presence and collaborate with colleagues
- As a broker, I want to view and search public tenant profiles so that I can identify potential clients and submit properties to them

## Specific Requirements

**Multi-Page Layout with Sidebar Navigation**
- Replace single-page dashboard with three-column layout: Sidebar (250px) | Main Content | Right Panel (350px)
- Left sidebar displays 6 menu items with icons: Overview, Tenant Listings, Property Listings, Review Performance, Listing Matches, Invite Clients
- Top navigation remains consistent: Logo, Navigation tabs (Dashboard, Find Tenants, Trends), Messages icon, Notifications bell, User avatar, Tier badge
- Sidebar sticky positioning with active state highlighting
- Responsive design: collapse sidebar on mobile to hamburger menu
- Main content area scrollable with white background
- Right panel contextual based on current page

**Business Profile Creation (2-Step Modal)**
- Step 1: Basic Information - Cover image upload (650x150px recommended), Circular logo upload, Company name input, Established year input, Location (city/state) inputs, Social media links (Website, Instagram, LinkedIn), About section (expandable textarea, rich text), Stats display (read-only): Offices, Agents, Tenants, Properties
- Step 2: Team Management - Search field for finding team members, Team member cards with avatar, name, location, Role selector dropdown (Broker, Admin, Manager, Viewer), Add/remove team member buttons, Navigation: Back button (outlined), Create Brokerage Profile button (solid black)
- Modal max-width 600px, rounded corners 8px, step indicator showing "1 of 2" or "2 of 2"
- Form validation: required fields marked, error messages displayed inline
- Image uploads handled via file input with preview, recommended dimensions shown
- On submit: POST to `/api/broker/business-profiles`, then POST to `/api/broker/business-profiles/:id/team` for each team member

**Business Profile Selector (Right Sidebar)**
- Title: "Select your business profile", Subtitle explaining purpose
- Search input for filtering business profiles by name
- Scrollable list of business profiles with company logo, name, verified badge (if applicable)
- Empty state: "Can't find your business?" with "Create New Business" button
- Clicking profile selects it as active context for current session
- Active profile stored in session/local storage
- Selected profile affects tenant listings, property submissions, performance metrics

**Tenant Overview Dashboard (Main Page)**
- Header: "Tenant Overview (X)" with count, Subtitle: "Monitor your properties to seek tenant engagement", Action button: "+ Add Tenant" (dark button, top right)
- Main content card: "Search for tenant profile", Search input with placeholder "Search for Tenant", Empty state: "Can't find your tenant?", CTA: "Create New Tenant" button (full width, dark)
- Search functionality filters public tenant profiles by name, category, location
- Clicking tenant card navigates to full tenant profile page
- Grid layout for tenant cards: 2 columns on desktop, 1 on mobile
- Each card shows logo, name, category, rating, verified badge

**Tenant Public Profile Page**
- Hero section: Cover image (full width), Circular logo with verified badge overlay, Company name (large heading), Category subtitle (e.g., "Quick Service Retail"), Star rating with review count (e.g., "4.8 ★ (245 Reviews)"), Social links (Website, Instagram, LinkedIn) as icon buttons
- Left column About section: Company description with "view more" expand/collapse, Images gallery: 2x3 grid of photos, expandable to full gallery view, Documents section: List of files with icons (PDF, image, doc), file name and download link, Location section: Interactive map showing multiple locations, List of locations with city/state, Per-location details: Asset type dropdown, Sqft Min-Max inputs, Preferred Lease Term dropdown
- Right sidebar Request Admin Approval form: Title and description, Tenant email input, Tenant Pin input (3-digit verification), "Send for Review" button (dark), Contact card: Avatar and name, Company/role label, "Send Message" button (outlined), "Submit Property" button (dark)
- Profile data fetched from GET `/api/broker/tenants/:id`
- Admin approval submits POST to `/api/broker/tenants/:id/request`

**Post New Location Modal (2-Step)**
- Step 1: Space Requirements - Listing Location Name input, Asset dropdown (Retail, Office, Industrial, etc.), Target move-in Date picker, Square Feet: Min/Max inputs with comma formatting, Lot Size (Acres): Min input, Monthly Budget: Min/Max inputs with dollar formatting, Preferred Lease Term dropdown (Short-term, Medium-term 3-5 years, Long-term), Locations of Interest: Multi-select with tag chips (removable), Interactive Map: Toggle buttons (Market, Reduce, Draw), Search by city autocomplete, Map visualization with selected areas/boundaries, Navigation: Cancel button (outlined), Next button (dark)
- Step 2: Additional Features - Grid of 40+ amenity checkboxes including: Corporate location, 24/7, 2nd generation restaurant, 3 phase electrical, ADA accessible, Anchor tenants, Clear height 24'+/32'+, Dock types (cross dock, double wide, drive in ramp, enclosed loading, levelers, truck lifts, wells, insulated, ground level bays), Drive Thru, End cap, ESFR, Fencing & secure, Freezer/Refrigerator capacity, Glass storefront, Grease trap, Hotel lobby, Inline, Liquor license, On-site amenities, Out parcel, Parking, Patio/outdoor seating, Private suites, Proximity to seaport/airport, Public transportation, Rail access, Signage, Wide truck court
- Checkbox grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Navigation: Back button returns to Step 1, Preview button submits form
- On submit: POST to `/api/broker/locations` with all data including amenities array, locations_of_interest array, map_boundaries JSON
- Map integration: store drawn boundaries as GeoJSON, save selected cities/areas

**Database Schema: 9 New Tables**
- business_profiles: id (UUID), created_by_user_id (FK to users), company_name, logo_url, cover_image_url, established_year, location_city, location_state, about (TEXT), website_url, instagram_url, linkedin_url, is_verified, created_at, updated_at
- business_team_members: id (UUID), business_profile_id (FK), user_id (FK), email, role (enum: broker/manager/admin/viewer), status (enum: invited/active/inactive), invited_at, joined_at, created_at
- tenant_public_profiles: id (UUID), business_id (FK), cover_image_url, logo_url, display_name, category, about (TEXT), rating (DECIMAL 2,1), review_count, website_url, instagram_url, linkedin_url, is_verified, tenant_pin (VARCHAR 10, UNIQUE), contact_email, created_at, updated_at
- tenant_profile_images: id (UUID), tenant_profile_id (FK, CASCADE), image_url, display_order, created_at
- tenant_profile_documents: id (UUID), tenant_profile_id (FK, CASCADE), document_name, document_url, document_type, uploaded_at
- tenant_locations: id (UUID), tenant_profile_id (FK, CASCADE), location_name, city, state, asset_type, sqft_min, sqft_max, preferred_lease_term, latitude, longitude, created_at
- broker_tenant_requests: id (UUID), broker_user_id (FK), business_profile_id (FK), tenant_profile_id (FK), tenant_email, tenant_pin, status (enum: pending/approved/rejected), requested_at, reviewed_at, reviewed_by (FK to users)
- business_profile_stats: business_profile_id (PK, FK CASCADE), offices_count, agents_count, tenants_count, properties_count, updated_at
- demand_listings enhancements: ADD amenities (JSONB), locations_of_interest (JSONB), map_boundaries (JSONB), lot_size_min (DECIMAL), lot_size_max (DECIMAL), monthly_budget_min (DECIMAL), monthly_budget_max (DECIMAL)

**API Endpoints: 15 New Routes**
- POST `/api/broker/business-profiles` - Create brokerage profile, request body: company_name, logo_url, cover_image_url, established_year, location_city, location_state, about, website_url, instagram_url, linkedin_url, response: created business profile object
- GET `/api/broker/business-profiles` - List user's business profiles, response: array of business profiles with stats
- GET `/api/broker/business-profiles/:id` - Get specific profile with team members, response: business profile with embedded team_members array
- PUT `/api/broker/business-profiles/:id` - Update profile fields, request: partial business profile data, response: updated profile
- DELETE `/api/broker/business-profiles/:id` - Delete profile (requires confirmation)
- POST `/api/broker/business-profiles/:id/team` - Add team member, request: user_id or email, role, response: created team member
- DELETE `/api/broker/business-profiles/:id/team/:memberId` - Remove team member
- GET `/api/broker/business-profiles/:id/stats` - Get calculated stats (offices, agents, tenants, properties)
- GET `/api/broker/tenants` - Search public tenant profiles, query params: search, category, location, page, limit, response: paginated tenant profiles with ratings
- GET `/api/broker/tenants/:id` - Get full tenant profile with images, documents, locations, response: tenant profile with embedded images, documents, locations arrays
- POST `/api/broker/tenants/:id/request` - Request admin approval, request: tenant_email, tenant_pin, response: request ID and status
- POST `/api/broker/tenants/:id/contact` - Send message to tenant, request: message, subject, response: message sent confirmation
- POST `/api/broker/locations` - Post new space requirement/location, request: location_name, asset_type, target_move_in, sqft_min, sqft_max, lot_size_min, monthly_budget_min, monthly_budget_max, preferred_lease_term, locations_of_interest (array), amenities (array), map_boundaries (GeoJSON), response: created demand listing
- PUT `/api/broker/locations/:id` - Update location requirement
- GET `/api/broker/locations` - List broker's posted locations with pagination

**Frontend Component Structure**
- pages/broker/BrokerLayout.tsx - Main layout wrapper with sidebar, topnav, right panel, routing outlet
- pages/broker/Overview.tsx - Dashboard overview page (initial landing)
- pages/broker/TenantListings.tsx - Tenant overview with search and grid
- pages/broker/TenantProfile.tsx - Full public tenant profile view
- pages/broker/PropertyListings.tsx - Reuse existing property listings with filters
- pages/broker/ReviewPerformance.tsx - Analytics dashboard (future phase)
- pages/broker/ListingMatches.tsx - Property/tenant matching engine (future phase)
- pages/broker/InviteClients.tsx - Client invitation system (future phase)
- components/broker/BrokerSidebar.tsx - Left navigation menu with icons and active states
- components/broker/BusinessProfileModal.tsx - 2-step business profile creation, step state management, form validation, image upload handling
- components/broker/BusinessProfileSelector.tsx - Right sidebar business selector with search
- components/broker/TenantSearchCard.tsx - Main search interface for tenant listings page
- components/broker/TenantProfileCard.tsx - Grid item showing tenant summary
- components/broker/TenantProfileView.tsx - Full profile display with all sections
- components/broker/PostLocationModal.tsx - 2-step location posting, map integration wrapper, amenities grid component
- components/broker/TenantRequestForm.tsx - Admin approval request form in right sidebar
- components/broker/ContactCard.tsx - Contact information display with action buttons
- components/broker/LocationMapSelector.tsx - Interactive map with draw tools (Market/Reduce/Draw)
- components/broker/AmenitiesCheckboxGrid.tsx - 40+ amenities in responsive grid

**Admin Approval Workflow**
- Broker submits request with tenant email and 3-digit pin
- Request stored in broker_tenant_requests table with status='pending'
- Admin views pending requests in admin dashboard (future implementation)
- Admin verifies tenant credentials, checks pin against tenant_public_profiles.tenant_pin
- Admin approves or rejects request, updates status and reviewed_at timestamp
- On approval: broker gains access to submit properties, send messages to tenant
- On rejection: broker notified with reason
- Broker can view request status in UI: pending (yellow), approved (green), rejected (red)
- WebSocket event 'broker:tenant-approved' notifies broker in real-time

**Implementation Phases**
- Phase 1 Week 1: Create all 9 database migrations, implement migration runner execution, create Sequelize/TypeORM models for all tables, implement BrokerLayout with sidebar component, set up routing for 6 pages (stub components), apply design tokens for sidebar styling
- Phase 2 Week 1-2: Build BusinessProfileModal with 2 steps, implement image upload service/integration, create POST/GET/PUT business profile endpoints, build BusinessProfileSelector for right sidebar, implement team member add/remove functionality, calculate and display business stats
- Phase 3 Week 2-3: Create tenant_public_profiles data models, implement GET `/api/broker/tenants` search endpoint, build TenantListings page with search and grid, create TenantProfile page with hero and sections, implement admin approval POST endpoint, build TenantRequestForm component, add broker_tenant_requests status tracking
- Phase 4 Week 3: Build PostLocationModal with 2-step flow, create LocationMapSelector with draw tools integration (Mapbox/Google Maps), implement AmenitiesCheckboxGrid (40+ checkboxes), create POST `/api/broker/locations` endpoint, update demand_listings table with new JSONB columns, handle GeoJSON storage for map boundaries

## Visual Design

**planning/visuals/README.md**
- CreateAccount_Broker (Frame 454): Step 2 of business profile creation showing team invitation interface with search, member cards, role selectors, and business stats display
- Broker Dashboard - Tenant Overview: Three-column layout with sidebar menu, main search card, right sidebar business selector, demonstrates overall page structure
- Tenant Public Profile (Starbucks): Hero section with cover/logo, left column with about/images/documents/locations, right sidebar with admin approval form and contact card
- Post New Location Modal - Step 1/2: Detailed form with location inputs, budget fields, multi-select locations with tag chips, interactive map with Market/Reduce/Draw tools
- Post New Location Modal - Step 2/2: Extensive amenities checkbox grid with 40+ options in responsive columns
- Tenant Public Profile (Alternate View): Similar to profile view showing contact section with Send Message and Submit Property buttons

## Existing Code to Leverage

**BrokerDashboard.tsx and BrokerDashboardController.ts**
- Reuse existing broker KPI logic (active deals, commission pipeline, response rate, properties matched) for Overview page
- Leverage getBrokerKPIs(), getBrokerProfile(), getBrokerDemands(), getBrokerProperties() API client methods
- Adapt existing BrokerProfile interface and BrokerProfileModel for backward compatibility
- Reuse infinite scroll hooks (useInfiniteScroll) for tenant listings and property listings pagination
- Maintain existing WebSocket integration pattern with useBrokerDashboardWebSocket hook

**DemandListingModel and PropertyListingModel**
- Extend DemandListingModel with new amenities, locations_of_interest, map_boundaries fields
- Reuse findPaginated method pattern for tenant profile search
- Leverage existing filter logic (location, propertyType, sqft range) for location requirements
- Maintain consistency with existing create/update/delete patterns for new location endpoints

**TopNavigation Component**
- Keep existing TopNavigation component as-is for consistency across all pages
- Maintain Logo, NavigationTabs, TierBadge, FavoritesIcon, NotificationsIcon, MessageIcon, ProfileDropdown
- Apply to BrokerLayout wrapper so it appears on all broker pages
- Ensure tier="Broker" prop passed to display appropriate badge

**Modal Components and Design Tokens**
- Replicate BusinessProfileModal.module.css styling patterns for new modals
- Use existing modal structure: backdrop, container, header, form, actions
- Apply design-tokens.css variables for colors, spacing, typography, shadows
- Maintain consistent button styles: primary (dark), secondary (outlined), heights (sm/md/lg)
- Reuse form input styles with focus states, error states, placeholder colors

**WebSocket and API Client Patterns**
- Follow dashboardSocket.ts authentication pattern with JWT from cookies
- Create new WebSocket events following existing naming: 'broker:tenant-approved', 'broker:new-match', 'broker:team-member-joined', 'broker:business-stats-updated'
- Use apiClient.ts axios instance for all API calls with automatic token refresh
- Implement error handling consistent with existing try/catch patterns
- Maintain withCredentials: true for cookie-based authentication

## Out of Scope
- Existing broker KPI cards on main dashboard (not shown in Figma, removed from new design)
- Dark mode support (design system currently light-mode only)
- Review Performance analytics dashboard implementation (stub page only, future work)
- Listing Matches algorithm implementation (stub page only, future work)
- Invite Clients email invitation system (stub page only, future work)
- Tenant self-registration flow (tenants create profiles via separate workflow)
- Payment/subscription model for business profiles (all features free for Phase 1)
- Advanced map features beyond Market/Reduce/Draw (heatmaps, clustering, etc.)
- Real-time collaboration on business profiles (single owner edit only)
- Tenant profile review/rating system (display only, no submission flow)
- Mobile app implementation (responsive web only)
- Image compression/optimization service (use uploaded images as-is)
- Document preview/viewer in browser (download only)
- Email notifications for approval status changes (WebSocket only)
- Bulk team member invitation via CSV upload
