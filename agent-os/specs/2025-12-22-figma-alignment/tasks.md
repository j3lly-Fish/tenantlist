# Task Breakdown: Figma Design Alignment

## Overview
Total Tasks: 14 Task Groups (56 individual tasks)

**Project Path:** `/home/anti/Documents/tenantlist/src/frontend/`
**Tech Stack:** React 18, TypeScript, CSS Modules, Vite

---

## Task List

### Critical Priority - Landing Page

#### Task Group 1: Public Navigation Header
**Dependencies:** None
**Complexity:** S (Small)
**Files to Create:**
- `src/frontend/components/PublicNavigation.tsx`
- `src/frontend/components/PublicNavigation.module.css`

- [x] 1.0 Complete public navigation header component
  - [x] 1.1 Write 3-5 focused tests for PublicNavigation
    - Test logo renders and links to home
    - Test navigation links render correctly (How It Works, Pricing)
    - Test Sign In and Get Started buttons are present
    - Test responsive mobile menu toggle
  - [x] 1.2 Create PublicNavigation component structure
    - Logo on left side
    - Navigation links: "How It Works", "Pricing"
    - Auth buttons: "Sign In" (text), "Get Started" (primary button)
    - Use existing `Logo.tsx` component
  - [x] 1.3 Style PublicNavigation with CSS Module
    - Sticky header positioning
    - Flexbox layout with space-between
    - Match Figma typography and spacing
    - Hover states for links
  - [x] 1.4 Add responsive behavior
    - Mobile hamburger menu for small screens
    - Collapse navigation links on mobile
  - [x] 1.5 Ensure PublicNavigation tests pass
    - Run only tests from 1.1
    - Verify component renders correctly

**Acceptance Criteria:**
- Navigation displays logo, links, and auth buttons
- Sticky positioning on scroll
- Responsive mobile menu works
- Links navigate to correct sections/modals

---

#### Task Group 2: Landing Page Hero Section
**Dependencies:** Task Group 1
**Complexity:** M (Medium)
**Files to Create:**
- `src/frontend/components/LandingPage/HeroSection.tsx`
- `src/frontend/components/LandingPage/HeroSection.module.css`

- [x] 2.0 Complete hero section component
  - [x] 2.1 Write 4-6 focused tests for HeroSection
    - Test headline "Get Listed" renders
    - Test subtext renders correctly
    - Test "Find Space" and "List Property" CTA buttons render
    - Test stats display (Avg. Applications, Properties Matched)
    - Test button click handlers are called
  - [x] 2.2 Create HeroSection component structure
    - "Get Listed" headline (h1)
    - Subtext: "Providing commercial real estate pros with value"
    - Two CTA buttons: "Find Space", "List Property"
    - Stats row: "Avg. Applications Per Listing: 24", "Properties Matched: 850+"
  - [x] 2.3 Style HeroSection with CSS Module
    - Large headline typography
    - Button styling (primary and secondary variants)
    - Stats badges with icons
    - Background gradient or image per Figma
  - [x] 2.4 Connect button actions
    - "Find Space" opens signup modal with Tenant role pre-selected
    - "List Property" opens signup modal with Landlord role pre-selected
  - [x] 2.5 Ensure HeroSection tests pass
    - Run only tests from 2.1

**Acceptance Criteria:**
- Hero section matches Figma layout
- Stats display correctly with proper formatting
- CTA buttons trigger appropriate modals
- Typography and spacing match design

---

#### Task Group 3: Landing Page Content Sections
**Dependencies:** Task Group 2
**Complexity:** L (Large)
**Files to Create:**
- `src/frontend/components/LandingPage/HowItWorks.tsx`
- `src/frontend/components/LandingPage/HowItWorks.module.css`
- `src/frontend/components/LandingPage/BenefitsTabs.tsx`
- `src/frontend/components/LandingPage/BenefitsTabs.module.css`
- `src/frontend/components/LandingPage/WhyChoose.tsx`
- `src/frontend/components/LandingPage/WhyChoose.module.css`
- `src/frontend/components/LandingPage/Testimonials.tsx`
- `src/frontend/components/LandingPage/Testimonials.module.css`
- `src/frontend/components/LandingPage/Footer.tsx`
- `src/frontend/components/LandingPage/Footer.module.css`
- `src/frontend/components/LandingPage/index.ts`

