# Task Breakdown: Broker Dashboard Figma Redesign

## Overview
**Total Tasks:** Comprehensive rebuild of broker dashboard with multi-page architecture
**Estimated Duration:** 4-6 weeks
**Architecture:** Complete transition from single-page to multi-page with sidebar navigation

---

## PHASE 1: FOUNDATION - DATABASE, SERVICES, API & LAYOUT

### Task Group 1: Database Schema & Migrations
**Dependencies:** None
**Duration:** 4-6 hours
**Status:** ✅ COMPLETED

- [x] 1.1 Create migration 023: business_profiles table
- [x] 1.2 Create migration 024: business_team_members table
- [x] 1.3 Create migration 025: tenant_public_profiles table
- [x] 1.4 Create migration 026: tenant_profile_images table
- [x] 1.5 Create migration 027: tenant_profile_documents table
- [x] 1.6 Create migration 028: tenant_locations table
- [x] 1.7 Create migration 029: broker_tenant_requests table
- [x] 1.8 Create migration 030: business_profile_stats table
- [x] 1.9 Create migration 031: enhance demand_listings table
- [x] 1.10 Create Sequelize models for all new tables
- [x] 1.11 Update DemandListing model with new JSONB fields
- [x] 1.12 Register all migrations in index.ts
- [x] 1.13 Run migrations in development environment
- [x] 1.14 Write focused database layer tests (8 tests)

**Acceptance Criteria:**
- ✅ All 9 new tables created with proper constraints and indexes
- ✅ All Sequelize models created with associations
- ✅ demand_listings table successfully enhanced with JSONB columns
- ✅ Migrations run without errors
- ✅ Database layer tests written and passing (8 tests)

---

### Task Group 2: Backend Services Layer
**Dependencies:** Task Group 1 (COMPLETED)
**Duration:** 6-8 hours
**Status:** ✅ COMPLETED

- [x] 2.1 Create BusinessProfileService with full CRUD operations
- [x] 2.2 Create TenantProfileService with search and pagination
- [x] 2.3 Create BrokerTenantRequestService with pin verification
- [x] 2.4 Create DemandListingService enhancements for amenities and map boundaries
- [x] 2.5 Create BusinessStatsService for aggregation calculations
- [x] 2.6 Write focused service layer tests (5 tests)

**Acceptance Criteria:**
- ✅ All 5 service classes created with complete CRUD operations
- ✅ Services properly integrate with database models
- ✅ Stats calculation logic works correctly
- ✅ Pin verification logic secure and functional
- ✅ Service layer tests pass (5 tests)

---

### Task Group 3: API Endpoints Layer
**Dependencies:** Task Groups 1-2 (COMPLETED)
**Duration:** 6-8 hours
**Status:** ✅ COMPLETED

- [x] 3.1 Create BusinessProfileController with 8 endpoints
- [x] 3.2 Create TenantProfileController with 4 endpoints
- [x] 3.3 Create BrokerLocationController with 3 endpoints
- [x] 3.4 Extend brokerRoutes.ts with all 15 new endpoints
- [x] 3.5 Implement authentication middleware on all routes
- [x] 3.6 Implement authorization checks in controllers
- [x] 3.7 Add comprehensive error handling
- [x] 3.8 Write integration tests for critical endpoints (6 tests)

**Acceptance Criteria:**
- ✅ All 15 endpoints implemented and accessible
- ✅ All 3 controllers created with proper error handling
- ✅ Authentication and authorization working on all routes
- ✅ Request/response formats match spec
- ✅ Integration with service layer working
- ✅ Error handling comprehensive with proper HTTP status codes
- ✅ Integration tests passing for critical endpoints (6 tests)

---

### Task Group 4: Layout Structure & Routing
**Dependencies:** Task Groups 1-3 (COMPLETED)
**Duration:** 6-8 hours
**Status:** ✅ COMPLETED

