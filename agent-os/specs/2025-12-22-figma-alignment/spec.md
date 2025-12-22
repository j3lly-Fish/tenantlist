# Figma Design Alignment Specification

## Overview
This spec documents the discrepancies between the Figma design (Waltre/ZYX Platform) and the current implementation, along with the required changes to achieve design parity.

**Figma File:** https://www.figma.com/design/Md1EmqiuOBiFMhqZaz1i5w/Waltre
**Project Path:** /home/anti/Documents/tenantlist/src/frontend/

## Tech Stack
- React 18 with TypeScript
- CSS Modules for styling
- React Router v6 for navigation
- Vite for build tooling

---

## Critical Priority Items

### 1. Landing Page Marketing Content
**Current State:** Simple gradient background with "ZYX Platform" text and "Get Started" button.
**Required State:** Full marketing landing page matching Figma.

#### Components Needed:
1. **Hero Section**
   - "Get Listed" headline
   - Subtext: "Providing commercial real estate pros with value"
   - Two CTA buttons: "Find Space" and "List Property"
   - Stats display: "Avg. Applications Per Listing: 24" and "Properties Matched: 850+"

2. **How It Works Section**
   - Title: "How it Works"
   - Subtitle: "A simple, three-step process to find your perfect commercial space"
   - 3 steps with icons:
     - "Post Your Needs" - Describe your ideal space requirements
     - "Get Matched Instantly" - Landlords and brokers send tailored property proposals
     - "Review & Lease" - Message, compare options, and finalize agreements

3. **Benefits Section (Tabbed)**
   - "It's right for you" heading
   - "Get Started" button
   - 3 tabs: Tenants | Landlords | Brokers
   - Each tab shows tailored benefits list

4. **Why Choose ZYX Section**
   - 4 feature cards in grid:
     - Fast: Reduce leasing cycles
     - Data-Driven: Match scores and analytics
     - Secure: Verified users, encrypted communications
     - Flexible: Works for all property types

5. **Testimonials Section**
   - "Hear It From Our Users"
   - 3 testimonial cards with quotes, names, roles

6. **Footer**
   - Platform links: How It Works, Pricing, Our Users
   - For Landlords: List Property, Resources
   - Support: FAQ, Contact, Privacy Policy

7. **Public Navigation Header**
   - Logo, "How It Works", "Pricing", "Sign In", "Get Started" button

### 2. Dashboard KPI Cards
**Current State:** No KPI cards displayed on dashboard.
**Required State:** 4 KPI metric cards at top of dashboard.

#### KPI Cards Layout:
| Card | Label | Icon | Value Source |
|------|-------|------|--------------|
| 1 | Active Businesses | Building icon | Count of active businesses |
| 2 | Performance | Chart icon | Performance score |
| 3 | Response Rate | Message icon | Percentage |
| 4 | Landlord Views | Eye icon | View count |

Each card should have:
- Label text (top)
- Large value number
- Icon (right side)
- Light background with subtle border

### 3. Messages Page Table Layout
**Current State:** Chat-style with sidebar conversation list + message thread bubbles.
**Required State:** Table-based layout with expandable rows.

#### Table Structure:
- Columns: Date | Broker | Landlord | Property Name | Address | Sqft | Location
- Each row is expandable (chevron on right)
- Expanded view shows conversation messages inline
- Messages show: avatar, timestamp, message content
- Row has unread indicator badge

### 4. Property Detail - Documentation Section
**Current State:** Not implemented.
**Required State:** Documentation section with PDF links.

#### Documentation Section:
- Section title: "Documentation"
- 4 document links with PDF icons:
  - Aventura Park Blueprints.pdf
  - Zoning & Use Permits.pdf
  - Environmental Reports.pdf
  - Certificate of Occupancy.pdf

### 5. Property Detail - QFP (Quick Fire Proposal) Form
**Current State:** Not visible on property detail page.
**Required State:** "Send QFP" button that opens QFP modal.

#### QFP Modal Contents:
- Business Name field (dropdown/select)
- Property info (auto-populated)
- Tenant Information section
- Property Information section
- Landlord's Work section (textarea)
- Tenant's Work section (textarea)
- Additional terms textarea
- Broker information
- "Preview QFP" button
- Submit flow with tenant email approval step

---

## Medium Priority Items