- [x] 3.0 Complete landing page content sections
  - [x] 3.1 Write 6-8 focused tests for landing page sections
    - Test HowItWorks renders 3 steps with icons
    - Test BenefitsTabs switches between Tenants/Landlords/Brokers
    - Test WhyChoose renders 4 feature cards
    - Test Testimonials renders 3 testimonial cards
    - Test Footer renders all link sections
  - [x] 3.2 Create HowItWorks component
    - Title: "How it Works"
    - Subtitle: "A simple, three-step process to find your perfect commercial space"
    - 3 step cards with icons:
      - Step 1: "Post Your Needs" - Describe your ideal space requirements
      - Step 2: "Get Matched Instantly" - Landlords and brokers send tailored property proposals
      - Step 3: "Review & Lease" - Message, compare options, and finalize agreements
  - [x] 3.3 Create BenefitsTabs component
    - "It's right for you" heading
    - "Get Started" button
    - 3 tabs: Tenants | Landlords | Brokers
    - Tab content shows tailored benefits list for each role
  - [x] 3.4 Create WhyChoose component
    - 4 feature cards in 2x2 grid:
      - Fast: Reduce leasing cycles
      - Data-Driven: Match scores and analytics
      - Secure: Verified users, encrypted communications
      - Flexible: Works for all property types
  - [x] 3.5 Create Testimonials component
    - "Hear It From Our Users" heading
    - 3 testimonial cards with quote, name, role, optional avatar
  - [x] 3.6 Create Footer component
    - Platform links: How It Works, Pricing, Our Users
    - For Landlords: List Property, Resources
    - Support: FAQ, Contact, Privacy Policy
    - Copyright notice
  - [x] 3.7 Style all sections with CSS Modules
    - Match Figma spacing, typography, colors
    - Responsive layouts for all breakpoints
  - [x] 3.8 Ensure landing page section tests pass
    - Run only tests from 3.1

**Acceptance Criteria:**
- All 5 sections render correctly
- Tab switching works in Benefits section
- Footer links are present (can be placeholder hrefs)
- All sections are responsive
- Visual design matches Figma

---

#### Task Group 4: Landing Page Integration
**Dependencies:** Task Groups 1-3
**Complexity:** M (Medium)
**Files to Modify:**
- `src/frontend/pages/Login.tsx`

- [x] 4.0 Integrate landing page into Login route
  - [x] 4.1 Write 3-5 focused tests for Login page integration
    - Test all landing sections render in correct order
    - Test navigation is present at top
    - Test scroll behavior works
    - Test modals open correctly from CTAs
  - [x] 4.2 Refactor Login.tsx to include landing page
    - Import all LandingPage components
    - Replace current simple gradient layout
    - Order: PublicNavigation > Hero > HowItWorks > Benefits > WhyChoose > Testimonials > Footer
  - [x] 4.3 Add section anchors for smooth scrolling
    - "How It Works" link scrolls to section
    - "Pricing" link scrolls to relevant section or separate page
  - [x] 4.4 Ensure Login component manages modal state
    - Sign In opens LoginModal
    - Get Started opens SignupModal
    - Role-specific CTAs pre-select role in SignupModal
  - [x] 4.5 Ensure Login page tests pass
    - Run only tests from 4.1

**Acceptance Criteria:**
- Login route displays full marketing landing page
- All sections visible and properly ordered
- Navigation links work (scroll or modal)
- Page is fully responsive
- Existing auth modal functionality preserved

---

### Critical Priority - Dashboard

#### Task Group 5: Dashboard KPI Cards
**Dependencies:** None
**Complexity:** M (Medium)
**Files to Modify:**
- `src/frontend/components/KPICard.tsx` (exists)
- `src/frontend/components/KPICard.module.css` (exists)
- `src/frontend/pages/Dashboard.tsx`
- `src/frontend/pages/Dashboard.module.css`

**Files to Create:**
- `src/frontend/components/KPICardsSection.tsx`
- `src/frontend/components/KPICardsSection.module.css`

