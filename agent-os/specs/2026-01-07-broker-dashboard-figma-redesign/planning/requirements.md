# Broker Dashboard Figma Redesign - Requirements

## Overview
Complete rebuild of the broker flow to match Figma designs. This replaces the existing single-page broker dashboard with a comprehensive multi-page application featuring sidebar navigation, brokerage business profiles, team management, and public tenant profiles.

## User Decisions
1. **Navigation Architecture**: Implement full sidebar navigation as shown in Figma (multi-page structure) ✅
2. **Business Profile Model**: Implement full brokerage model with team management ✅
3. **Tenant Listings**: Public tenant profiles as shown in Figma (new data model) ✅
4. **KPI Cards**: Remove from main dashboard (not shown in Figma) ✅

## Figma Design Analysis

### 1. Navigation Structure
**Left Sidebar Menu Items:**
- Overview
- Tenant Listings
- Property Listings
- Review Performance
- Listing Matches
- Invite Clients

**Top Navigation:**
- Logo: "waltre" branding
- Navigation tabs: Dashboard, Find Tenants, Trends
- Right side: Messages icon, Notifications bell, User avatar
- Plan badge: "Free Plan"

**Layout:**
- Three-column layout: Sidebar (250px) | Main Content | Right Panel (350px)
- Responsive design considerations

### 2. Business Profile Creation Flow

**Multi-step Modal: "Create Business Profile"**

**Step 1 of 2: Basic Information**
- Cover image upload (recommended: 650x150px)
- Company logo upload (circular)
- Company name (e.g., "CBRE")
- Established year (e.g., "Est. 1996")
- Location (e.g., "Dallas, TX")
- Social media links: Website, Instagram, LinkedIn
- About section (rich text, expandable)
- Stats display:
  - Offices: --
  - Agents: --
  - Tenants: --
  - Properties: --

**Step 2 of 2: Team Management**
- "Invite team members" section
- Search field: "Find brokers, managers, and more"
- Team member cards showing:
  - Avatar
  - Name (e.g., "Jason Peters")
  - Location (e.g., "Dallas/Fort Worth")
  - Role selector: Broker, Admin, etc.
- Add/remove team members
- Buttons: "Back" (outlined) | "Create Brokerage Profile" (solid black)

### 3. Tenant Overview Dashboard (Main Page)

**Header:**
- Title: "Tenant Overview (5)"
- Subtitle: "Monitor your properties to seek tenant engagement"
- Action button: "+ Add Tenant" (dark button, top right)

**Main Content Card:**
- "Search for tenant profile"
- Subtitle: "Create your personal profile, you will then be able to create your business pages"
- Search input: "Search for Tenant"
- Empty state message: "Can't find your tenant?"
- Call-to-action: "Click the link below to create a new tenant and add expansion locations"
- Button: "Create New Tenant" (full width, dark)

**Right Sidebar:**
- "Select your business profile"
- Subtitle: "Create your personal profile, you will then be able to create your business pages"
- Search input: "Star" (search for businesses)
- Business list:
  - Starbucks Coffee (verified badge)
  - Starter Sweet Ice Cream
  - Startup Nation
  - Starjewel & Sons Legal
  - Starwood BBQ
- Empty state: "Can't find your business?"
- Button: "Create New Business" (dark)

### 4. Tenant Public Profile Page

**Hero Section:**
- Cover image (drinks/products)
- Company logo (circular, verified badge)
- Company name: "Starbucks Coffee"
- Subtitle: "Quick Service Retail"
- Rating: 4.8 ★ (245 Reviews)
- Social links: Website, Instagram, LinkedIn

**Left Column:**

**About Section:**
- Company description (expandable with "view more")
- Example: "Starbucks Corporation is a global coffee company and coffeehouse chain based in Seattle, Washington. Founded in 1971, Starbucks has grown into one of the world's most recognizable brands..."

**Images Section:**
- Gallery grid (2x3 layout)
- Interior photos, storefront, products
- Expandable to view all

**Documents Section:**
- File attachments:
  - OM-Flyer (PDF icon)
  - ExistingFloorPlans (image icon)

**Location Section:**
- Interactive map showing multiple locations
- Location list:
  - Los Altos Hills, CA
  - Atherton, CA
  - Palo Alto, CA
  - Menlo Park, CA
- Details per location:
  - Asset type dropdown
  - Sqft: Min - Max
  - Preferred Lease Term: X years

**Right Sidebar:**