### 6. Signup Modal Updates
**Current State:** Email/Password first, then role selection with basic labels.
**Required State:** Role selection first with icons and detailed descriptions.

#### Changes:
- Reorder: Role selection ABOVE email/password fields
- Add icons to each role option:
  - Person icon for Tenants
  - Building icon for Landlords
  - Briefcase icon for Brokers
- Update role labels:
  - "Tenants / Franchisers" (was "Tenant")
  - "Landlords / Asset Managers" (was "Landlord")
  - "Brokerage / Agents" (was "Broker")
- Update descriptions:
  - "List your brands and CRE demands"
  - "Manage vacancies and properties"
  - "Expand your network and deal pipeline"

### 7. Business Card Cover Images
**Current State:** Logo only with placeholder fallback.
**Required State:** Full-bleed cover image showing business/restaurant interior.

#### Changes:
- Add `cover_image_url` field to Business type
- Display cover image as card background
- Logo overlaid in bottom-left corner
- Status badge overlaid in top-right
- Gradient overlay for text readability

### 8. Property Image Gallery
**Current State:** Single image display.
**Required State:** Hero image with thumbnail row below.

#### Gallery Features:
- Large hero image (main view)
- 4 thumbnails below hero
- Click thumbnail to change hero
- Support for video (play icon overlay on video thumbnails)
- "+4" indicator for additional images

### 9. Contact Agent Sidebar
**Current State:** Contact info in detail cards.
**Required State:** Dedicated sidebar with agent profile.

#### Sidebar Contents:
- Agent profile photo
- Agent name
- Company name (e.g., "CBRE")
- "Send Message" button (primary)
- "Send QFP" button (secondary)
- "Decline" button (tertiary/text)

### 10. Navigation Enhancements
**Current State:** Messages icon, tier badge, profile dropdown.
**Required State:** Add favorites and notifications.

#### Changes:
- Add heart icon (favorites) before messages
- Add bell icon (notifications) with badge counter
- Notification badge shows unread count

---

## Minor Priority Items

### 11. Button Label Alignment
- Change "Manage Locations" to "Add Locations"
- Ensure consistent CTA text across components

### 12. Stealth Mode Toggle
- Replace text action with actual toggle switch in dropdown menu
- Show toggle state visually

### 13. Search/Filter UI Polish
- Update placeholder: "Search Listings"
- Style filter dropdown to match Figma
- Add filter icon to dropdown

### 14. Amenities Display Style
- Change from tag/badge style to checkmark list
- Green checkmark icons
- Two-column layout

---

## File Structure Reference

### Pages to Modify:
- `src/frontend/pages/Login.tsx` - Add landing page content
- `src/frontend/pages/Dashboard.tsx` - Add KPI cards
- `src/frontend/pages/Messages.tsx` - Restructure to table layout
- `src/frontend/pages/PropertyDetail.tsx` - Add documentation, QFP, gallery, sidebar

### Components to Create:
- `src/frontend/components/LandingPage/` - Hero, HowItWorks, Benefits, WhyChoose, Testimonials, Footer
- `src/frontend/components/KPICard.tsx` - Individual KPI card (may already exist)
- `src/frontend/components/KPICardsSection.tsx` - Container for 4 KPI cards
- `src/frontend/components/MessagesTable.tsx` - Table-based message view
- `src/frontend/components/PropertyGallery.tsx` - Image gallery with thumbnails
- `src/frontend/components/ContactAgentSidebar.tsx` - Agent contact sidebar
- `src/frontend/components/DocumentationSection.tsx` - PDF links section
- `src/frontend/components/QFPModal.tsx` - Quick Fire Proposal modal
- `src/frontend/components/PublicNavigation.tsx` - Public-facing nav header

### Components to Modify:
- `src/frontend/components/SignupModal.tsx` - Role icons, labels, order
- `src/frontend/components/BusinessCard.tsx` - Cover image support
- `src/frontend/components/TopNavigation.tsx` - Add favorites, notifications
- `src/frontend/components/ThreeDotsMenu.tsx` - Stealth toggle switch

---

## Success Criteria
1. Landing page matches Figma design with all sections
2. Dashboard shows 4 KPI cards with real data
3. Messages page displays in table format with expandable rows
4. Property detail includes documentation and QFP functionality
5. Signup modal has correct order, icons, and labels
6. Business cards display cover images
7. Navigation includes favorites and notification icons
