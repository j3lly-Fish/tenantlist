# Specification: Tenant Dashboard Redesign

## Goal
Redesign the tenant dashboard to include a business profile onboarding flow with blur overlay, global business search functionality, duplicate prevention, and rebrand the entire application from "zyx" to "waltre".

## User Stories
- As a new tenant user, I want to see a clear onboarding flow that guides me to add my business profile so I can start using the platform
- As a tenant user, I want to search for my existing business in a global database before creating a duplicate so I can link my account to the correct business
- As a tenant user returning to the platform, I want to see my business portfolio and easily manage multiple business profiles

## Specific Requirements

**Business Profile Blur Overlay**
- Display blur overlay on tenant dashboard when user has zero associated businesses
- Use CSS `backdrop-filter: blur(8px)` with semi-transparent white overlay `rgba(255, 255, 255, 0.8)`
- Show centered card with "Begin your journey" title (32px, semi-bold) and subtitle "Add your businesses and space needs so landlords can begin sending you locations."
- Include centered "+ Add Business" button (dark #1a1a1a, white text, 8px border radius)
- Overlay should cover entire dashboard content including KPI cards and business listings
- Remove overlay immediately after user successfully adds first business to their portfolio
- Check user's business count on dashboard mount and persist blur state until business is added

**Global Business Search Modal**
- Open modal when "+ Add Business" button is clicked
- Display modal title "Select your business profile" and subtitle "Create your personal profile, you will then be able to create your business pages"
- Include search input field with placeholder "Search for your business" and search icon
- Search should query ALL businesses in database (not filtered by user_id) using ILIKE query on business name field
- Display search results showing company name, logo (if available), location/city (optional), and verification badge
- Show "Can't find your business?" empty state message when no results found
- Include "Create New Business" button (dark button, centered) that appears when business not found
- Modal should have max-width 500px, rounded corners 12px, padding 32px, backdrop overlay rgba(0, 0, 0, 0.5)

**Duplicate Business Prevention Flow**
- When user clicks "Create New Business", check if business name already exists globally before proceeding
- Create backend endpoint POST `/api/businesses/check-duplicate` that accepts company name and returns boolean
- If duplicate detected, show warning message "This business already exists. Please search for and select the existing business."
- Redirect user back to global search modal if duplicate found
- Only proceed to business creation form if no duplicate exists
- Prevent API call to create business if name matches existing business in database

**Add Existing Business to Portfolio**
- When user selects existing business from global search results, add business to their portfolio
- Create backend endpoint POST `/api/user/businesses` that accepts businessId and links it to current user
- Create junction table approach or use existing user-business relationship structure
- Update user's business count immediately after successful addition
- Close modal and remove blur overlay after business is added to portfolio
- Show success message confirming business was added to portfolio

**Personal Account Form Integration**
- Open personal account creation form when user clicks "Create New Business" and no duplicate exists
- Display form title "Create Your Personal Account" and subtitle "Create your personal profile, you will then be able to create your business profile"
- Include profile picture upload section (320x320, JPG/PNG/GIF, max 10MB) with placeholder avatar and "Upload Profile Image" link
- Form fields: First Name (required), Last Name (required), Company Name (required with autocomplete), Phone Number (required), Email (required)
- Validate all required fields before submission with inline error messages
- Company Name field should include autocomplete search to prevent duplicates during typing
- Submit button "Create Personal Account" (dark, full width) that proceeds to business profile creation
- Reuse existing BusinessProfileModal component structure and validation patterns

**Project Rebranding: zyx to waltre**
- Replace all instances of "zyx" brand name with "waltre" throughout application codebase
- Update Logo component at `/src/frontend/components/Logo.tsx` to display "waltre" instead of "zyx"
- Change logo display to include "waltre 🔍" (with search icon emoji) matching new brand identity
- Update modal subtitle in SignupModal at line 287 from "Get started with ZYX" to "Get started with Waltre"
- Update aria-label in Logo component from "zyx logo" to "waltre logo"
- Search and replace all case variations (zyx, ZYX, Zyx) across all frontend and backend files
- Update environment variable VITE_APP_NAME to "waltre" in .env files
- Update package.json project name field to "waltre" or appropriate format
- Check and update any documentation files, README, comments containing old brand name

**My Businesses Page**
- Create new page component at `/src/frontend/pages/MyBusinesses.tsx`
- Display page title "Portfolio Overview (X)" where X is count of user's businesses
- Show subtitle "Monitor your properties to seek tenant engagement"
- Include "+ Add Business" button in top right corner (dark button)
- Display user's businesses in card or list view format showing business name, logo, category, and status
- Show "Begin your journey" blur overlay when businesses array is empty
- Reuse BusinessCard component from existing codebase for consistent styling
- Add navigation link to "My Businesses" in tenant dashboard sidebar menu

**Backend API Endpoints**
- GET `/api/businesses/search?query={searchTerm}` - Global search across all businesses with ILIKE query on name field, return array of businesses with logo_url, name, category, and verification status
- POST `/api/businesses/check-duplicate` - Accept JSON body with companyName field, query businesses table for exact match, return boolean exists field and business object if found
- POST `/api/user/businesses` - Accept JSON body with businessId field, create relationship between current user and business, return success boolean and relationship data
- GET `/api/user/businesses` - Return all businesses associated with current authenticated user, include business count in response

## Visual Design

**`planning/visuals/README.md`**
- Blur overlay uses backdrop-filter blur(8px) with semi-transparent white rgba(255, 255, 255, 0.8) background
- Empty state card has white background, rounded corners 12px, subtle shadow for depth
- CTA buttons are dark #1a1a1a with white text, 8px border radius, 40px height for standard buttons
- Modal structure uses max-width 500px, rounded corners 12px, padding 32px, dark backdrop rgba(0, 0, 0, 0.5)
- Typography uses SF Pro font family with 32px semi-bold for titles, 16px regular for subtitles, 14-16px for body text
- Logo displays "waltre 🔍" with search icon integrated into brand identity
- Page titles use 28-32px semi-bold, section titles 20-24px semi-bold, maintaining existing design system
- Color palette maintains existing values: primary dark #1a1a1a, text #333333, secondary #666666, background #f5f5f5

## Existing Code to Leverage

**BusinessProfileModal Component**
- Located at `/src/frontend/components/BusinessProfileModal.tsx`
- Provides complete business creation form with profile picture upload, validation, and error handling
- Includes logo upload functionality with file type validation (JPG/PNG/GIF) and 10MB size limit
- Form validation pattern can be reused for personal account form
- Modal backdrop click-to-close and escape key handling already implemented

**SignupModal Component Structure**
- Located at `/src/frontend/components/SignupModal.tsx`
- Provides modal backdrop, container, header, and form layout patterns
- Includes role selection card UI that can be adapted for business selection
- Form validation and error display patterns are well-established
- CSS patterns in AuthModals.css provide consistent modal styling across application

**SearchInput Component**
- Located at `/src/frontend/components/SearchInput.tsx`
- Provides debounced search input (300ms default) with clear button functionality
- Handles local value state and cleanup on unmount
- Can be reused directly in global business search modal
- Includes accessibility attributes and proper ARIA labels

**Business Model and Controller**
- BusinessModel at `/src/database/models/Business.ts` includes findByUserId, findByUserIdPaginated with search parameter
- Add new method findAll with search parameter for global search functionality
- BusinessController at `/src/controllers/BusinessController.ts` handles business listing, creation, and pagination
- Extend controller to add checkDuplicate method and addBusinessToUser method
- Existing validation and error handling patterns should be followed

**TopNavigation and Logo Components**
- TopNavigation at `/src/frontend/components/TopNavigation.tsx` displays logo, navigation tabs, and user profile
- Logo component at `/src/frontend/components/Logo.tsx` renders brand name with link to dashboard
- Update Logo component to change "zyx" to "waltre" for global rebrand
- Maintain existing navigation structure and styling patterns

## Out of Scope
- Business profile editing functionality from My Businesses page (users can only add businesses in this spec)
- Business portfolio analytics or performance metrics on My Businesses page
- Business verification system or verification badge functionality (display only if exists)
- Multi-business management dashboard with switching between business contexts
- Business ownership transfer or changing which user created the business
- Removing or deleting businesses from user portfolio (only adding is in scope)
- Business activity feed showing recent actions or notifications per business
- Team member management within business profiles or inviting collaborators
- Email notifications when business is added to portfolio
- Advanced search filters in global business search (location, category, verified status filters are out of scope)