**Request Administrative Approval Section:**
- Title: "Request administrative approval to add this tenant"
- Description: "To ensure quality control, all brokers seeking to add enterprise level tenants, must submit the tenant's 3 digit pin and email address for approval."
- Form fields:
  - Tenant email (input)
  - Tenant Pin (input)
  - "Send for Review" button (dark)

**Contact Listing Section:**
- Contact card:
  - Avatar: "Jason Peters"
  - Role: "CBRE"
- Action buttons:
  - "Send Message" (outlined)
  - "Submit Property" (dark)

### 5. Post New Location Modal

**2-Step Modal Flow:**

**Step 1 of 2: Describe your space needs and receive bids from property owners**

Form fields:
- Listing Location Name (text input, e.g., "San Fran Area")
- Asset* (dropdown: Retail, Office, etc.)
- Target move-in Date (date picker, e.g., "11/1/25")
- Square Feet:
  - Min (e.g., "1,000")
  - Max (e.g., "2,000")
- Lot Size (Acres):
  - Min (e.g., "1.67")
- Monthly Budget:
  - Min (e.g., "$10,000")
  - Max (e.g., "$15,000")
- Preferred Lease Term (dropdown: Medium-term 3-5 years)
- Locations of Interest* (multi-select tags):
  - Palo Alto ×
  - Los Altos Hills ×
  - Menlo Park ×
  - Atherton ×
- Interactive Map:
  - Toggle buttons: Market, Reduce, Draw
  - Search by city
  - Map visualization with selected areas
- Buttons: "Cancel" (outlined) | "Next" (dark)

**Step 2 of 2: Additional Features**

Extensive checkbox list (40+ amenities):
- 8 Corporate location
- 24/7
- 2nd generation restaurant
- 3 phase electrical
- ADA accessible
- Anchor tenants
- Asphalt/concrete ground
- Clear height 24'+
- Clear height 32'+
- Conference room
- Dock - cross dock
- Dock - double wide
- Dock - drive in ramp
- Dock - enclosed loading
- Dock - levelers
- Dock - truck lifts
- Dock - truck wells
- Drive Thru
- End cap
- ESFR
- Fencing & secure
- Freezer Capacity
- Glass store front
- Grease trap
- Hotel lobby
- Inline
- Liquor license
- On site amenities
- Dock - insulated
- Dock - loading sub
- Out parcel
- Parking
- Patio/outdoor seating
- Private suites
- Proximity to seaport/airport
- Public transportation
- Rail access
- Signage
- Wide truck court
- Dock - Ground level bays
- Refrigerator

Buttons: "Back" (outlined) | "Preview" (dark)

### 6. Additional Features Not Yet Visible

**Review Performance Page:**
- Analytics dashboard
- Performance metrics
- Deal tracking

**Listing Matches Page:**
- Algorithm-based property/tenant matching
- Match scores
- Recommendation engine

**Invite Clients Feature:**
- Email invitation system
- Client onboarding flow

## Technical Requirements

### Database Schema Changes

**1. Business Profiles Table (Brokerage Model)**
```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by_user_id UUID REFERENCES users(id) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,
  established_year INTEGER,
  location_city VARCHAR(100),
  location_state VARCHAR(2),
  about TEXT,
  website_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_profiles_user ON business_profiles(created_by_user_id);
```

**2. Business Team Members Table**
```sql
CREATE TABLE business_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  role VARCHAR(50) CHECK (role IN ('broker', 'manager', 'admin', 'viewer')),
  status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_profile_id, user_id)
);

CREATE INDEX idx_team_members_business ON business_team_members(business_profile_id);
CREATE INDEX idx_team_members_user ON business_team_members(user_id);
```

**3. Tenant Public Profiles Table**
```sql
CREATE TABLE tenant_public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  cover_image_url TEXT,
  logo_url TEXT,
  display_name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- e.g., "Quick Service Retail"
  about TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  website_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  tenant_pin VARCHAR(10) UNIQUE, -- 3-digit pin for broker verification
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_profiles_business ON tenant_public_profiles(business_id);
CREATE INDEX idx_tenant_profiles_pin ON tenant_public_profiles(tenant_pin);
```

**4. Tenant Profile Images Table**
```sql
CREATE TABLE tenant_profile_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_profile_id UUID REFERENCES tenant_public_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_images_tenant ON tenant_profile_images(tenant_profile_id);
```

