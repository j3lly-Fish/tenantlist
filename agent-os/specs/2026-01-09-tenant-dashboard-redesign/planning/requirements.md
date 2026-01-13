# Tenant Dashboard Redesign - Requirements

## Overview
Redesign the tenant dashboard to include business profile onboarding with blur overlay, global business search functionality, and rebrand the project from "zyx" to "waltre". This spec focuses on improving the tenant onboarding flow and business profile management.

## User Decisions & Requirements

### 1. Business Profile Blur Overlay (Image 12 & 14)
**Requirement:** The tenant dashboard should be blurred until a business profile is set up.

**Visual Requirements:**
- When tenant first accesses dashboard and has no business profile:
  - Entire dashboard content (metrics, listings, etc.) should be blurred/obscured
  - Overlay should be clearly visible on top of blurred content
  - Call-to-action should be prominent and centered

**Empty State (Image 14):**
- Title: "Begin your journey"
- Subtitle: "Add your businesses and space needs so landlords can begin sending you locations."
- Button: "+ Add Business" (dark button, centered)
- Background: Blurred dashboard content visible behind overlay
- Design: Clean, minimal, focused on single action

### 2. Global Business Search
**Requirement:** Business profile search should be accessible when adding a business and should search ALL businesses added by any user in the system.

**Search Functionality:**
- Search modal/dropdown appears when clicking "+ Add Business"
- Title: "Select your business profile"
- Subtitle: "Create your personal profile, you will then be able to create your business pages"
- Search input: "Search for your business" with search icon
- Results: Display all matching businesses from entire database (not just user's businesses)
- Empty state: "Can't find your business?"
- Button: "Create New Business" (dark button)

**Business Search Results Should Show:**
- Company name
- Company logo (if available)
- Location/city (optional)
- Any verification badge

### 3. Duplicate Business Prevention Flow
**Requirement:** If user tries to create a business that already exists, prevent duplication and guide them to use existing business.

**Flow:**
- User searches for business in search modal
- If business found: User can select existing business to add to their portfolio
- If business not found: User clicks "Create New Business"
- System checks if business name already exists globally before creation
- If duplicate detected: Show message "This business already exists. Please search for and select the existing business."
- If no duplicate: Proceed with business profile creation flow

### 4. Business Profile Creation Flow Integration
**Requirement:** When "Create New Business" is clicked and business doesn't exist, flow into full business profile creation.

**Creation Flow (from Image 12 - Account Creation):**
- Modal/page title: "Create Your Personal Account"
- Subtitle: "Create your personal profile, you will then be able to create your business profile"

**Form Fields:**
- Profile Picture: Upload button (320x320 JPG, PNG, or GIF, max 10 MB)
- First Name* (required)
- Last Name* (required)
- Company Name* (required) - with autocomplete search
- Phone Number* (required)
- E-mail* (required)

**Button:** "Create Personal Account" (dark button, full width)

**Note:** This form creates the user's personal account first, then proceeds to business profile creation in next step.

### 5. Project Rebranding: "zyx" → "waltre"
**Requirement:** Change all instances of "zyx" branding to "waltre" throughout the application.

**Scope of Rebranding:**
- Logo: Update from "zyx" to "waltre" (with icon: waltre🔍)
- Application name in all UI locations
- Page titles and meta tags
- Environment variables (VITE_APP_NAME)
- Documentation and comments
- Email templates (if any)
- Error messages and notifications
- Database seed data (if contains "zyx")

**Areas to Update:**
- Top navigation logo
- Login page
- Dashboard headers
- Footer (if exists)
- Browser tab title
- Email signatures
- README files
- Package.json project name
- Docker container names (consider for future, not urgent)

### 6. Tenant Dashboard Structure (from Images)

**Dashboard Menu (Left Sidebar):**
- Overview
- My Businesses
- Review Performance
- Listing Matches
- Invite Clients

**Top Navigation:**
- Logo: "waltre" with icon
- Navigation tabs: Dashboard, Find Tenants, Trends
- Right side: Messages, Notifications, User avatar

**Overview Page (Image 12 - when businesses exist):**
- Profile Overview section
- Businesses list (e.g., "Rocco's Tacos", "Cocono Grove", "George's Barbershop")
- Performance Metrics (Property listings, Avg listings, Viewcount, DTR%)
- Listing Matches table
- Brokers and Teammates section

**My Businesses Page (Image 14 - empty state):**
- Title: "Portfolio Overview (5)" with count
- Subtitle: "Monitor your properties to seek tenant engagement"
- Button: "+ Add Business" (top right)
- Empty state when no businesses: "Begin your journey" overlay

## Technical Requirements

### Database Changes
**No new tables required** - using existing businesses table

**Businesses Table Enhancement:**
- Ensure `businesses` table has proper indexing for global search
- Add full-text search index on company_name if not exists
- Consider adding `created_by_user_id` to track original creator
- Add `is_global` flag to indicate if business is searchable globally

**User-Business Relationship:**
- Use existing `user_profiles.business_id` or create junction table if multiple businesses per user
- Junction table: `user_businesses` (user_id, business_id, role, added_at)

### Frontend Components to Create/Update

**New Components:**
1. **BusinessProfileBlurOverlay.tsx** - Blur overlay with CTA
2. **GlobalBusinessSearch.tsx** - Modal with global search functionality
3. **DuplicateBusinessWarning.tsx** - Warning message component
4. **PersonalAccountForm.tsx** - User personal profile creation form (from Image 12)

**Components to Update:**
1. **TenantDashboard.tsx** - Add blur overlay logic
2. **TopNavigation.tsx** - Update logo from "zyx" to "waltre"
3. **Login.tsx** - Update branding
4. All dashboard pages - Update any "zyx" references

**New Pages:**
1. **MyBusinesses.tsx** - Portfolio overview page (Image 14)

### API Endpoints

**Business Search:**
```typescript
GET /api/businesses/search?query={searchTerm}
// Returns all businesses matching search term (global search)
// Response: { businesses: [...], total: number }
```

**Check Business Exists:**
```typescript
POST /api/businesses/check-duplicate
// Body: { companyName: string }
// Response: { exists: boolean, business?: Business }
```

**Add Business to User Portfolio:**
```typescript
POST /api/user/businesses
// Body: { businessId: string }
// Response: { success: boolean, userBusiness: UserBusiness }
```

**Get User's Businesses:**
```typescript
GET /api/user/businesses
// Returns all businesses associated with current user
// Response: { businesses: Business[], count: number }
```

### Business Profile Gating Logic

**Check on Dashboard Mount:**
```typescript
useEffect(() => {
  const checkBusinessProfile = async () => {
    const userBusinesses = await getUserBusinesses();
    if (userBusinesses.length === 0) {
      setShowBlurOverlay(true);
    }
  };
  checkBusinessProfile();
}, []);
```

**Blur Overlay State:**
- Show when: `userBusinesses.length === 0`
- Hide when: User has at least 1 business associated
- Persist state in context/session storage

### Design System Updates

**Branding Colors (maintain existing):**
- Primary: #1a1a1a (dark buttons, text)
- Secondary: #f5f5f5 (light backgrounds)
- Accent: #4a90e2 (links, highlights)

**New Components Styling:**
- Blur overlay: `backdrop-filter: blur(8px)` with semi-transparent background
- CTA card: White background, subtle shadow, centered
- Search modal: Max-width 500px, rounded corners 12px

**Typography:**
- Continue using SF Pro font family
- Overlay title: 32px, semi-bold
- Overlay subtitle: 16px, regular, color: #666

## Implementation Phases

### Phase 1: Rebranding (1-2 hours)
- Find and replace "zyx" → "waltre" across codebase
- Update logo assets
- Update environment variables
- Update documentation
- Test all pages for missed references

### Phase 2: Business Profile Blur Overlay (2-3 hours)
- Create BusinessProfileBlurOverlay component
- Add business check logic to TenantDashboard
- Implement "Begin your journey" empty state
- Style blur effect and CTA card
- Add "+ Add Business" button functionality

### Phase 3: Global Business Search (3-4 hours)
- Create GlobalBusinessSearch modal component
- Implement backend global search endpoint
- Add search autocomplete/dropdown
- Display search results with business info
- Handle business selection (add to user's portfolio)
- Empty state: "Can't find your business?"

### Phase 4: Duplicate Prevention (2-3 hours)
- Implement check-duplicate endpoint
- Add duplicate detection before business creation
- Show warning message component
- Redirect to search if duplicate found
- Allow creation only if no duplicate exists

### Phase 5: Personal Account Form (2-3 hours)
- Create PersonalAccountForm component (Image 12)
- Implement profile picture upload
- Form validation for all fields
- Company name autocomplete integration
- Submit handler to create user profile

### Phase 6: My Businesses Page (2-3 hours)
- Create MyBusinesses page component
- Display user's business portfolio
- Show empty state with "Begin your journey" overlay
- Add "+ Add Business" button in header
- Implement business card/list view

## Success Criteria

1. ✅ All "zyx" references changed to "waltre" across application
2. ✅ Tenant dashboard shows blur overlay when no businesses associated
3. ✅ "Begin your journey" CTA displays correctly with blur effect
4. ✅ "+ Add Business" button opens global business search modal
5. ✅ Business search returns results from all businesses in database
6. ✅ Duplicate business prevention works correctly
7. ✅ Warning message shows if user tries to create existing business
8. ✅ Personal account form displays and functions correctly
9. ✅ My Businesses page shows portfolio overview
10. ✅ User can add existing businesses to their portfolio
11. ✅ Dashboard content unblurs after business is added

## Out of Scope (Future Enhancements)

- Business profile editing from My Businesses page
- Business portfolio analytics/metrics
- Business verification system
- Multi-business management dashboard
- Business transfer/ownership changes
- Business deletion/removal from portfolio
- Business activity feed/notifications
- Team member management within businesses

## References

- Image 12: Personal account creation form with contact information
- Image 13: Tenant dashboard with sidebar menu (blurred state example)
- Image 14: "Begin your journey" empty state with blur overlay
- Image 15: Business search modal with "Select your business profile"
- Existing Broker Dashboard: Similar sidebar pattern for consistency
- Design System: SF Pro fonts, existing color palette, design tokens