- [x] 5.0 Complete dashboard KPI cards implementation
  - [x] 5.1 Write 4-6 focused tests for KPI cards
    - Test KPICardsSection renders 4 cards
    - Test each card displays label, value, and icon
    - Test loading state shows skeletons
    - Test error state is handled gracefully
    - Test responsive layout (2x2 on mobile, 4x1 on desktop)
  - [x] 5.2 Review and update existing KPICard component
    - Ensure it supports: label, value, icon, optional trend indicator
    - Add icon prop with default icons for each metric type
    - Style to match Figma (light background, subtle border)
  - [x] 5.3 Create KPICardsSection container component
    - Renders 4 KPICard components in a row
    - Props for: activeBusinesses, performance, responseRate, landlordViews
    - Grid layout: 4 columns on desktop, 2x2 on tablet/mobile
  - [x] 5.4 Add icons for each KPI type
    - Active Businesses: Building icon
    - Performance: Chart icon
    - Response Rate: Message icon
    - Landlord Views: Eye icon
  - [x] 5.5 Integrate KPICardsSection into Dashboard.tsx
    - Place at top of dashboard content area
    - Pass real data from dashboard state/API
    - Add loading state handling
  - [x] 5.6 Ensure KPI cards tests pass
    - Run only tests from 5.1

**Acceptance Criteria:**
- 4 KPI cards display at top of dashboard
- Each card shows label, large value number, icon
- Cards have light background with subtle border per Figma
- Responsive layout works correctly
- Real data populated from API

---

### Critical Priority - Messages

#### Task Group 6: Messages Table Layout
**Dependencies:** None
**Complexity:** XL (Extra Large)
**Files to Create:**
- `src/frontend/components/MessagesTable.tsx`
- `src/frontend/components/MessagesTable.module.css`
- `src/frontend/components/MessagesTableRow.tsx`
- `src/frontend/components/MessagesTableRow.module.css`

**Files to Modify:**
- `src/frontend/pages/Messages.tsx`
- `src/frontend/pages/Messages.module.css`

- [x] 6.0 Complete messages table layout implementation
  - [x] 6.1 Write 6-8 focused tests for messages table
    - Test MessagesTable renders table headers correctly
    - Test rows display Date, Broker, Landlord, Property Name, Address, Sqft, Location
    - Test row expansion toggle works (chevron click)
    - Test expanded view shows conversation messages
    - Test unread indicator badge displays
    - Test message content with avatar and timestamp renders
  - [x] 6.2 Create MessagesTable component
    - Table structure with columns: Date | Broker | Landlord | Property Name | Address | Sqft | Location
    - Sortable column headers
    - Chevron expand/collapse indicator on right
  - [x] 6.3 Create MessagesTableRow component
    - Collapsed state: single row with property/conversation summary
    - Expanded state: reveals conversation thread inline below row
    - Unread badge indicator
    - Click to expand/collapse
  - [x] 6.4 Create expanded conversation view
    - Messages show: avatar, timestamp, message content
    - Scrollable if many messages
    - Reply input at bottom of expanded section
  - [x] 6.5 Style table to match Figma
    - Alternating row colors or borders
    - Proper column widths
    - Hover state on rows
    - Expand animation
  - [x] 6.6 Refactor Messages.tsx to use table layout
    - Replace current chat-style sidebar + thread layout
    - Import and use MessagesTable component
    - Maintain existing message data fetching logic
  - [x] 6.7 Ensure messages table tests pass
    - Run only tests from 6.1

**Acceptance Criteria:**
- Messages display in table format, not chat bubbles
- Columns match spec: Date, Broker, Landlord, Property Name, Address, Sqft, Location
- Rows expand to show conversation inline
- Unread indicators work
- Responsive behavior on smaller screens

---

### Critical Priority - Property Detail

#### Task Group 7: Property Documentation Section
**Dependencies:** None
**Complexity:** S (Small)
**Files to Create:**
- `src/frontend/components/DocumentationSection.tsx`
- `src/frontend/components/DocumentationSection.module.css`