**5. Tenant Profile Documents Table**
```sql
CREATE TABLE tenant_profile_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_profile_id UUID REFERENCES tenant_public_profiles(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type VARCHAR(50), -- 'pdf', 'image', 'doc', etc.
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_docs_tenant ON tenant_profile_documents(tenant_profile_id);
```

**6. Tenant Locations Table**
```sql
CREATE TABLE tenant_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_profile_id UUID REFERENCES tenant_public_profiles(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  asset_type VARCHAR(50),
  sqft_min INTEGER,
  sqft_max INTEGER,
  preferred_lease_term VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_locations_profile ON tenant_locations(tenant_profile_id);
```

**7. Broker Tenant Requests Table**
```sql
CREATE TABLE broker_tenant_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_user_id UUID REFERENCES users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  tenant_profile_id UUID REFERENCES tenant_public_profiles(id),
  tenant_email VARCHAR(255),
  tenant_pin VARCHAR(10),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_broker_requests_user ON broker_tenant_requests(broker_user_id);
CREATE INDEX idx_broker_requests_tenant ON broker_tenant_requests(tenant_profile_id);
```

**8. Business Profile Stats Table**
```sql
CREATE TABLE business_profile_stats (
  business_profile_id UUID PRIMARY KEY REFERENCES business_profiles(id) ON DELETE CASCADE,
  offices_count INTEGER DEFAULT 0,
  agents_count INTEGER DEFAULT 0,
  tenants_count INTEGER DEFAULT 0,
  properties_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**9. Space Requirements/Listings Enhancement**
```sql
-- Add amenities JSONB column to demand_listings
ALTER TABLE demand_listings
ADD COLUMN amenities JSONB DEFAULT '[]',
ADD COLUMN locations_of_interest JSONB DEFAULT '[]',
ADD COLUMN map_boundaries JSONB; -- Store drawn map boundaries

-- Add more detailed fields
ALTER TABLE demand_listings
ADD COLUMN lot_size_min DECIMAL(10,2),
ADD COLUMN lot_size_max DECIMAL(10,2),
ADD COLUMN monthly_budget_min DECIMAL(10,2),
ADD COLUMN monthly_budget_max DECIMAL(10,2);
```

### Frontend Component Structure

```
src/frontend/
├── pages/
│   ├── broker/
│   │   ├── BrokerLayout.tsx                 # Main layout with sidebar
│   │   ├── Overview.tsx                     # Dashboard overview
│   │   ├── TenantListings.tsx              # Tenant overview (main page)
│   │   ├── PropertyListings.tsx            # Property listings page
│   │   ├── ReviewPerformance.tsx           # Analytics
│   │   ├── ListingMatches.tsx              # Matching engine
│   │   ├── InviteClients.tsx               # Client invitations
│   │   └── TenantProfile.tsx               # Public tenant profile view
│   └── ...
├── components/
│   ├── broker/
│   │   ├── BrokerSidebar.tsx               # Left navigation sidebar
│   │   ├── BusinessProfileModal.tsx         # 2-step creation modal
│   │   ├── BusinessProfileSelector.tsx      # Right sidebar selector
│   │   ├── TenantSearchCard.tsx            # Main search card
│   │   ├── TenantProfileCard.tsx           # Tenant list item
│   │   ├── TenantProfileView.tsx           # Full profile display
│   │   ├── PostLocationModal.tsx           # 2-step location modal
│   │   ├── TenantRequestForm.tsx           # Admin approval form
│   │   ├── ContactCard.tsx                 # Contact info card
│   │   ├── LocationMapSelector.tsx         # Interactive map component
│   │   └── AmenitiesCheckboxGrid.tsx       # 40+ amenities selection
│   └── ...
└── ...
```

### Backend API Endpoints

```typescript
// Business Profile Management
POST   /api/broker/business-profiles              // Create brokerage profile
GET    /api/broker/business-profiles              // List user's business profiles
GET    /api/broker/business-profiles/:id          // Get specific profile
PUT    /api/broker/business-profiles/:id          // Update profile
DELETE /api/broker/business-profiles/:id          // Delete profile
POST   /api/broker/business-profiles/:id/team     // Add team member
DELETE /api/broker/business-profiles/:id/team/:memberId // Remove team member
GET    /api/broker/business-profiles/:id/stats    // Get profile stats

// Tenant Public Profiles
GET    /api/broker/tenants                        // Search public tenant profiles
GET    /api/broker/tenants/:id                    // Get tenant profile
POST   /api/broker/tenants/:id/request            // Request admin approval
GET    /api/broker/tenants/:id/locations          // Get tenant locations
POST   /api/broker/tenants/:id/contact            // Contact tenant