- [x] 4.1 Create BrokerLayout.tsx - Three-column layout with sidebar
  - Left sidebar (250px fixed width)
  - Main content area (flex-grow)
  - Responsive: collapse sidebar to hamburger on mobile
  - Apply design tokens from design-tokens.css
  - Integrate TopNavigation at the top
- [x] 4.2 Create BrokerSidebar.tsx - Sidebar navigation component
  - 6 menu items with icons: Overview, Tenant Listings, Property Listings, Review Performance, Listing Matches, Invite Clients
  - Active state highlighting with blue accent and left border
  - Icon + text labels
  - Sticky positioning
  - Click navigation to routes
- [x] 4.3 Create 6 page components (stubs initially)
  - pages/broker/Overview.tsx - Dashboard overview (stub)
  - pages/broker/TenantListings.tsx - Tenant overview with search card (stub)
  - pages/broker/PropertyListings.tsx - Property listings (stub)
  - pages/broker/ReviewPerformance.tsx - Analytics (stub)
  - pages/broker/ListingMatches.tsx - Matching engine (stub)
  - pages/broker/InviteClients.tsx - Client invitations (stub)
- [x] 4.4 Update App.tsx routing
  - Add /broker/* routes with BrokerLayout wrapper
  - Protected routes (require authentication + broker role)
  - Route paths: /broker/overview, /broker/tenant-listings, /broker/property-listings, /broker/review-performance, /broker/listing-matches, /broker/invite-clients
  - Default redirect from /broker to /broker/overview
- [x] 4.5 Apply design system
  - Use SF Pro fonts from existing design tokens
  - Colors: --zyx-gray-700 (primary text), --zyx-info (active accent), --border-color-light
  - Sidebar styling: subtle shadow, hover states, active indicator
  - Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- [x] 4.6 Write routing tests (8 tests)
  - Test BrokerLayout renders with TopNavigation and sidebar
  - Test all 6 page routes accessible
  - Test active state highlighting
  - Test nested route structure

**Acceptance Criteria:**
- ✅ Three-column layout renders correctly
- ✅ Sidebar navigation functional with all 6 items
- ✅ All 6 page routes accessible
- ✅ Active state highlights current page
- ✅ Responsive design works on mobile
- ✅ Routing tests pass (8 tests)
- ✅ Design tokens applied consistently

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/BrokerLayout.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/BrokerLayout.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BrokerSidebar.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BrokerSidebar.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/Overview.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/Overview.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantListings.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantListings.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/PropertyListings.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/PropertyListings.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/ReviewPerformance.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/ReviewPerformance.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/ListingMatches.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/ListingMatches.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/InviteClients.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/InviteClients.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/App.tsx` (updated with broker routes)
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/routing/brokerDashboardRouting.test.tsx`

---

## PHASE 2: BUSINESS PROFILES & TEAM MANAGEMENT

### Task Group 5: Business Profile Creation Modal
**Dependencies:** Task Group 4 (COMPLETED)
**Duration:** 8-10 hours
**Status:** ✅ COMPLETED

- [x] 5.1 Create BusinessProfileModal.tsx - 2-step modal component
  - Step indicator showing "1 of 2" or "2 of 2"
  - Navigation between steps with Back/Next buttons
  - Form validation with inline error messages
  - Modal backdrop and centered positioning
- [x] 5.2 Create Step 1: Basic Information form
  - Cover image upload (650x150px recommended) with file input preview
  - Circular logo upload with file input preview
  - Company name input (required)
  - Established year input (dropdown or number input)
  - Location inputs: city (text), state (dropdown)
  - Social media links: Website URL, Instagram URL, LinkedIn URL
  - About section: expandable textarea for company description
  - Stats display: Offices, Agents, Tenants, Properties (read-only, initially "--")
- [x] 5.3 Create Step 2: Team Management interface
  - Search field: "Find brokers, managers, and more"
  - Team member cards showing avatar, name, location, role selector
  - Add/remove team member buttons
  - Navigation: Back button (outlined), Create Brokerage Profile button (solid black)
- [x] 5.4 Create TeamMemberCard.tsx component
  - Avatar display (placeholder or uploaded)
  - Name input field
  - Email input field (required for team member)
  - Location input (optional)
  - Role selector dropdown: Broker, Admin, Manager, Viewer
  - Remove button
- [x] 5.5 Implement image upload handling
  - File input with change handler
  - Image preview before upload (base64 encoding for demonstration)
  - Recommended dimensions display
  - File size validation (5MB for logo, 10MB for cover)
  - Error handling for upload failures
- [x] 5.6 Implement form validation
  - Required field validation (company_name)
  - URL format validation for social media links
  - Email validation for team member invitations
  - Established year range validation (1800 - current year)
  - Display inline error messages
- [x] 5.7 Integrate with POST /api/broker/business-profiles endpoint
  - Submit basic info from Step 1
  - Create business profile on backend
  - Receive profile ID in response
- [x] 5.8 Integrate with POST /api/broker/business-profiles/:id/team endpoint
  - Submit team members from Step 2
  - Add each team member with role
  - Handle invitation status
- [x] 5.9 Write component tests for BusinessProfileModal (15 tests)
  - Test step navigation (forward/back)
  - Test form validation
  - Test image upload preview
  - Test team member add/remove
  - Test API integration
  - Test error handling
  - Test modal interaction (backdrop click, close button)
- [x] 5.10 Write component tests for TeamMemberCard (9 tests)
  - Test member information rendering
  - Test avatar display
  - Test field updates
  - Test role selector
  - Test remove functionality

**Acceptance Criteria:**
- ✅ 2-step modal flow works smoothly with next/back navigation
- ✅ All form fields validate correctly
- ✅ Image uploads show preview
- ✅ Team member cards can be added/removed
- ✅ API integration successful (profile + team members created)
- ✅ Modal closes on success with success message
- ✅ Error handling displays user-friendly messages
- ✅ Tests pass for critical user flows (24 tests total)

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessProfileModal.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessProfileModal.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TeamMemberCard.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TeamMemberCard.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/BusinessProfileModal.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/TeamMemberCard.test.tsx`

---

### Task Group 6: Business Profile Selector & Stats
**Dependencies:** Task Group 5 (COMPLETED)
**Duration:** 4-6 hours
**Status:** ✅ COMPLETED

- [x] 6.1 Create BusinessProfileSelector.tsx - Right sidebar component
  - Title: "Select your business profile"
  - Subtitle explaining purpose
  - Search input for filtering profiles by name
  - Scrollable list of business profiles
  - Company logo, name, verified badge display
  - Empty state: "Can't find your business?"
  - "Create New Business" button triggers modal
- [x] 6.2 Implement profile selection logic
  - Click handler for profile selection
  - Active profile highlighting
  - Store selected profile in local storage or session
  - Update context/state with active profile
- [x] 6.3 Integrate with GET /api/broker/business-profiles endpoint
  - Load user's business profiles on mount
  - Display profiles in list
  - Handle loading and error states
- [x] 6.4 Implement search/filter functionality
  - Client-side filtering by company name
  - Update displayed list on search input change
- [x] 6.5 Connect to BusinessProfileModal
  - Button click opens modal
  - Modal close refreshes profile list
- [x] 6.6 Create BusinessProfileContext.tsx - Context provider
  - Store active business profile ID
  - Provide methods: selectProfile(), getActiveProfile(), clearProfile()
  - Persist selection in localStorage
  - Load on app initialization
- [x] 6.7 Create BusinessStatsCard.tsx - Stats display component
  - Show 4 stats in grid: Offices, Agents, Tenants, Properties
  - Icon for each stat type
  - Number formatting (e.g., "12" or "--" for zero)
  - Loading state while fetching
  - Integrate with GET /api/broker/business-profiles/:id/stats
- [x] 6.8 Update Overview.tsx to integrate stats
  - Display BusinessStatsCard component
  - Show active business profile info
  - Stats update when business profile changes
- [x] 6.9 Update BrokerLayout.tsx
  - Add BusinessProfileSelector in right sidebar
  - Wrap with BusinessProfileProvider context
  - Add BusinessProfileModal integration
- [x] 6.10 Write component tests (28 tests total)
  - Test BusinessProfileContext (8 tests)
  - Test BusinessProfileSelector (11 tests)
  - Test BusinessStatsCard (9 tests)

**Acceptance Criteria:**
- ✅ Selector displays user's business profiles
- ✅ Search filtering works correctly
- ✅ Profile selection updates active context
- ✅ Empty state displays when no profiles
- ✅ Create button opens modal
- ✅ Context provider works across components
- ✅ Stats display shows correct counts
- ✅ Active profile persists in localStorage
- ✅ Stats update when active profile changes
- ✅ Component tests pass (28 tests)

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/contexts/BusinessProfileContext.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessProfileSelector.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessProfileSelector.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessStatsCard.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/BusinessStatsCard.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/Overview.tsx` (updated)
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/BrokerLayout.tsx` (updated)
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/contexts/BusinessProfileContext.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/BusinessProfileSelector.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/BusinessStatsCard.test.tsx`

---

## PHASE 3: TENANT LISTINGS & PUBLIC PROFILES

### Task Group 7: Tenant Listings & Search
**Dependencies:** Task Groups 1-6 (COMPLETED)
**Duration:** 6-8 hours
**Status:** ✅ COMPLETED

- [x] 7.1 Update TenantListings.tsx page (from stub to full implementation)
  - Header with "Tenant Overview (X)" title showing count
  - Subtitle: "Monitor your properties to seek tenant engagement"
  - "+ Add Tenant" button (top right, dark button)
  - Main search card component integrated
  - Grid layout for tenant cards (2 columns desktop, 1 mobile)
  - Infinite scroll pagination with useInfiniteScroll hook
  - Loading states, empty states, error handling
- [x] 7.2 Create TenantSearchCard.tsx component
  - Title: "Search for tenant profile"
  - Subtitle explaining purpose
  - Search input: "Search for Tenant" with icon
  - Category filter dropdown (all categories from spec)
  - Location filter input (optional, city/state format)
  - Results count display when tenants found
  - Empty state: "Can't find your tenant?" with explanation
  - "Create New Tenant" button (full width, dark)
  - Clear filters button when filters active
- [x] 7.3 Create TenantProfileCard.tsx component
  - Circular logo with verified badge overlay (if verified)
  - Company name (heading)
  - Category subtitle (e.g., "Quick Service Retail")
  - Star rating with review count (e.g., "4.8 ★ (245 Reviews)")
  - Location display (city, state) with icon
  - Hover effect with subtle shadow and lift
  - Click navigates to tenant profile page (/broker/tenant-profile/:id)
  - Keyboard navigation support (Enter/Space)
  - Proper accessibility attributes
- [x] 7.4 Integrate with GET /api/broker/tenants endpoint
  - Search tenant profiles with query params (search, category, location, page, limit)
  - Paginated response handling (profiles, total, page, limit, totalPages)
  - Loading states during fetch
  - Error handling with retry capability
- [x] 7.5 Implement search & filter functionality
  - Client-side search with debounced input (300ms delay)
  - Category filter dropdown with common categories
  - Location filter by city/state
  - hasActiveFilters check to show/hide clear button
  - Clear filters resets all filter state
  - Auto-reload on filter changes
- [x] 7.6 Implement responsive grid layout
  - 2 columns on desktop (>1024px)
  - 1 column on mobile (<1024px)
  - 24px gap between cards on desktop
  - 16px gap on mobile
  - Cards use design tokens for spacing, colors, shadows
- [x] 7.7 Write component tests (51 tests total)
  - TenantSearchCard tests (18 tests): rendering, search, filters, empty state, create button
  - TenantProfileCard tests (18 tests): rendering, logo fallback, verified badge, rating, location, navigation, keyboard support
  - TenantListings tests (15 tests): page load, data fetching, search debounce, filters, clear filters, error handling, infinite scroll, empty state

**Acceptance Criteria:**
- ✅ TenantListings page displays header with dynamic count
- ✅ Search card allows filtering by name/category/location
- ✅ Tenant cards display in responsive grid (2 cols desktop, 1 col mobile)
- ✅ Click on tenant card navigates to profile page
- ✅ Infinite scroll loads more tenants when scrolling
- ✅ "+ Add Tenant" button functional (shows alert for now)
- ✅ Empty states display when no results found
- ✅ Loading states show during fetch operations
- ✅ Debounced search (300ms) prevents excessive API calls
- ✅ All 51 tests pass successfully

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantListings.tsx` (updated from stub)
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantListings.module.css` (updated)
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantSearchCard.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantSearchCard.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantProfileCard.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantProfileCard.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/TenantSearchCard.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/TenantProfileCard.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/pages/TenantListings.test.tsx`

---

### Task Group 8: Tenant Full Profile View
**Dependencies:** Task Group 7 (COMPLETED)
**Duration:** 6-8 hours
**Status:** ✅ COMPLETED

- [x] 8.1 Create TenantProfile.tsx page with route /broker/tenant-profile/:id
  - Hero section at top
  - Left column layout for content
  - Right sidebar for actions
  - Back button to tenant listings
  - Loading and error states
- [x] 8.2 Create TenantProfileView.tsx component
  - Hero section: cover image, circular logo with verified badge, company name, category, rating, social links
  - About section: company description with "view more" expand/collapse
  - Images section: 2x3 gallery grid, expandable to full view
  - Documents section: list of files with icons (PDF, image, doc), download links
  - Location section: interactive map placeholder, list of locations, per-location details (asset type, sqft, lease term)
- [x] 8.3 Create TenantRequestForm.tsx component - Right sidebar
  - Title: "Request administrative approval to add this tenant"
  - Description explaining process
  - Tenant email input with validation
  - Tenant Pin input (3-digit) with validation
  - "Send for Review" button (dark)
  - Loading state during submission
  - Success/error message display
- [x] 8.4 Create ContactCard.tsx component - Right sidebar
  - Avatar and name display
  - Company/role label
  - "Send Message" button (outlined)
  - "Submit Property" button (dark)
- [x] 8.5 Integrate with GET /api/broker/tenants/:id endpoint
  - Fetch full tenant profile on page load
  - Include images, documents, locations
  - Handle loading and error states
- [x] 8.6 Integrate with POST /api/broker/tenants/:id/request endpoint
  - Submit admin approval request
  - Validate email and PIN
  - Display confirmation or error
- [x] 8.7 Create TenantAboutSection.tsx component
  - Display company description
  - Expand/collapse for text longer than 500 characters
  - "view more" / "view less" toggle button
- [x] 8.8 Create TenantImagesGallery.tsx component
  - Grid layout for first 6 images
  - Lightbox/modal for full view
  - Navigation between images (prev/next)
  - Image counter display
  - Keyboard navigation support
  - "+X more" overlay when more than 6 images
- [x] 8.9 Create TenantDocumentsSection.tsx component
  - List of documents with file type icons (PDF, image, doc, xlsx)
  - File name display
  - Download button functionality
- [x] 8.10 Create TenantLocationsSection.tsx component
  - Map placeholder (ready for Google Maps/Mapbox integration)
  - List of locations with details
  - Location cards with asset type, sqft range, lease term
- [x] 8.11 Write component tests (3 test files)
  - Test TenantProfile page rendering and data fetching
  - Test TenantRequestForm validation and submission
  - Test TenantImagesGallery lightbox and navigation
- [x] 8.12 Update App.tsx with tenant-profile route

**Acceptance Criteria:**
- ✅ Full tenant profile displays correctly
- ✅ Hero section shows cover, logo, name, rating, social links
- ✅ About section expands/collapses for long text
- ✅ Images gallery displays in 2x3 grid
- ✅ Images gallery opens lightbox with navigation
- ✅ Documents section lists files with download links
- ✅ Locations section displays map placeholder and location details
- ✅ Admin approval request form validates and submits
- ✅ Contact card displays with action buttons
- ✅ Back button navigates to tenant listings
- ✅ Loading and error states handled properly
- ✅ Component tests pass
- ✅ Route added to App.tsx

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantProfile.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/pages/broker/TenantProfile.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantProfileView.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantProfileView.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantAboutSection.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantAboutSection.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantImagesGallery.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantImagesGallery.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantDocumentsSection.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantDocumentsSection.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantLocationsSection.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantLocationsSection.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantRequestForm.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/TenantRequestForm.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/ContactCard.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/ContactCard.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/pages/TenantProfile.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/TenantRequestForm.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/TenantImagesGallery.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/App.tsx` (updated with tenant-profile route)

---

## PHASE 4: LOCATION POSTING & AMENITIES

### Task Group 9: Post New Location Modal
**Dependencies:** Task Group 8 (COMPLETED)
**Duration:** 10-12 hours
**Status:** ✅ COMPLETED

- [x] 9.1 Create PostLocationModal.tsx - 2-step modal component
  - Step indicator showing "1 of 2" or "2 of 2"
  - Navigation: Cancel/Next (Step 1), Back/Preview (Step 2)
  - Modal backdrop and centered positioning
- [x] 9.2 Create Step 1: Space Requirements form
  - Listing Location Name input
  - Asset dropdown: Retail, Office, Industrial, etc.
  - Target move-in Date picker
  - Square Feet: Min/Max inputs with comma formatting
  - Lot Size (Acres): Min input
  - Monthly Budget: Min/Max inputs with dollar formatting
  - Preferred Lease Term dropdown: Short-term, Medium-term 3-5 years, Long-term
  - Locations of Interest: multi-select with tag chips (removable)
  - Interactive Map: toggle buttons (Market, Reduce, Draw), search by city, map visualization
- [x] 9.3 Create Step 2: Additional Features form
  - Grid of 40+ amenity checkboxes
  - 3 columns on desktop, 2 on tablet, 1 on mobile
  - Checkboxes for: Corporate location, 24/7, 2nd gen restaurant, ADA accessible, Dock types, Drive Thru, Parking, etc.
- [x] 9.4 Create LocationMapSelector.tsx component
  - Map integration (placeholder for Google Maps or Mapbox)
  - Drawing tools: Market, Reduce, Draw modes
  - Search by city autocomplete
  - Store drawn boundaries as GeoJSON
  - Save selected cities/areas
- [x] 9.5 Create AmenitiesCheckboxGrid.tsx component
  - Responsive grid layout
  - 41 checkbox options (all amenities from spec)
  - Select/deselect functionality
  - Scrollable grid container
- [x] 9.6 Create LocationTagInput.tsx component
  - Multi-select tag input with Enter to add
  - Display tags as removable chips
  - Backspace to remove last tag
  - Prevent duplicate entries
- [x] 9.7 Implement form validation
  - Required fields: location_name, asset_type
  - Range validation: sqft_min <= sqft_max, budget_min <= budget_max
  - Date validation: target_move_in in future
  - Inline error messages
- [x] 9.8 Integrate with POST /api/broker/locations endpoint
  - Submit all form data including amenities array, locations_of_interest array, map_boundaries GeoJSON
  - Handle success/error states
  - Loading state during submission
- [x] 9.9 Write component tests (71 tests total)
  - PostLocationModal tests (21 tests): modal rendering, step navigation, form validation, field formatting, submission, error handling
  - LocationTagInput tests (15 tests): rendering, adding locations, removing locations, keyboard shortcuts, accessibility
  - AmenitiesCheckboxGrid tests (12 tests): rendering all amenities, selection/deselection, dock amenities, specific categories
  - LocationMapSelector tests (23 tests): rendering, drawing modes, city search, selected areas management, GeoJSON generation

**Acceptance Criteria:**
- ✅ 2-step modal flow works smoothly
- ✅ All form fields function correctly with proper formatting
- ✅ Map drawing tools work (placeholder implementation ready for integration)
- ✅ Amenities grid displays and functions (41 amenities)
- ✅ Form validation works (required fields, range validation, date validation)
- ✅ Location submission works with API integration
- ✅ Multi-select tags work with LocationTagInput component
- ✅ All 71 component tests pass

**Files Created:**
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/PostLocationModal.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/PostLocationModal.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/LocationTagInput.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/LocationTagInput.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/LocationMapSelector.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/LocationMapSelector.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/AmenitiesCheckboxGrid.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/components/broker/AmenitiesCheckboxGrid.module.css`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/PostLocationModal.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/LocationTagInput.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/AmenitiesCheckboxGrid.test.tsx`
- `/home/anti/Documents/tenantlist/src/frontend/__tests__/components/LocationMapSelector.test.tsx`

---

## PHASE 5: ADVANCED FEATURES

### Task Group 10: Property Listings Integration
**Dependencies:** Task Group 4
**Duration:** 6-8 hours
**Status:** 🔄 PENDING

- [ ] 10.1 Enhance PropertyListings.tsx page (currently stub)
  - Reuse/adapt existing property listing components
  - Filter by property type, status, location
  - Search functionality
  - Infinite scroll or pagination
- [ ] 10.2 Integrate with broker-specific property endpoints
  - GET /api/broker/properties or similar
  - Filter and search query params
- [ ] 10.3 Write component tests (3-4 tests)

**Acceptance Criteria:**
- [ ] Property listings display correctly
- [ ] Filters and search work
- [ ] Pagination/infinite scroll works
- [ ] Component tests pass

---

### Task Group 11: Review Performance Dashboard
**Dependencies:** Task Group 4
**Duration:** 8-10 hours
**Status:** 🔄 PENDING

- [ ] 11.1 Enhance ReviewPerformance.tsx page (currently stub)
  - Performance metrics dashboard
  - Charts: deal tracking, conversion rates, response times
  - Time range selector
  - Export functionality
- [ ] 11.2 Integrate with performance API endpoint
  - GET /api/broker/performance or similar
  - Fetch metrics data
- [ ] 11.3 Implement charts (using recharts or similar)
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distributions
- [ ] 11.4 Write component tests (3-4 tests)

**Acceptance Criteria:**
- [ ] Performance dashboard displays metrics
- [ ] Charts render correctly
- [ ] Time range selection works
- [ ] Component tests pass

---

### Task Group 12: Listing Matches Algorithm
**Dependencies:** Task Group 7, 8, 10
**Duration:** 10-12 hours
**Status:** 🔄 PENDING

- [ ] 12.1 Enhance ListingMatches.tsx page (currently stub)
  - Display algorithm-based matches
  - Match cards with scores
  - Filter and sort options
  - Action buttons to connect parties
- [ ] 12.2 Implement matching algorithm
  - Property-tenant compatibility scoring
  - Filter matches by score threshold
- [ ] 12.3 Integrate with matches API endpoint
  - GET /api/broker/matches
  - Fetch match data
- [ ] 12.4 Write component tests (3-4 tests)

**Acceptance Criteria:**
- [ ] Matches display correctly
- [ ] Match scores calculated
- [ ] Filtering works
- [ ] Component tests pass

---

### Task Group 13: Invite Clients System
**Dependencies:** Task Group 4
**Duration:** 8-10 hours
**Status:** 🔄 PENDING

- [ ] 13.1 Enhance InviteClients.tsx page (currently stub)
  - Email invitation form
  - List of pending invitations
  - Status tracking (sent, opened, accepted)
  - Bulk invite functionality
- [ ] 13.2 Integrate with invitation API endpoint
  - POST /api/broker/invite-client
  - GET /api/broker/invitations for list
- [ ] 13.3 Implement email invitation system
  - Email template
  - Send invitations
  - Track status
- [ ] 13.4 Write component tests (3-4 tests)

**Acceptance Criteria:**
- [ ] Invitation form works
- [ ] Invitations send successfully
- [ ] Status tracking displays
- [ ] Component tests pass

---

## PHASE 6: WEBSOCKET & POLISH

### Task Group 14: WebSocket Integration
**Dependencies:** All previous task groups
**Duration:** 6-8 hours
**Status:** 🔄 PENDING

- [ ] 14.1 Create WebSocket hooks for broker dashboard
  - useBrokerDashboardWebSocket hook
  - Event listeners for broker-specific events
- [ ] 14.2 Implement WebSocket events
  - broker:tenant-approved - Notify when tenant request approved
  - broker:new-match - Notify of new property/tenant match
  - broker:team-member-joined - Notify when team member joins
  - broker:business-stats-updated - Notify when stats change
- [ ] 14.3 Integrate WebSocket with components
  - Real-time notifications
  - Auto-refresh on events
- [ ] 14.4 Write WebSocket tests (2-3 tests)

**Acceptance Criteria:**
- [ ] WebSocket connects successfully
- [ ] Events received and handled
- [ ] Components update in real-time
- [ ] WebSocket tests pass

---

### Task Group 15: Responsive Design & Polish
**Dependencies:** All previous task groups
**Duration:** 6-8 hours
**Status:** 🔄 PENDING

- [ ] 15.1 Test all pages on mobile (<768px)
  - Sidebar collapses to hamburger menu
  - Content adjusts to single column
  - Touch-friendly buttons
- [ ] 15.2 Test all pages on tablet (768-1024px)
  - Layout adjustments
  - Font sizes
- [ ] 15.3 Test all pages on desktop (>1024px)
  - Full three-column layout
  - Optimal spacing
- [ ] 15.4 Accessibility improvements
  - ARIA labels
  - Keyboard navigation
  - Focus states
- [ ] 15.5 Performance optimization
  - Code splitting
  - Lazy loading
  - Image optimization
- [ ] 15.6 Error handling polish
  - User-friendly error messages
  - Loading states
  - Empty states

**Acceptance Criteria:**
- [ ] All pages responsive across devices
- [ ] Accessibility standards met
- [ ] Performance optimized
- [ ] Error handling polished

---

## IMPLEMENTATION SUMMARY

**Completed:**
- ✅ Task Group 1: Database Schema & Migrations (9 migrations, 8+ models, 8 tests)
- ✅ Task Group 2: Backend Services Layer (5 services, 5 tests)
- ✅ Task Group 3: API Endpoints Layer (3 controllers, 15 endpoints, 6 integration tests)
- ✅ Task Group 4: Layout Structure & Routing (BrokerLayout, BrokerSidebar, 6 page stubs, App routing, 8 routing tests)
- ✅ Task Group 5: Business Profile Creation Modal (2-step modal, team management, image uploads, 24 tests)
- ✅ Task Group 6: Business Profile Selector & Stats (Context, Selector, StatsCard, Overview integration, 28 tests)
- ✅ Task Group 7: Tenant Listings & Search (TenantListings page, TenantSearchCard, TenantProfileCard, infinite scroll, 51 tests)
- ✅ Task Group 8: Tenant Full Profile View (TenantProfile page, ProfileView, About, Images, Documents, Locations, RequestForm, ContactCard, 3 test files, App routing update)
- ✅ Task Group 9: Post New Location Modal (2-step modal with map and amenities, LocationTagInput, LocationMapSelector, AmenitiesCheckboxGrid, 71 tests)

**In Progress:**
- None

**Pending:**
- Task Groups 10-15 (Advanced Features, WebSocket, Polish)

**Next Steps:**
- Begin Task Group 10: Property Listings Integration
- Implement advanced features and polish existing functionality