- [x] 7.0 Complete documentation section component
  - [x] 7.1 Write 3-4 focused tests for DocumentationSection
    - Test section title "Documentation" renders
    - Test 4 document links render with PDF icons
    - Test document links are clickable
    - Test empty state when no documents
  - [x] 7.2 Create DocumentationSection component
    - Section title: "Documentation"
    - List of document links with PDF icons
    - Props: documents array with name and url
    - Default documents for demo:
      - Aventura Park Blueprints.pdf
      - Zoning & Use Permits.pdf
      - Environmental Reports.pdf
      - Certificate of Occupancy.pdf
  - [x] 7.3 Style DocumentationSection with CSS Module
    - PDF icon before each link
    - Link hover state
    - Vertical list layout
    - Match existing PropertyDetail card styling
  - [x] 7.4 Ensure DocumentationSection tests pass
    - Run only tests from 7.1

**Acceptance Criteria:**
- Documentation section renders with title
- 4 PDF document links display with icons
- Links open in new tab
- Styled consistently with PropertyDetail page

---

#### Task Group 8: QFP (Quick Fire Proposal) Modal
**Dependencies:** Task Group 7
**Complexity:** XL (Extra Large)
**Files to Create:**
- `src/frontend/components/QFPModal.tsx`
- `src/frontend/components/QFPModal.module.css`