// Tenant Profile Management (for tenants to create their profiles)
POST   /api/tenant/profile                        // Create public profile
PUT    /api/tenant/profile/:id                    // Update profile
POST   /api/tenant/profile/:id/images             // Upload images
POST   /api/tenant/profile/:id/documents          // Upload documents
POST   /api/tenant/profile/:id/locations          // Add location

// Location/Space Requirements
POST   /api/broker/locations                      // Post new location requirement
PUT    /api/broker/locations/:id                  // Update location
GET    /api/broker/locations                      // List locations

// Matching & Performance
GET    /api/broker/matches                        // Get property/tenant matches
GET    /api/broker/performance                    // Get performance metrics
POST   /api/broker/invite-client                  // Send client invitation
```

### WebSocket Events (Updated)

```typescript
// Add new broker-specific events
'broker:tenant-approved'         // Tenant request approved
'broker:new-match'               // New property/tenant match found
'broker:team-member-joined'      // Team member accepted invite
'broker:business-stats-updated'  // Business stats changed
```

## Design System Alignment

### Typography
- Primary font: SF Pro (already configured)
- Headings: SF Pro Display
- Body: SF Pro Text

### Colors
```css
--broker-primary: #1a1a1a;      /* Dark buttons */
--broker-secondary: #f5f5f5;    /* Light backgrounds */
--broker-accent: #4a90e2;       /* Links, active states */
--broker-border: #e0e0e0;       /* Card borders */
--broker-text-primary: #1a1a1a;
--broker-text-secondary: #666666;
--broker-verified: #1da1f2;     /* Verified badge */
```

### Spacing
- Sidebar width: 250px
- Right panel width: 350px
- Card padding: 24px
- Grid gap: 16px
- Section margin: 32px

### Components
- Buttons: Rounded (8px), primary (dark), secondary (outlined)
- Cards: White background, 1px border, 8px radius, subtle shadow
- Modals: 600px max-width, overlay backdrop
- Inputs: 40px height, 8px radius, focus state

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Database migrations (all new tables)
- Sidebar navigation component
- Layout restructure (3-column)
- Routing updates (multi-page structure)

### Phase 2: Business Profiles (Week 1-2)
- Business profile creation modal (2 steps)
- Team member management
- Profile stats calculation
- Business selector component

### Phase 3: Tenant System (Week 2-3)
- Tenant public profiles data model
- Tenant overview dashboard
- Tenant search functionality
- Public profile view page
- Admin approval workflow

### Phase 4: Location Management (Week 3)
- Post new location modal (2 steps)
- Amenities system (40+ options)
- Map integration for location selection
- Location of interest multi-select

### Phase 5: Advanced Features (Week 4)
- Property listings page (reuse/adapt existing)
- Listing matches algorithm
- Review performance dashboard
- Invite clients system

### Phase 6: Polish & Testing (Week 4)
- WebSocket integration
- Responsive design
- Error handling
- Comprehensive testing
- Performance optimization

## Success Criteria

1. ✅ Sidebar navigation matches Figma exactly
2. ✅ Business profile creation flow (2 steps) works end-to-end
3. ✅ Team member invitations and management functional
4. ✅ Tenant public profiles display correctly
5. ✅ Admin approval workflow for broker/tenant connections
6. ✅ Post location modal (2 steps) with all 40+ amenities
7. ✅ Map-based location selection works
8. ✅ All 6 sidebar menu pages implemented
9. ✅ Multi-business profile selection works
10. ✅ Design system alignment (SF Pro fonts, colors, spacing)

## Open Questions

1. Should we preserve any of the existing broker KPI functionality somewhere?
2. How should the matching algorithm work (simple vs ML-based)?
3. Email service integration for team invitations?
4. Image upload service/storage solution?
5. Map service provider (Google Maps vs Mapbox)?
6. Should tenants self-create profiles or admin-created?
7. Payment/subscription model for business profiles?

## References

- Figma Design: https://www.figma.com/design/Md1EmqiuOBiFMhqZaz1i5w/Waltre?node-id=0-1
- Existing Broker Dashboard: `/src/frontend/pages/BrokerDashboard.tsx`
- Design Tokens: `/src/frontend/styles/design-tokens.css`
- Current Database Schema: `/src/database/migrations/`
