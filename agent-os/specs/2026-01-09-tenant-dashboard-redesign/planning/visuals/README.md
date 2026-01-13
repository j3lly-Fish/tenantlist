# Visual Assets - Tenant Dashboard Redesign

## Overview
The user provided 4 key screenshots showing the desired tenant dashboard design with business profile onboarding flow.

## Image Descriptions

### Image 12: Personal Account Creation Form
**File reference:** account-creation.png (user-provided screenshot)

**Key Elements:**
- Page title: "Create Your Personal Account"
- Subtitle: "Create your personal profile, you will then be able to create your business profile"
- Background: Shows blurred tenant dashboard in background
- Logo: "zyx" in top left (should be changed to "waltre")
- Top nav: Dashboard, Applications tabs, Free Plan badge

**Form Fields:**
- Profile Picture upload section
  - Placeholder avatar icon
  - Link: "Upload Profile Image"
  - Format: 320x320 (JPG, PNG, or GIF, max 10 MB)
- Your Contact Information section:
  - First Name* (placeholder: "John")
  - Last Name* (placeholder: "Williams")
  - Company Name* (placeholder: "Search existing companies or add new")
  - Phone Number* (placeholder: "(310) 123 4567")
  - E-mail* (placeholder: "email@company.com")
- Submit button: "Create Personal Account" (dark, full width)

**Dashboard Metrics Visible (blurred in background):**
- Tenant Dashboard header
- Subtitle: "Manage your space requirements and track proposals"
- Active Listings: 0
- Landlord Views: 0

### Image 13: Tenant Dashboard - Sidebar Navigation (Blurred State)
**File reference:** tt-dashboard-overview-start.png

**Key Elements:**
- Logo: "waltre" with search icon
- Top nav: Dashboard, Find Tenants, Trends
- Right nav: Messages, Notifications, Profile avatar
- Left sidebar: "DASHBOARD MENU"
  - Overview
  - My Businesses
  - Review Performance
  - Listing Matches
  - Invite Clients

**Main Content (Blurred):**
- Profile Overview section
- Businesses list showing:
  - Rocco's Tacos (Joy)
  - Cocono Grove (Store)
  - George's Barbershop (Barber)
- Performance Metrics:
  - Property listings: 1,234 (Messages, Avg)
  - Viewcount: 197 (67%)
  - DTR%: 46
- Listing Matches table
- Brokers and Teammates section

**Purpose:** Shows what dashboard looks like with content (should be blurred until business profile setup)

### Image 14: My Businesses Page - Empty State with Blur Overlay
**File reference:** tt-dashboard-my-businesses-start.png

**Key Elements:**
- Same header and sidebar as Image 13
- Page title: "Portfolio Overview (5)"
- Subtitle: "Monitor your properties to seek tenant engagement"
- Button: "+ Add Business" (top right, dark button)

**Main Content - Empty State:**
- Centered overlay card with blur effect
- Title: "Begin your journey"
- Subtitle: "Add your businesses and space needs so landlords can begin sending you locations."
- Button: "+ Add Business" (dark, centered)

**Background:** Dashboard content is visible but blurred

**Purpose:** This is the target design for the blur overlay state

### Image 15: Business Search Modal
**File reference:** business-search-modal.png

**Key Elements:**
- Modal title: "Select your business profile"
- Subtitle: "Create your personal profile, you will then be able to create your business pages"
- Search input: "Search for your business" with search icon
- Empty state message: "Can't find your business?"
- Button: "Create New Business" (dark, centered)

**Purpose:** Shows the global business search interface that appears when clicking "+ Add Business"

## Design Patterns to Follow

### Blur Overlay Effect
- Use `backdrop-filter: blur(8px)`
- Semi-transparent white overlay: `rgba(255, 255, 255, 0.8)`
- Center content vertically and horizontally
- Card styling: white background, rounded corners (12px), subtle shadow

### Branding Update
- Replace all "zyx" with "waltre"
- Logo includes search icon: "waltre 🔍"
- Maintain existing color scheme and fonts

### Button Styling
- Primary action: Dark (#1a1a1a) with white text
- Secondary action: Outlined with dark border
- Border radius: 8px
- Height: 40px for standard buttons

### Empty State Pattern
- Centered content
- Large title (32px)
- Descriptive subtitle (16px, color: #666)
- Single clear call-to-action button
- Minimalist design

### Modal Pattern
- Max width: 500px
- Rounded corners: 12px
- Padding: 32px
- Overlay backdrop: `rgba(0, 0, 0, 0.5)`
- Close button: X icon in top right

## Typography Scale
- Page titles: 28-32px, semi-bold
- Section titles: 20-24px, semi-bold
- Body text: 14-16px, regular
- Captions/hints: 12-14px, regular
- Font family: SF Pro (already in use)

## Color Palette (Existing)
- Primary dark: #1a1a1a
- Primary text: #333333
- Secondary text: #666666
- Light gray: #999999
- Background: #f5f5f5
- White: #ffffff
- Accent blue: #4a90e2
- Border: #e0e0e0

## Spacing Scale (Existing)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

## Component Hierarchy

**Priority Components:**
1. BusinessProfileBlurOverlay (highest priority)
2. GlobalBusinessSearch modal
3. PersonalAccountForm
4. MyBusinesses page
5. Rebranding updates (can be done first/parallel)

**Reusable Patterns:**
- Empty state layout (used in multiple places)
- Search input with icon
- Dark CTA buttons
- Modal structure
- Sidebar navigation (already exists in broker dashboard)