- [x] 8.0 Complete QFP modal implementation
  - [x] 8.1 Write 6-8 focused tests for QFPModal
    - Test modal opens when "Send QFP" button clicked
    - Test Business Name dropdown renders and is selectable
    - Test property info auto-populates
    - Test form sections render: Tenant Info, Property Info, Landlord's Work, Tenant's Work
    - Test additional terms textarea is present
    - Test "Preview QFP" button is present
    - Test form validation works
  - [x] 8.2 Create QFPModal component structure
    - Modal overlay and container
    - Business Name field (dropdown/select from user's businesses)
    - Property info section (auto-populated from property data)
    - Tenant Information section
    - Property Information section
    - Landlord's Work section (textarea)
    - Tenant's Work section (textarea)
    - Additional terms textarea
    - Broker information display
  - [x] 8.3 Implement form state management
    - Form fields with controlled inputs
    - Validation for required fields
    - Business selection populates tenant info
  - [x] 8.4 Add "Preview QFP" functionality
    - Preview button shows formatted QFP summary
    - Confirm/Edit flow before submission
  - [x] 8.5 Style QFPModal with CSS Module
    - Multi-column layout for form sections
    - Consistent input styling
    - Button styling (Preview, Cancel, Submit)
    - Match existing modal patterns (BusinessProfileModal, etc.)
  - [x] 8.6 Ensure QFPModal tests pass
    - Run only tests from 8.1

**Acceptance Criteria:**
- Modal opens from "Send QFP" button
- All form fields present and functional
- Business dropdown populated with user's businesses
- Property info auto-fills
- Preview functionality works
- Form validates before submission

---

#### Task Group 9: Property Gallery & Contact Sidebar
**Dependencies:** Task Groups 7, 8
**Complexity:** L (Large)
**Files to Create:**
- `src/frontend/components/PropertyGallery.tsx`
- `src/frontend/components/PropertyGallery.module.css`
- `src/frontend/components/ContactAgentSidebar.tsx`
- `src/frontend/components/ContactAgentSidebar.module.css`

**Files to Modify:**
- `src/frontend/pages/PropertyDetail.tsx`
- `src/frontend/pages/PropertyDetail.module.css`

- [x] 9.0 Complete property gallery and contact sidebar
  - [x] 9.1 Write 6-8 focused tests for gallery and sidebar
    - Test PropertyGallery renders hero image
    - Test 4 thumbnails render below hero
    - Test clicking thumbnail changes hero image
    - Test video thumbnail shows play icon overlay
    - Test ContactAgentSidebar renders agent photo, name, company
    - Test "Send Message", "Send QFP", "Decline" buttons present
  - [x] 9.2 Create PropertyGallery component
    - Large hero image (main view)
    - 4 thumbnail row below hero
    - Click thumbnail to change hero image
    - Video support with play icon overlay
    - "+4" indicator for additional images beyond 4
  - [x] 9.3 Create ContactAgentSidebar component
    - Agent profile photo
    - Agent name
    - Company name (e.g., "CBRE")
    - "Send Message" button (primary)
    - "Send QFP" button (secondary) - opens QFPModal
    - "Decline" button (tertiary/text)
  - [x] 9.4 Style components with CSS Modules
    - Gallery grid layout
    - Thumbnail hover effects
    - Sidebar card styling
    - Button variants (primary, secondary, text)
  - [x] 9.5 Integrate into PropertyDetail.tsx
    - Replace single image with PropertyGallery
    - Add ContactAgentSidebar in right column
    - Add DocumentationSection below property details
    - Wire up QFPModal to sidebar button
  - [x] 9.6 Ensure gallery and sidebar tests pass
    - Run only tests from 9.1

**Acceptance Criteria:**
- Image gallery with hero + thumbnails works
- Thumbnail click changes hero image
- Contact sidebar displays agent info
- All three action buttons present and functional
- QFP modal opens from sidebar
- Documentation section visible on property detail

---

### Medium Priority - Auth & Profile

#### Task Group 10: Signup Modal Updates
**Dependencies:** None
**Complexity:** M (Medium)
**Files to Modify:**
- `src/frontend/components/SignupModal.tsx`
- `src/frontend/components/AuthModals.css`

- [x] 10.0 Complete signup modal updates
  - [x] 10.1 Write 4-6 focused tests for SignupModal changes
    - Test role selection appears ABOVE email/password fields
    - Test role options have icons (Person, Building, Briefcase)
    - Test role labels match spec (Tenants/Franchisers, etc.)
    - Test role descriptions match spec
    - Test role selection is required before proceeding
  - [x] 10.2 Reorder form sections
    - Move role selection to top of modal (above email/password)
    - Add clear visual separation between role selection and credentials
  - [x] 10.3 Add icons to role options
    - Person icon for "Tenants / Franchisers"
    - Building icon for "Landlords / Asset Managers"
    - Briefcase icon for "Brokerage / Agents"
  - [x] 10.4 Update role labels and descriptions
    - "Tenants / Franchisers" - "List your brands and CRE demands"
    - "Landlords / Asset Managers" - "Manage vacancies and properties"
    - "Brokerage / Agents" - "Expand your network and deal pipeline"
  - [x] 10.5 Style role selection cards
    - Card-style selection (not radio buttons)
    - Selected state styling
    - Icon + label + description layout
  - [x] 10.6 Ensure SignupModal tests pass
    - Run only tests from 10.1

**Acceptance Criteria:**
- Role selection appears first in modal
- Each role has appropriate icon
- Labels and descriptions match spec
- Card-style selection with clear selected state
- Form flow works correctly with new order

---

#### Task Group 11: Business Card Cover Images
**Dependencies:** None
**Complexity:** M (Medium)
**Files to Modify:**
- `src/frontend/components/BusinessCard.tsx`
- `src/frontend/components/BusinessCard.module.css`

- [x] 11.0 Complete business card cover image support
  - [x] 11.1 Write 3-5 focused tests for BusinessCard updates
    - Test cover image renders as card background when provided
    - Test logo overlays in bottom-left corner
    - Test status badge overlays in top-right corner
    - Test gradient overlay is present for text readability
    - Test fallback when no cover image (current behavior)
  - [x] 11.2 Update Business type definition
    - Add `cover_image_url?: string` field
    - Ensure backward compatibility with existing data
  - [x] 11.3 Update BusinessCard component
    - Display cover image as full-bleed card background
    - Position logo in bottom-left corner as overlay
    - Position status badge in top-right as overlay
    - Add gradient overlay (dark to transparent) for text readability
  - [x] 11.4 Style cover image layout
    - Object-fit cover for image
    - Proper z-index layering
    - Gradient overlay CSS
    - Fallback styling when no cover image
  - [x] 11.5 Ensure BusinessCard tests pass
    - Run only tests from 11.1

**Acceptance Criteria:**
- Cover image displays as card background
- Logo and status badge properly overlaid
- Gradient ensures text readability
- Graceful fallback for cards without cover images
- No breaking changes to existing functionality

---

### Medium Priority - Navigation

#### Task Group 12: Navigation Enhancements
**Dependencies:** None
**Complexity:** S (Small)
**Files to Modify:**
- `src/frontend/components/TopNavigation.tsx`
- `src/frontend/components/TopNavigation.module.css`

- [x] 12.0 Complete navigation enhancements
  - [x] 12.1 Write 3-5 focused tests for TopNavigation updates
    - Test favorites (heart) icon renders before messages
    - Test notifications (bell) icon renders with badge counter
    - Test notification badge shows unread count
    - Test correct icon order: favorites, notifications, messages, tier, profile
  - [x] 12.2 Add favorites icon
    - Heart icon before messages icon
    - Click navigates to favorites page (or shows dropdown)
  - [x] 12.3 Add notifications icon with badge
    - Bell icon with notification badge
    - Badge shows unread count (hide if 0)
    - Click shows notifications dropdown or navigates to notifications
  - [x] 12.4 Style new navigation icons
    - Consistent icon sizing
    - Badge styling (red circle with white text)
    - Hover states
    - Proper spacing between icons
  - [x] 12.5 Ensure TopNavigation tests pass
    - Run only tests from 12.1

**Acceptance Criteria:**
- Heart icon (favorites) visible in navigation
- Bell icon (notifications) visible with badge
- Badge shows count, hidden when 0
- Icons properly spaced and styled
- Consistent with existing navigation style

---

### Minor Priority - Polish Items

#### Task Group 13: UI Polish and Minor Updates
**Dependencies:** None
**Complexity:** S (Small)
**Files to Modify:**
- Various component files

- [x] 13.0 Complete UI polish items
  - [x] 13.1 Write 4-6 focused tests for polish items
    - Test "Add Locations" button label (not "Manage Locations")
    - Test stealth mode toggle switch renders in dropdown
    - Test search placeholder is "Search Listings"
    - Test amenities display as checkmark list, not badges
  - [x] 13.2 Update button label
    - Change "Manage Locations" to "Add Locations"
    - Find all instances in codebase
  - [x] 13.3 Update stealth mode toggle
    - Replace text action with toggle switch in ThreeDotsMenu
    - Show toggle state visually (on/off)
  - [x] 13.4 Update search/filter UI
    - Placeholder: "Search Listings"
    - Style filter dropdown to match Figma
    - Add filter icon to dropdown
  - [x] 13.5 Update amenities display
    - Change from tag/badge style to checkmark list
    - Green checkmark icons
    - Two-column layout
  - [x] 13.6 Ensure polish tests pass
    - Run only tests from 13.1

**Acceptance Criteria:**
- Button label says "Add Locations"
- Stealth toggle is an actual switch component
- Search shows correct placeholder
- Amenities display as checkmark list in two columns
- Filter UI matches Figma design

---

### Testing & Integration

#### Task Group 14: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-13
**Complexity:** M (Medium)

- [x] 14.0 Review existing tests and fill critical gaps only
  - [x] 14.1 Review tests from Task Groups 1-13
    - Review tests written by each task group
    - Total existing tests: 114 tests (exceeds estimate of 55-75)
    - Document coverage by feature area
  - [x] 14.2 Analyze test coverage gaps for THIS feature only
    - Identify critical user workflows lacking test coverage
    - Focus ONLY on gaps related to Figma alignment features
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over unit test gaps
  - [x] 14.3 Write up to 10 additional strategic tests maximum
    - Added 5 new tests to fill identified critical gaps (FigmaAlignmentIntegration.test.tsx)
    - Focus on integration points:
      - Landing page to signup flow (2 tests)
      - PropertyDetail with all new sections (1 test)
      - Messages table data transformation (2 tests)
    - Skip edge cases and minor scenarios
  - [x] 14.4 Run feature-specific tests only
    - Run ONLY tests related to Figma alignment features
    - Do NOT run entire application test suite
    - Verify critical workflows pass (119/119 tests pass)
  - [x] 14.5 Document any remaining issues
    - Note any known limitations (see verification/test-coverage-summary.md)
    - List any deferred items (E2E tests, visual regression, a11y)

**Acceptance Criteria:**
- All feature-specific tests pass (119/119)
- Critical user workflows covered
- No more than 10 additional tests added (5 added)
- Testing focused exclusively on Figma alignment features

---

## Execution Order

### Phase 1: Critical Priority (Estimated: 5-7 days)
Execute in parallel where possible:

**Track A - Landing Page:**
1. Task Group 1: Public Navigation Header (S)
2. Task Group 2: Landing Page Hero Section (M)
3. Task Group 3: Landing Page Content Sections (L)
4. Task Group 4: Landing Page Integration (M)

**Track B - Dashboard & Messages:**
5. Task Group 5: Dashboard KPI Cards (M)
6. Task Group 6: Messages Table Layout (XL)

**Track C - Property Detail:**
7. Task Group 7: Property Documentation Section (S)
8. Task Group 8: QFP Modal (XL)
9. Task Group 9: Property Gallery & Contact Sidebar (L)

### Phase 2: Medium Priority (Estimated: 2-3 days)
10. Task Group 10: Signup Modal Updates (M)
11. Task Group 11: Business Card Cover Images (M)
12. Task Group 12: Navigation Enhancements (S)

### Phase 3: Minor Priority (Estimated: 1 day)
13. Task Group 13: UI Polish and Minor Updates (S)

### Phase 4: Testing & Validation (Estimated: 1 day)
14. Task Group 14: Test Review & Gap Analysis (M)

---

## Complexity Legend
- **S (Small):** 2-4 hours, single component, minimal dependencies
- **M (Medium):** 4-8 hours, multiple components or significant logic
- **L (Large):** 1-2 days, multiple components with complex interactions
- **XL (Extra Large):** 2-3 days, major feature with multiple sub-components

---

## File Summary

### New Files to Create (20 files):
```
src/frontend/components/PublicNavigation.tsx
src/frontend/components/PublicNavigation.module.css
src/frontend/components/LandingPage/HeroSection.tsx
src/frontend/components/LandingPage/HeroSection.module.css
src/frontend/components/LandingPage/HowItWorks.tsx
src/frontend/components/LandingPage/HowItWorks.module.css
src/frontend/components/LandingPage/BenefitsTabs.tsx
src/frontend/components/LandingPage/BenefitsTabs.module.css
src/frontend/components/LandingPage/WhyChoose.tsx
src/frontend/components/LandingPage/WhyChoose.module.css
src/frontend/components/LandingPage/Testimonials.tsx
src/frontend/components/LandingPage/Testimonials.module.css
src/frontend/components/LandingPage/Footer.tsx
src/frontend/components/LandingPage/Footer.module.css
src/frontend/components/LandingPage/index.ts
src/frontend/components/KPICardsSection.tsx
src/frontend/components/KPICardsSection.module.css
src/frontend/components/MessagesTable.tsx
src/frontend/components/MessagesTable.module.css
src/frontend/components/MessagesTableRow.tsx
src/frontend/components/MessagesTableRow.module.css
src/frontend/components/DocumentationSection.tsx
src/frontend/components/DocumentationSection.module.css
src/frontend/components/QFPModal.tsx
src/frontend/components/QFPModal.module.css
src/frontend/components/PropertyGallery.tsx
src/frontend/components/PropertyGallery.module.css
src/frontend/components/ContactAgentSidebar.tsx
src/frontend/components/ContactAgentSidebar.module.css
```

### Existing Files to Modify (12 files):
```
src/frontend/pages/Login.tsx
src/frontend/pages/Dashboard.tsx
src/frontend/pages/Dashboard.module.css
src/frontend/pages/Messages.tsx
src/frontend/pages/Messages.module.css
src/frontend/pages/PropertyDetail.tsx
src/frontend/pages/PropertyDetail.module.css
src/frontend/components/KPICard.tsx
src/frontend/components/KPICard.module.css
src/frontend/components/SignupModal.tsx
src/frontend/components/AuthModals.css
src/frontend/components/BusinessCard.tsx
src/frontend/components/BusinessCard.module.css
src/frontend/components/TopNavigation.tsx
src/frontend/components/TopNavigation.module.css
src/frontend/components/ThreeDotsMenu.tsx
src/frontend/components/SearchInput.tsx
src/frontend/components/FilterDropdown.tsx
```

---

## Success Criteria Summary
1. Landing page matches Figma design with all 7 sections
2. Dashboard shows 4 KPI cards with real data at top
3. Messages page displays in table format with expandable rows
4. Property detail includes documentation section and QFP functionality
5. Property detail has image gallery with thumbnails
6. Property detail has contact agent sidebar
7. Signup modal has correct order, icons, and labels
8. Business cards display cover images with overlays
9. Navigation includes favorites and notification icons
10. All minor polish items completed
11. All feature-specific tests pass
