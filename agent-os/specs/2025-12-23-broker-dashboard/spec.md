# Broker Dashboard Specification

## Overview
**Feature:** Broker Dashboard - Complete broker experience matching Figma design
**Date:** 2025-12-23
**Status:** Planning
**Priority:** High

The Broker Dashboard provides commercial real estate brokers with a unified interface to:
- Represent both tenants (manage QFPs/demands) and landlords (manage property listings)
- View all properties and tenant demands in one place
- Track deals and proposals across the pipeline
- Communicate with both tenants and landlords
- Manage their broker profile and company information

## Tech Stack
- **Frontend:** React 18 + TypeScript, CSS Modules, React Router v6
- **Backend:** Node.js + Express, PostgreSQL + Redis
- **Real-time:** WebSocket (Socket.io) with polling fallback
- **Design:** Figma design tokens from `/src/frontend/styles/design-tokens.css`

---

## User Stories

### As a broker, I want to:
1. **View my dashboard** with KPIs showing my performance metrics (active deals, response rate, commission pipeline, etc.)
2. **See all tenant demands (QFPs)** from tenants I represent or that match my criteria
3. **See all property listings** from landlords I represent or in my market
4. **Toggle between tenant view and landlord view** to focus on either side of deals
5. **Send QFPs on behalf of tenants** to landlords/properties
6. **Manage my broker profile** including company, license, specialties, and contact info
7. **Track deals in progress** with statuses (prospecting, touring, offer, signed)
8. **Receive real-time notifications** when tenants or landlords respond to proposals
9. **Message both tenants and landlords** within the platform
10. **Filter and search** properties and demands by location, size, type, price

---

## Architecture Overview

### Frontend Structure
```
/src/frontend/
  /pages/
    BrokerDashboard.tsx           # Main broker dashboard page
    BrokerDashboard.module.css
  /components/
    /BrokerDashboard/
      BrokerKPISection.tsx         # Broker-specific KPIs
      DualViewToggle.tsx           # Toggle: Tenant View | Landlord View
      TenantDemandsSection.tsx     # List of tenant QFPs
      PropertyListingsSection.tsx  # List of properties (reused from landlord)
      DealsSection.tsx             # Active deals pipeline
      BrokerProfileModal.tsx       # Edit broker profile
```

### Backend Structure
```
/src/
  /controllers/
    BrokerDashboardController.ts  # Broker dashboard logic
  /services/
    BrokerKPIService.ts           # Calculate broker KPIs
    BrokerDashboardEventService.ts # WebSocket events for broker
  /routes/
    dashboardRoutes.ts            # Already has /broker endpoint
  /database/
    /migrations/
      025-add-broker-profile.ts   # Broker profile table
```

---

## Figma Design Alignment

### Components from Figma "BROKER EXPERIENCE"

#### 1. Broker Dashboard Main View
- **Layout:** Similar to Tenant/Landlord dashboards
- **Header:** "Broker Dashboard" with broker name and company
- **KPIs:** 4 cards showing:
  - Active Deals
  - Commission Pipeline (total $ value)
  - Response Rate
  - Properties Matched

#### 2. Dual View Toggle
- **Position:** Below KPIs, above listings
- **Options:**
  - 🏢 Landlord View (show properties)
  - 👤 Tenant View (show demands/QFPs)
- **Style:** Segmented control (gray-700 active, white inactive)

#### 3. Tenant Demands Section (Tenant View)
- **List of tenant QFPs** with:
  - Tenant business name (or "Confidential" if stealth)
  - Location requirements
  - Sqft range
  - Property type
  - Budget range
  - Match score vs. properties
  - "Send QFP" button

#### 4. Property Listings Section (Landlord View)
- **Reuse PropertyCard** from landlord dashboard
- Show properties from brokers' portfolio
- "Share with Tenant" action

#### 5. Deals Section
- **Kanban-style view** (optional future phase)
- **Table view** showing:
  - Tenant name
  - Property address
  - Status (Prospecting, Touring, Offer, Signed)
  - Commission %
  - Value
  - Last activity

---

## Data Model

### Broker Profile (New Table)
```sql
CREATE TABLE broker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100),
  license_state VARCHAR(2),
  specialties TEXT[], -- e.g., ['retail', 'office', 'industrial']
  bio TEXT,
  website_url VARCHAR(500),
  years_experience INTEGER,
  total_deals_closed INTEGER DEFAULT 0,
  total_commission_earned NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Broker KPIs (Calculated)
```typescript
interface BrokerKPIs {
  activeDeals: number;           // Count of deals in progress
  commissionPipeline: number;    // Total $ value of pending commissions
  responseRate: string;          // % of messages responded to
  propertiesMatched: number;     // Total matches facilitated
  trend?: {
    activeDeals: TrendData;
    commissionPipeline: TrendData;
    responseRate: TrendData;
    propertiesMatched: TrendData;
  };
}
```

### Deals Table (New - Simplified for MVP)
```sql
CREATE TABLE broker_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_user_id UUID NOT NULL REFERENCES users(id),
  tenant_business_id UUID REFERENCES businesses(id),
  property_id UUID REFERENCES property_listings(id),
  demand_listing_id UUID REFERENCES demand_listings(id),
  status VARCHAR(50) DEFAULT 'prospecting',
    -- prospecting, touring, offer_submitted, signed, lost
  commission_percentage NUMERIC(5,2),
  estimated_commission NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);
```

---

## API Endpoints

### Existing:
- ✅ `GET /api/dashboard/broker` - Basic broker dashboard data

### New Endpoints Needed:
```typescript
// Broker KPIs
GET /api/dashboard/broker/kpis
Response: { kpis: BrokerKPIs }

// Broker profile
GET /api/broker/profile
PUT /api/broker/profile
POST /api/broker/profile (create if doesn't exist)

// Tenant demands (for broker view)
GET /api/broker/demands
Query params: ?page=1&limit=20&location=&type=&minSqft=&maxSqft=
Response: { demands: DemandListing[], total: number, hasMore: boolean }

// Properties (for broker view) - may reuse landlord endpoint
GET /api/broker/properties
Query params: ?page=1&limit=20&location=&type=&minSqft=&maxSqft=

// Deals
GET /api/broker/deals
POST /api/broker/deals (create new deal)
PUT /api/broker/deals/:id (update deal status)
DELETE /api/broker/deals/:id

// Send QFP on behalf of tenant
POST /api/broker/qfp/send
Body: { tenantBusinessId, propertyId, message }
```

---

## WebSocket Events

### Broker-specific events:
```typescript
// Server → Broker
'broker:deal-created'     // New deal created
'broker:deal-updated'     // Deal status changed
'broker:demand-matched'   // New tenant demand matches broker criteria
'broker:property-matched' // New property matches broker criteria
'broker:kpi-update'       // KPIs recalculated
```

---

## Frontend Components

### 1. BrokerDashboard.tsx
Main page component with:
- Top navigation
- Broker KPI cards
- Dual view toggle
- Conditional rendering of Tenant View or Landlord View
- WebSocket connection
- Infinite scroll for listings

### 2. BrokerKPISection.tsx
4 KPI cards:
- Active Deals (count)
- Commission Pipeline ($)
- Response Rate (%)
- Properties Matched (count)

### 3. DualViewToggle.tsx
Segmented control:
```tsx
<div className={styles.toggleContainer}>
  <button
    className={view === 'tenant' ? styles.active : ''}
    onClick={() => setView('tenant')}
  >
    👤 Tenant View
  </button>
  <button
    className={view === 'landlord' ? styles.active : ''}
    onClick={() => setView('landlord')}
  >
    🏢 Landlord View
  </button>
</div>
```

### 4. TenantDemandsSection.tsx
Table or card list showing:
- Tenant business name
- Location requirements
- Sqft range
- Property type
- Budget
- Match score
- "Send QFP" button

### 5. DealsSection.tsx (Future Phase)
Kanban or table view of active deals

### 6. BrokerProfileModal.tsx
Form to edit:
- Company name
- License number & state
- Specialties (checkboxes: Retail, Office, Industrial, etc.)
- Bio
- Website
- Years of experience

---

## Success Criteria

### MVP (Phase 1)
- [ ] Broker dashboard page renders at `/broker-dashboard`
- [ ] 4 KPI cards display with real data
- [ ] Dual view toggle switches between Tenant View and Landlord View
- [ ] Tenant View shows list of tenant demands/QFPs
- [ ] Landlord View shows list of properties
- [ ] WebSocket connection for real-time updates
- [ ] Broker profile modal functional
- [ ] Infinite scroll pagination
- [ ] Mobile responsive

### Future Phases
- [ ] Deals pipeline (Kanban view)
- [ ] Commission tracking
- [ ] Advanced matching algorithm for brokers
- [ ] Broker-specific notifications
- [ ] Analytics dashboard for brokers

---

## Design Tokens

Reuse existing design tokens from `/src/frontend/styles/design-tokens.css`:
- Colors: `--zyx-gray-700`, `--zyx-info`, etc.
- Typography: `--font-size-18`, `--font-weight-semibold`
- Spacing: `--spacing-24`, `--spacing-16`
- Shadows: `--shadow-modal`, `--shadow-card`
- Z-index: `--z-modal-backdrop`, `--z-modal`

---

## Dependencies

### Must be completed first:
- None (can start immediately)

### Reuses from existing dashboards:
- TopNavigation component
- ConnectionIndicator component
- KPICard component (styled for broker KPIs)
- PropertyCard component (from landlord dashboard)
- WebSocket infrastructure (useDashboardWebSocket hook)
- Infinite scroll hook (useInfiniteScroll)

---

## Testing Strategy

### Unit Tests
- BrokerKPIService calculations
- BrokerDashboardEventService event emissions
- API endpoint responses

### Integration Tests
- WebSocket connection for broker
- KPI updates on deal creation/update
- Dual view toggle functionality

### E2E Tests
- Broker logs in → sees dashboard
- Broker toggles view → sees different listings
- Broker edits profile → updates saved

---

## Performance Targets
- Dashboard initial load: <2 seconds
- KPI update latency: <500ms
- WebSocket reconnection: <3 seconds
- Cache hit rate: >90% (Redis)
- Infinite scroll: <300ms per page load

---

## Notes
- Broker dashboard follows same patterns as Tenant and Landlord dashboards for consistency
- "Dual view" is unique to brokers - allows them to switch context easily
- Deals pipeline is Phase 2 - MVP focuses on viewing demands and properties
- Commission tracking integration with accounting systems is future work

---

**End of Specification**
